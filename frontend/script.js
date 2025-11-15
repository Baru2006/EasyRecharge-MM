/* ---
BasseinPay: Telegram-Style Frontend
script.js
--- */

(function () {
  "use strict";

  // --- 1. Global State & Config ---

  let appConfig = null;
  let isMaintenance = false;

  // Price Database (as requested in prompt)
  const PRICE_DB = {
    sim: {
      MPT: {
        "1GB": 1300,
        "2GB": 2400,
        "6GB": 6900,
        "10GB": 10000,
      },
      Ooredoo: {
        "1GB": 1000,
        "5GB": 4500,
        "15GB": 12000,
      },
      ATOM: {
        "1.5GB": 1500,
        "7GB": 7000,
      },
      Mytel: {
        "2GB": 1800,
        "8GB": 8000,
      },
    },
    smm: {
      "Facebook-Likes": 15, // Price per 1 like
      "IG-Followers": 20, // Price per 1 follower
      "TikTok-Views": 1, // Price per 1 view
    },
    p2p: {
      fee_percent: 1.5, // 1.5% fee
      min_fee: 50,
    },
  };

  // --- 2. Initialization ---

  document.addEventListener("DOMContentLoaded", () => {
    // This is the main entry point
    loadConfigAndCheckMaintenance();
  });

  /**
   * Fetches config.json and checks for maintenance mode.
   * This is the first function that runs.
   */
  async function loadConfigAndCheckMaintenance() {
    try {
      const response = await fetch(`config.json?v=${Date.now()}`); // Cache-bust
      if (!response.ok) throw new Error("config.json not found");
      appConfig = await response.json();
      isMaintenance = appConfig.maintenance === true;

      const currentPage = document.body.dataset.page;

      if (isMaintenance) {
        // Maintenance is ON
        if (currentPage !== "maintenance") {
          // Redirect all other pages to maintenance.html
          window.location.href = "maintenance.html";
        } else {
          // We are on maintenance.html, render it
          initMaintenancePage();
        }
      } else {
        // Maintenance is OFF
        if (currentPage === "maintenance") {
          // Redirect from maintenance.html to index
          window.location.href = "index.html";
        } else {
          // Proceed with normal app initialization
          initializeApp();
        }
      }
    } catch (error) {
      console.error("Failed to load config:", error);
      // Failsafe: if config fails, assume no maintenance and proceed
      initializeApp();
    }
  }

  /**
   * Initializes all app functionality AFTER maintenance check.
   */
  function initializeApp() {
    applyTheme(); // 1. Set Dark/Light Mode
    initPageSpecifics(); // 2. Run page-level logic
  }

  /**
   * Applies the theme (dark/light) from localStorage
   */
  function applyTheme() {
    const isDarkMode =
      localStorage.getItem("basseinpay_theme") === "dark";
    document.body.classList.toggle("dark-mode", isDarkMode);
    // Sync toggle switch if it exists
    const toggle = document.getElementById("theme-toggle");
    if (toggle) {
      toggle.checked = isDarkMode;
    }
  }

  /**
   * Routes to the correct initializer based on body[data-page]
   */
  function initPageSpecifics() {
    const page = document.body.dataset.page;
    switch (page) {
      case "index":
        initIndex();
        break;
      case "order_sim":
        initSimOrder();
        break;
      case "order_game":
        initGameOrder();
        break;
      case "order_smm":
        initSmmOrder();
        break;
      case "pay":
        initPay();
        break;
      case "services":
        initServices();
        break;
      case "telegram_group":
        initTelegramGroup();
        break;
    }
  }

  // --- 3. Page Initializers ---

  function initIndex() {
    // Init Theme Toggle
    const toggle = document.getElementById("theme-toggle");
    if (toggle) {
      toggle.addEventListener("change", () => {
        const isDarkMode = toggle.checked;
        document.body.classList.toggle("dark-mode", isDarkMode);
        localStorage.setItem(
          "basseinpay_theme",
          isDarkMode ? "dark" : "light"
        );
      });
    }
  }

  function initSimOrder() {
    const form = document.getElementById("sim-order-form");
    const providerSelect = document.getElementById("sim-provider");
    const packageSelect = document.getElementById("sim-package");
    const phoneInput = document.getElementById("sim-phone");

    // Load last used phone
    phoneInput.value = loadLastInput("sim_phone");

    // Populate packages on provider change
    providerSelect.addEventListener("change", () => {
      populateSimPackages(providerSelect.value, packageSelect);
      calculateSimPrice();
    });

    // Calculate price on package change
    packageSelect.addEventListener("change", calculateSimPrice);

    // Initial setup
    populateSimPackages(providerSelect.value, packageSelect);
    calculateSimPrice();

    // Handle form submit
    form.addEventListener("submit", (e) =>
      handleFormSubmit(e, "SIM Recharge")
    );
  }

  function initGameOrder() {
    const form = document.getElementById("game-order-form");
    const amountSelect = document.getElementById("game-amount");

    // Simple price calculation for demo
    amountSelect.addEventListener("change", calculateGamePrice);
    calculateGamePrice(); // Initial calc

    // Handle form submit
    form.addEventListener("submit", (e) =>
      handleFormSubmit(e, "Game Top-up")
    );
  }

  function initSmmOrder() {
    const form = document.getElementById("smm-order-form");
    const serviceSelect = document.getElementById("smm-service");
    const quantityInput = document.getElementById("smm-quantity");
    const linkInput = document.getElementById("smm-link");

    // Load last used link
    linkInput.value = loadLastInput("smm_link");

    // Calculate price on change
    serviceSelect.addEventListener("change", calculateSmmPrice);
    quantityInput.addEventListener("input", calculateSmmPrice);

    calculateSmmPrice(); // Initial calc

    // Handle form submit
    form.addEventListener("submit", (e) =>
      handleFormSubmit(e, "SMM Service")
    );
  }

  function initPay() {
    const form = document.getElementById("pay-form");
    const fromSelect = document.getElementById("pay-from");
    const toSelect = document.getElementById("pay-to");
    const amountInput = document.getElementById("pay-amount");

    // P2P Logic: Prevent same 'from' and 'to'
    const syncP2PSelects = (changedSelect) => {
      const otherSelect =
        changedSelect === fromSelect ? toSelect : fromSelect;
      if (changedSelect.value === otherSelect.value) {
        // If they match, find the first non-matching option
        for (const option of otherSelect.options) {
          if (option.value !== changedSelect.value) {
            otherSelect.value = option.value;
            break;
          }
        }
      }
      calculateP2PPrice();
    };

    fromSelect.addEventListener("change", () => syncP2PSelects(fromSelect));
    toSelect.addEventListener("change", () => syncP2PSelects(toSelect));
    amountInput.addEventListener("input", calculateP2PPrice);

    calculateP2PPrice(); // Initial calc

    // Handle form submit
    form.addEventListener("submit", (e) =>
      handleFormSubmit(e, "P2P Exchange")
    );
  }

  function initServices() {
    const container = document.getElementById("services-list");
    if (!container) return;

    let html = "";

    // SIM Services
    html += '<div class="card"><h2>📱 SIM Data Packs</h2></div>';
    for (const provider in PRICE_DB.sim) {
      html += `<div class="card"><h3>${provider}</h3>`;
      for (const pkg in PRICE_DB.sim[provider]) {
        html += `
          <div class="list-item">
            <div class="list-item-content">
              <span class="list-item-title">${pkg}</span>
            </div>
            <span class="list-item-action">${PRICE_DB.sim[provider][pkg]} MMK</span>
          </div>
        `;
      }
      html += `</div>`;
    }

    // SMM Services
    html += '<div class="card"><h2>🚀 SMM Services</h2></div>';
    html += '<div class="card">';
    html += `
      <div class="list-item">
        <div class="list-item-content">
          <span class="list-item-title">Facebook Page Likes</span>
        </div>
        <span class="list-item-subtitle">1,500 MMK / 100</span>
      </div>
      <div class="list-item">
        <div class="list-item-content">
          <span class="list-item-title">Instagram Followers</span>
        </div>
        <span class="list-item-subtitle">2,000 MMK / 100</span>
      </div>
    </div>`;

    // P2P Services
    html += '<div class="card"><h2>💸 P2P Exchange</h2></div>';
    html += '<div class="card">';
    html += `
      <div class="list-item">
        <div class="list-item-content">
          <span class="list-item-title">Wave ⇄ KBZ/AYA</span>
        </div>
        <span class="list-item-action">${PRICE_DB.p2p.fee_percent}% Fee</span>
      </div>
    </div>`;

    container.innerHTML = html;
  }

  function initTelegramGroup() {
    const summaryContainer = document.getElementById(
      "success-summary-content"
    );
    const joinButton = document.getElementById("telegram-join-button");

    if (joinButton && appConfig && appConfig.telegramLink) {
      joinButton.href = appConfig.telegramLink;
    }

    // Load the last order from localStorage
    const orderData = localStorage.getItem("basseinpay_last_order");
    if (orderData && summaryContainer) {
      try {
        const details = JSON.parse(orderData);
        summaryContainer.innerHTML = `
          <div class="summary-item">
            <strong>Order Type:</strong>
            <span>${details.type || "N/A"}</span>
          </div>
          <div class="summary-item">
            <strong>Order ID:</strong>
            <span>${details.orderId || "N/A"}</span>
          </div>
          <div class="summary-item">
            <strong>Total:</strong>
            <span style="color: var(--primary-color);">${
              details.total || "N/A"
            }</span>
          </div>
        `;
      } catch (e) {
        console.error("Could not parse last order", e);
        summaryContainer.innerHTML =
          "<p>Could not load order summary.</p>";
      }
    } else if (summaryContainer) {
      summaryContainer.innerHTML =
        "<p>No order summary found.</p>";
    }
  }

  function initMaintenancePage() {
    const msgElement = document.getElementById("maintenance-message");
    const btnElement = document.getElementById("maintenance-telegram-btn");
    if (msgElement && appConfig) {
      msgElement.textContent = appConfig.message;
    }
    if (btnElement && appConfig) {
      btnElement.href = appConfig.telegramLink;
    }
  }

  // --- 4. Price Calculation Logic ---

  function populateSimPackages(provider, packageSelect) {
    const packages = PRICE_DB.sim[provider] || {};
    packageSelect.innerHTML = ""; // Clear old options
    for (const pkg in packages) {
      const option = document.createElement("option");
      option.value = pkg;
      option.textContent = `${pkg} - ${packages[pkg]} MMK`;
      packageSelect.appendChild(option);
    }
  }

  function calculateSimPrice() {
    const provider = document.getElementById("sim-provider").value;
    const pkg = document.getElementById("sim-package").value;
    const price = PRICE_DB.sim[provider]?.[pkg] || 0;
    updatePriceDisplay(price);
  }

  function calculateGamePrice() {
    // This is a demo. Real app might have complex DB.
    const price = document.getElementById("game-amount").value || 0;
    updatePriceDisplay(price);
  }

  function calculateSmmPrice() {
    const service = document.getElementById("smm-service").value;
    const quantity =
      parseInt(document.getElementById("smm-quantity").value) || 0;
    const unitPrice = PRICE_DB.smm[service] || 0;
    const price = unitPrice * quantity;
    updatePriceDisplay(price);
  }

  function calculateP2PPrice() {
    const amount =
      parseFloat(document.getElementById("pay-amount").value) || 0;
    const feePercent = PRICE_DB.p2p.fee_percent / 100;
    const minFee = PRICE_DB.p2p.min_fee;

    let fee = Math.max(amount * feePercent, minFee);
    if (amount === 0) fee = 0;

    const total = amount + fee;
    const receive = amount;

    // Update UI for P2P
    document.getElementById("p2p-fee").textContent = `${fee.toFixed(2)} MMK`;
    document.getElementById(
      "p2p-receive-amount"
    ).textContent = `${receive.toFixed(2)} MMK`;
    updatePriceDisplay(total); // Total to pay
  }

  function updatePriceDisplay(price) {
    const amountEl = document.getElementById("total-price-amount");
    if (amountEl) {
      amountEl.textContent = `${price.toLocaleString()} MMK`;
    }
    // Also store it in a hidden input for form submission
    const hiddenInput = document.getElementById("total-price-hidden");
    if (hiddenInput) {
      hiddenInput.value = `${price} MMK`;
    }
  }

  // --- 5. Core Form & Receipt Logic ---

  /**
   * Handles the submission of any order form
   */
  async function handleFormSubmit(event, orderType) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Processing...";
    showToast("Generating your receipt...", "info");

    try {
      const formData = new FormData(form);
      const slipInput = form.querySelector('input[type="file"]');
      let slipDataUrl = null;

      if (slipInput && slipInput.files.length > 0) {
        slipDataUrl = await readAndResizeImage(slipInput.files[0]);
      }

      // Build a details object from the form
      const orderDetails = buildOrderDetails(formData, orderType);

      // Save last inputs
      if (orderDetails.phone)
        saveLastInput("sim_phone", orderDetails.phone);
      if (orderDetails.link) saveLastInput("smm_link", orderDetails.link);

      // Generate the receipt
      const receiptCanvas = await generateReceiptCanvas(
        orderDetails,
        slipDataUrl
      );

      // Trigger download
      downloadImage(receiptCanvas, `BasseinPay-${orderDetails.orderId}.png`);

      // Save summary to localStorage for next page
      localStorage.setItem(
        "basseinpay_last_order",
        JSON.stringify(orderDetails)
      );

      // Redirect
      showToast("Receipt downloaded! Redirecting...", "success");
      setTimeout(() => {
        window.location.href = "telegram_group.html";
      }, 1000);
    } catch (error) {
      console.error("Form submission error:", error);
      showToast(`Error: ${error.message}`, "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Again";
    }
  }

  /**
   * Reads and resizes an image file to a max width/height
   * @param {File} file - The image file
   * @returns {Promise<string>} A promise that resolves with the Data URL
   */
  function readAndResizeImage(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        return reject(new Error("File is not an image."));
      }

      const MAX_DIMENSION = 800; // Max width/height for receipt
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_DIMENSION) {
              height = Math.round((height * MAX_DIMENSION) / width);
              width = MAX_DIMENSION;
            }
          } else {
            if (height > MAX_DIMENSION) {
              width = Math.round((width * MAX_DIMENSION) / height);
              height = MAX_DIMENSION;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL("image/jpeg", 0.8)); // 80% quality JPEG
        };
        img.onerror = () => reject(new Error("Could not load image."));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("Could not read file."));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Gathers form data into a structured object
   */
  function buildOrderDetails(formData, orderType) {
    const details = {
      type: orderType,
      orderId: `BP-${Date.now()}`,
      date: new Date().toLocaleString("en-US"),
      total: formData.get("total_price") || "N/A",
      items: [],
      phone: null,
      link: null,
    };

    switch (orderType) {
      case "SIM Recharge":
        details.items.push({
          k: "Provider",
          v: formData.get("sim_provider"),
        });
        details.items.push({
          k: "Package",
          v: formData.get("sim_package"),
        });
        details.phone = formData.get("sim_phone");
        details.items.push({ k: "Phone", v: details.phone });
        break;
      case "Game Top-up":
        details.items.push({ k: "Game", v: formData.get("game_name") });
        details.items.push({ k: "Player ID", v: formData.get("game_id") });
        details.items.push({
          k: "Amount",
          v: formData.get("game_amount") + " MMK",
        });
        break;
      case "SMM Service":
        details.items.push({
          k: "Service",
          v: formData.get("smm_service"),
        });
        details.link = formData.get("smm_link");
        details.items.push({ k: "Link", v: details.link });
        details.items.push({
          k: "Quantity",
          v: formData.get("smm_quantity"),
        });
        break;
      case "P2P Exchange":
        details.items.push({ k: "From", v: formData.get("pay_from") });
        details.items.push({ k: "To", v: formData.get("pay_to") });
        details.items.push({
          k: "Amount",
          v: formData.get("pay_amount") + " MMK",
        });
        details.items.push({ k: "Fee", v: formData.get("p2p_fee") });
        break;
    }
    return details;
  }

  /**
   * Uses Canvas to draw the PNG receipt
   * @param {object} details - The order details object
   * @param {string} slipDataUrl - The Data URL of the payment slip
   * @returns {Promise<HTMLCanvasElement>} A promise resolving with the canvas
   */
  function generateReceiptCanvas(details, slipDataUrl) {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const W = 700;
      const P = 40; // Padding
      const contentW = W - P * 2;
      const baseFontSize = 24;
      const lineHeight = baseFontSize * 1.6;
      let y = P;

      // --- Calculate Height ---
      let totalHeight = P;
      totalHeight += 60; // Header
      totalHeight += lineHeight * details.items.length; // Items
      totalHeight += 60; // Total
      totalHeight += P; // Spacer
      if (slipDataUrl) {
        totalHeight += 400 + P; // Slip image (approx)
      }
      totalHeight += 60; // Watermark & Footer
      totalHeight += P;

      canvas.width = W;
      canvas.height = totalHeight;

      // --- 1. Draw Background (Telegram White) ---
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, W, totalHeight);

      // --- 2. Header ---
      y += 20;
      ctx.fillStyle = "#0088cc";
      ctx.font = `bold ${baseFontSize + 12}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText("BasseinPay", W / 2, y);
      y += 30;

      ctx.fillStyle = "#000000";
      ctx.font = `bold ${baseFontSize + 4}px Arial`;
      ctx.fillText(details.type, W / 2, (y += lineHeight));

      ctx.fillStyle = "#8a8a8e";
      ctx.font = `${baseFontSize - 6}px Arial`;
      ctx.fillText(details.date, W / 2, (y += 30));
      y += 40;

      // --- 3. Order Items ---
      ctx.textAlign = "left";
      details.items.forEach((item) => {
        ctx.fillStyle = "#8a8a8e";
        ctx.font = `500 ${baseFontSize - 4}px Arial`;
        ctx.fillText(item.k, P, y);

        ctx.fillStyle = "#000000";
        ctx.font = `600 ${baseFontSize - 2}px Arial`;
        ctx.textAlign = "right";
        ctx.fillText(item.v, W - P, y);

        y += lineHeight;
        ctx.textAlign = "left";
      });

      // --- 4. Total Price ---
      y += 20;
      ctx.beginPath();
      ctx.moveTo(P, y);
      ctx.lineTo(W - P, y);
      ctx.strokeStyle = "#e0e0e0";
      ctx.stroke();
      y += 40;

      ctx.fillStyle = "#000000";
      ctx.font = `600 ${baseFontSize}px Arial`;
      ctx.fillText("Total Paid", P, y);

      ctx.fillStyle = "#0088cc";
      ctx.font = `bold ${baseFontSize + 8}px Arial`;
      ctx.textAlign = "right";
      ctx.fillText(details.total, W - P, y);

      y += 60;

      // --- 5. Payment Slip ---
      if (slipDataUrl) {
        const img = new Image();
        img.onload = () => {
          ctx.textAlign = "left";
          ctx.fillStyle = "#8a8a8e";
          ctx.font = `500 ${baseFontSize - 4}px Arial`;
          ctx.fillText("Payment Slip", P, y);
          y += 30;

          // Draw image, max width
          const imgH = (img.height / img.width) * contentW;
          ctx.drawImage(img, P, y, contentW, imgH);
          y += imgH + P;
          drawFooterAndResolve();
        };
        img.onerror = () => {
          console.warn("Could not load slip image for canvas");
          drawFooterAndResolve();
        };
        img.src = slipDataUrl;
      } else {
        drawFooterAndResolve();
      }

      // --- 6. Footer & Watermark ---
      function drawFooterAndResolve() {
        // Watermark
        ctx.save();
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = "#0088cc";
        ctx.font = `bold 100px Arial`;
        ctx.textAlign = "center";
        ctx.rotate(-0.3);
        ctx.fillText("BasseinPay", W / 2, y - 100);
        ctx.restore();

        // Footer
        ctx.fillStyle = "#8a8a8e";
        ctx.font = `${baseFontSize - 8}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText(
          `Order ID: ${details.orderId}`,
          W / 2,
          canvas.height - P - 10
        );
        ctx.fillText(
          "Thank you for using BasseinPay!",
          W / 2,
          canvas.height - P + 10
        );
        resolve(canvas);
      }
    });
  }

  /**
   * Triggers a browser download for a canvas image
   */
  function downloadImage(canvas, filename) {
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  // --- 6. Helpers & Utilities ---

  /**
   * Displays a toast notification
   */
  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("show");
    }, 10);

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

  /**
   * Saves a value to localStorage
   */
  function saveLastInput(key, value) {
    try {
      localStorage.setItem(`basseinpay_last_${key}`, value);
    } catch (e) {
      console.warn("localStorage save failed", e);
    }
  }

  /**
   * Loads a value from localStorage
   */
  function loadLastInput(key) {
    return localStorage.getItem(`basseinpay_last_${key}`) || "";
  }

  /**
   * Handle file input change to show preview
   */
  function initFileInputPreview() {
    const fileInput = document.getElementById("payment-slip");
    if (!fileInput) return;

    fileInput.addEventListener("change", () => {
      const preview = document.getElementById("file-preview");
      const previewImg = document.getElementById("file-preview-img");
      const previewName = document.getElementById("file-preview-name");
      const previewLabel = document.querySelector(
        ".file-upload-label"
      );

      if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = (e) => {
          previewImg.src = e.target.result;
          previewName.textContent = file.name;
          preview.style.display = "flex";
          if (previewLabel) previewLabel.style.display = "none";
        };

        reader.readAsDataURL(file);
      } else {
        preview.style.display = "none";
        if (previewLabel) previewLabel.style.display = "block";
      }
    });
  }
  // Run this for all pages that might have it
  initFileInputPreview();
})();
