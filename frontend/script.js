// Configuration
const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbwoGNedslErlZ7Av6owq3Pv6OjmPnSKAAZaEOVfxv3Qfl7b7pm_NbRdVjaPmQGPvA5DKA/exec';

// User Management
function initUser() {
    let user = localStorage.getItem('easyRechargeUser');
    if (!user) {
        user = {
            userId: generateUserId(),
            role: 'customer',
            created: new Date().toISOString()
        };
        localStorage.setItem('easyRechargeUser', JSON.stringify(user));
    }
    return JSON.parse(user);
}

function generateUserId() {
    return 'USER_' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function getUser() {
    const user = localStorage.getItem('easyRechargeUser');
    return user ? JSON.parse(user) : null;
}

// Clipboard
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent || element.innerText;
    
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

// Order Management
async function sendOrder(orderData) {
    const user = getUser();
    if (!user) {
        alert('User not initialized. Please refresh the page.');
        return;
    }

    const payload = {
        ...orderData,
        userId: user.userId,
        userRole: user.role,
        timestamp: new Date().toISOString()
    };

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        if (result.success) {
            alert('Order submitted successfully! Order ID: ' + result.orderId);
            return result.orderId;
        } else {
            alert('Error: ' + result.error);
            return null;
        }
    } catch (error) {
        console.error('Error submitting order:', error);
        alert('Failed to submit order. Please try again.');
        return null;
    }
}

async function getOrders(userId) {
    try {
        const response = await fetch(`${BACKEND_URL}?userId=${userId}`);
        const result = await response.json();
        
        if (result.success) {
            return result.orders;
        } else {
            console.error('Error fetching orders:', result.error);
            return [];
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
}

// Form Validation
function validateRequiredFields(fields) {
    for (const [key, value] of Object.entries(fields)) {
        if (!value || value.toString().trim() === '') {
            alert(`Please fill in ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
            return false;
        }
    }
    return true;
}

// SIM Order Form Handler
function setupSimOrderForm() {
    const form = document.getElementById('simOrderForm');
    const serviceSelect = document.getElementById('service');
    const quantityInput = document.getElementById('quantity');
    const totalDisplay = document.getElementById('totalAmount');
    const user = getUser();

    function calculateTotal() {
        const service = serviceSelect.value;
        const quantity = parseInt(quantityInput.value) || 1;
        
        if (service) {
            const price = getPrice('sim', service, user.role);
            const total = price * quantity;
            totalDisplay.textContent = total.toLocaleString() + ' MMK';
        }
    }

    serviceSelect.addEventListener('change', calculateTotal);
    quantityInput.addEventListener('input', calculateTotal);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            type: 'sim',
            service: serviceSelect.value,
            phoneNumber: document.getElementById('phoneNumber').value,
            quantity: parseInt(quantityInput.value),
            total: getPrice('sim', serviceSelect.value, user.role) * parseInt(quantityInput.value),
            paymentMethod: document.getElementById('paymentMethod').value,
            transactionId: document.getElementById('transactionId').value
        };

        if (!validateRequiredFields(formData)) return;

        const orderId = await sendOrder(formData);
        if (orderId) {
            form.reset();
            totalDisplay.textContent = '0 MMK';
        }
    });
}

// Game Order Form Handler
function setupGameOrderForm() {
    const form = document.getElementById('gameOrderForm');
    const gameSelect = document.getElementById('game');
    const quantityInput = document.getElementById('quantity');
    const totalDisplay = document.getElementById('totalAmount');
    const user = getUser();

    function calculateTotal() {
        const game = gameSelect.value;
        const quantity = parseInt(quantityInput.value) || 1;
        
        if (game) {
            const price = getPrice('game', game, user.role);
            const total = price * quantity;
            totalDisplay.textContent = total.toLocaleString() + ' MMK';
        }
    }

    gameSelect.addEventListener('change', calculateTotal);
    quantityInput.addEventListener('input', calculateTotal);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            type: 'game',
            game: gameSelect.value,
            gameId: document.getElementById('gameId').value,
            server: document.getElementById('server').value,
            quantity: parseInt(quantityInput.value),
            total: getPrice('game', gameSelect.value, user.role) * parseInt(quantityInput.value),
            paymentMethod: document.getElementById('paymentMethod').value,
            transactionId: document.getElementById('transactionId').value
        };

        if (!validateRequiredFields(formData)) return;

        const orderId = await sendOrder(formData);
        if (orderId) {
            form.reset();
            totalDisplay.textContent = '0 MMK';
        }
    });
}

// SMM Order Form Handler
function setupSmmOrderForm() {
    const form = document.getElementById('smmOrderForm');
    const platformSelect = document.getElementById('platform');
    const serviceSelect = document.getElementById('service');
    const quantityInput = document.getElementById('quantity');
    const totalDisplay = document.getElementById('totalAmount');
    const user = getUser();

    function calculateTotal() {
        const service = serviceSelect.value;
        const quantity = parseInt(quantityInput.value) || 1;
        
        if (service) {
            const price = getPrice('smm', service, user.role);
            const total = price * quantity;
            totalDisplay.textContent = total.toLocaleString() + ' MMK';
        }
    }

    serviceSelect.addEventListener('change', calculateTotal);
    quantityInput.addEventListener('input', calculateTotal);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            type: 'smm',
            platform: platformSelect.value,
            service: serviceSelect.value,
            targetUrl: document.getElementById('targetUrl').value,
            quantity: parseInt(quantityInput.value),
            total: getPrice('smm', serviceSelect.value, user.role) * parseInt(quantityInput.value),
            paymentMethod: document.getElementById('paymentMethod').value,
            transactionId: document.getElementById('transactionId').value
        };

        if (!validateRequiredFields(formData)) return;

        const orderId = await sendOrder(formData);
        if (orderId) {
            form.reset();
            totalDisplay.textContent = '0 MMK';
        }
    });
}

// P2P Exchange Form Handler
function setupP2PForm() {
    const form = document.getElementById('p2pForm');
    const amountInput = document.getElementById('amount');
    const feeDisplay = document.getElementById('feeAmount');
    const receiveDisplay = document.getElementById('receiveAmount');

    function calculateExchange() {
        const amount = parseFloat(amountInput.value) || 0;
        const { fee, receive } = calculateP2P(amount);
        
        feeDisplay.textContent = fee.toLocaleString() + ' MMK';
        receiveDisplay.textContent = receive.toLocaleString() + ' MMK';
    }

    amountInput.addEventListener('input', calculateExchange);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const amount = parseFloat(amountInput.value);
        const { fee, receive } = calculateP2P(amount);
        
        const formData = {
            type: 'p2p',
            fromMethod: document.getElementById('fromMethod').value,
            toMethod: document.getElementById('toMethod').value,
            amountSent: amount,
            fee: fee,
            amountReceive: receive,
            accountDetails: document.getElementById('accountDetails').value,
            transactionId: document.getElementById('transactionId').value
        };

        if (!validateRequiredFields(formData)) return;

        if (amount < 1000) {
            alert('Minimum exchange amount is 1,000 MMK');
            return;
        }

        const orderId = await sendOrder(formData);
        if (orderId) {
            form.reset();
            feeDisplay.textContent = '0 MMK';
            receiveDisplay.textContent = '0 MMK';
        }
    });
}

// Status Page
async function loadOrderStatus() {
    const user = getUser();
    if (!user) return;

    const orders = await getOrders(user.userId);
    const tbody = document.getElementById('ordersTable');
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No orders found</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>${new Date(order.timestamp).toLocaleString()}</td>
            <td>${order.orderId}</td>
            <td>${order.type}</td>
            <td>${order.service || order.game || order.platform || 'P2P Exchange'}</td>
            <td>${order.total ? order.total.toLocaleString() + ' MMK' : '-'}</td>
            <td class="status-${order.status}">${order.status}</td>
        </tr>
    `).join('');
}

// Profile Page
async function loadProfile() {
    const user = getUser();
    if (!user) return;

    // Update user info
    document.getElementById('userId').textContent = user.userId;
    document.getElementById('userRole').textContent = user.role.toUpperCase();

    // Get orders for statistics
    const orders = await getOrders(user.userId);
    
    // Calculate statistics
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalP2P = orders
        .filter(order => order.type === 'p2p')
        .reduce((sum, order) => sum + (order.amountSent || 0), 0);

    // Update statistics
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('totalSpent').textContent = totalSpent.toLocaleString() + ' MMK';
    document.getElementById('totalP2P').textContent = totalP2P.toLocaleString() + ' MMK';

    // Show last 10 orders
    const lastOrders = orders.slice(-10).reverse();
    const tbody = document.getElementById('recentOrders');
    
    if (lastOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No recent orders</td></tr>';
        return;
    }

    tbody.innerHTML = lastOrders.map(order => `
        <tr>
            <td>${new Date(order.timestamp).toLocaleDateString()}</td>
            <td>${order.type}</td>
            <td>${order.service || order.game || order.platform || 'P2P'}</td>
            <td>${order.total ? order.total.toLocaleString() + ' MMK' : '-'}</td>
            <td class="status-${order.status}">${order.status}</td>
        </tr>
    `).join('');
}

// FAQ Accordion
function setupFAQ() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            answer.classList.toggle('active');
            
            // Close other answers
            faqQuestions.forEach(otherQuestion => {
                if (otherQuestion !== question) {
                    otherQuestion.nextElementSibling.classList.remove('active');
                }
            });
        });
    });
}

// Initialize page-specific functionality
document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    const page = path.split('/').pop();
    
    initUser();
    
    switch(page) {
        case 'order_sim.html':
            setupSimOrderForm();
            break;
        case 'order_game.html':
            setupGameOrderForm();
            break;
        case 'order_smm.html':
            setupSmmOrderForm();
            break;
        case 'pay.html':
            setupP2PForm();
            break;
        case 'status.html':
            loadOrderStatus();
            break;
        case 'profile.html':
            loadProfile();
            break;
        case 'faq.html':
            setupFAQ();
            break;
    }
});
