const SERVICE_PRICES = {
    sim: {
        'mpt-3gb': { customer: 1500, reseller: 1400 },
        'mpt-5gb': { customer: 2500, reseller: 2300 },
        'telenor-regular': { customer: 1000, reseller: 900 },
        'ooredoo-basic': { customer: 2000, reseller: 1800 }
    },
    game: {
        'freefire-100': { customer: 3000, reseller: 2800 },
        'pubg-60': { customer: 2000, reseller: 1800 },
        'mlbb-86': { customer: 2500, reseller: 2300 }
    },
    smm: {
        'fb-likes': { customer: 2000, reseller: 1800 },
        'ig-followers': { customer: 4000, reseller: 3600 },
        'yt-subscribers': { customer: 8000, reseller: 7200 }
    },
    p2p: {
        feePercent: 0.02
    }
};

// Get price based on user role
function getPrice(serviceType, serviceKey, userRole = 'customer') {
    const service = SERVICE_PRICES[serviceType]?.[serviceKey];
    if (!service) return 0;
    
    return service[userRole] || service.customer;
}

// Calculate P2P exchange
function calculateP2P(amount) {
    const fee = amount * SERVICE_PRICES.p2p.feePercent;
    const receive = amount - fee;
    return { amount, fee, receive };
}
