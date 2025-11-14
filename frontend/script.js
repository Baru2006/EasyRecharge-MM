import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot, collection, query, serverTimestamp, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Set debug logging for Firestore (useful during development)
setLogLevel('Debug');

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Global Firebase variables
let db, auth;
let userId = 'loading'; // Will be set after auth
let isAuthReady = false;

// Path Definitions
const publicPath = `artifacts/${appId}/public/data/settings`;
const privateOrderCollection = (uid) => `artifacts/${appId}/users/${uid}/orders`;
const CONFIG_DOC_REF = publicPath + '/config'; // Document path for maintenance status

/**
 * Initializes Firebase, authenticates, and sets up real-time maintenance check.
 */
async function initializeFirebase() {
    try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        
        // 1. Authenticate User
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                userId = user.uid;
            } else {
                // Sign in anonymously if no token is available
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                    userId = auth.currentUser.uid;
                } else {
                    await signInAnonymously(auth);
                    userId = auth.currentUser.uid;
                }
            }
            
            isAuthReady = true;
            console.log("Firebase Auth Ready. User ID:", userId);
            
            // 2. Start Maintenance Check and Load Settings
            setupMaintenanceListener();
            
            // 3. Set up forms and listeners
            setupOrderForms();
            displayAdminPhone();
        });

    } catch (error) {
        console.error("Firebase Initialization Error:", error);
    }
}

/**
 * Real-time listener for maintenance status and admin settings.
 */
function setupMaintenanceListener() {
    console.log("Setting up Maintenance Listener...");
    const configDocRef = doc(db, CONFIG_DOC_REF);

    onSnapshot(configDocRef, (docSnap) => {
        let isMaintenanceActive = false;
        let adminPhone = '09791134604';

        if (docSnap.exists()) {
            const data = docSnap.data();
            isMaintenanceActive = data.isMaintenanceActive === true;
            adminPhone = data.adminPhone || '09791134604';
        } else {
             // If config doesn't exist, create it with default values
             setDoc(configDocRef, { 
                isMaintenanceActive: false, 
                adminPhone: '09791134604', 
                lastUpdated: serverTimestamp() 
            }, { merge: true }).catch(e => console.error("Error setting default config:", e));
        }

        const currentPage = window.location.pathname.split('/').pop();
        
        // Maintenance Redirection Logic
        if (isMaintenanceActive && currentPage !== 'maintenance.html') {
            console.warn("Maintenance is ACTIVE. Redirecting...");
            window.location.href = 'maintenance.html';
        } else if (!isMaintenanceActive && currentPage === 'maintenance.html') {
            console.log("Maintenance is INACTIVE. Redirecting to index.");
            window.location.href = 'index.html';
        }
        
        // Update Admin Phone display across all pages
        updateAdminPhoneDisplay(adminPhone);

    }, (error) => {
        console.error("Error fetching config:", error);
    });
}

/**
 * Updates the displayed Admin Phone number across all relevant elements.
 * @param {string} phone 
 */
function updateAdminPhoneDisplay(phone) {
    document.querySelectorAll('.admin-phone-display').forEach(el => {
        el.textContent = phone;
    });
}

/**
 * Attaches submit listeners to all order forms.
 */
function setupOrderForms() {
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', handleSubmit);
    });
}

/**
 * Handles form submission for all order types.
 * @param {Event} event 
 */
async function handleSubmit(event) {
    event.preventDefault();

    if (!isAuthReady || userId === 'loading') {
        alertModal('Error', 'Authentication is still loading. Please try again in a moment.', 'red');
        return;
    }

    const form = event.target;
    const formType = form.dataset.formType;
    const submitButton = form.querySelector('button[type="submit"]');

    if (!formType) {
        console.error("Form is missing data-form-type attribute.");
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = '...တင်ပို့နေသည် (Submitting)';

    const formData = new FormData(form);
    const data = {
        orderType: formType,
        timestamp: serverTimestamp(),
        status: 'Pending', // Initial status
        userId: userId
    };

    // Extract form fields
    for (const [key, value] of formData.entries()) {
        // Use the hidden field for total if available
        if (key === 'total_hidden') {
             data.total = parseFloat(value) || 0;
        } else if (key === 'receive_hidden') {
             data.amount_receive = parseFloat(value) || 0;
        } else if (key === 'fee_hidden') {
             data.fee = parseFloat(value) || 0;
        } else if (key !== 'total' && key !== 'receive' && key !== 'fee') {
             data[key] = value;
        }
    }
    
    // Convert transactionId to uppercase for consistency
    data.transactionId = (data.transactionId || '').toUpperCase();
    
    // Add extra details for specific forms
    if (formType === 'p2p') {
        data.exchangeSummary = `${data.fromMethod} -> ${data.toMethod}`;
        data.total = parseFloat(formData.get('amount')) || 0; // P2P total is the amount sent
    } else {
        data.total = data.total || 0; // Ensure total exists
    }


    try {
        const ordersRef = collection(db, privateOrderCollection(userId));
        await setDoc(doc(ordersRef), data);

        alertModal('အော်ဒါအောင်မြင်ပါသည်!', 
                   'သင်၏ အော်ဒါကို လက်ခံရရှိပါပြီ။ မကြာမီ Admin မှ စစ်ဆေး၍ ဆောင်ရွက်ပေးပါမည်။', 
                   'green');
                   
        form.reset();
        
        // Re-run the update functions to reset dropdown states if they exist
        if (typeof updateSimForm === 'function' && formType === 'sim_game') updateSimForm();
        if (typeof updateGameForm === 'function' && formType === 'game') updateGameForm();
        if (typeof updateSMMForm === 'function' && formType === 'smm') updateSMMForm();
        if (typeof updateP2PForm === 'function' && formType === 'p2p') updateP2PForm();


    } catch (e) {
        console.error("Error adding document: ", e);
        alertModal('Error', 'အော်ဒါတင်ရာတွင် အမှားအယွင်းရှိပါသည်။ ကွန်ရက်ကို စစ်ဆေး၍ ထပ်မံကြိုးစားပါ။', 'red');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'အော်ဒါတင်မည်';
    }
}

/**
 * Display a custom modal instead of alert().
 * @param {string} title 
 * @param {string} message 
 * @param {string} color 
 */
function alertModal(title, message, color) {
    let modal = document.getElementById('custom-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'custom-modal';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 opacity-0 pointer-events-none';
        modal.innerHTML = `
            <div class="bg-white rounded-xl p-6 shadow-2xl max-w-sm w-full transform transition-transform duration-300 scale-90">
                <h3 id="modal-title" class="text-xl font-bold mb-3"></h3>
                <p id="modal-message" class="text-gray-600 mb-6"></p>
                <div class="flex justify-end">
                    <button id="modal-close-btn" class="px-4 py-2 text-white font-semibold rounded-lg transition duration-150">ပိတ်မည်</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('modal-close-btn').addEventListener('click', () => {
            modal.classList.add('opacity-0', 'pointer-events-none');
            modal.querySelector('div').classList.remove('scale-100');
            modal.querySelector('div').classList.add('scale-90');
        });
    }

    const titleEl = document.getElementById('modal-title');
    const messageEl = document.getElementById('modal-message');
    const closeBtn = document.getElementById('modal-close-btn');

    titleEl.textContent = title;
    messageEl.textContent = message;

    let btnColor;
    if (color === 'green') {
        btnColor = 'bg-green-600 hover:bg-green-700';
    } else if (color === 'red') {
        btnColor = 'bg-red-600 hover:bg-red-700';
    } else {
        btnColor = 'bg-blue-600 hover:bg-blue-700';
    }
    
    closeBtn.className = `px-4 py-2 text-white font-semibold rounded-lg transition duration-150 ${btnColor}`;

    modal.classList.remove('opacity-0', 'pointer-events-none');
    modal.querySelector('div').classList.remove('scale-90');
    modal.querySelector('div').classList.add('scale-100');
}

// Ensure utility functions exist (placeholder for form-specific scripts)
const displayAdminPhone = () => { /* Logic handled in updateAdminPhoneDisplay */ };


// Initialize on page load
initializeFirebase();

                      
