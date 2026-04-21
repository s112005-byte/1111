// Data Models
const menuItems = [
    { id: 1, name: '阿薩姆紅茶', category: 'tea', price: 35, icon: '🍵' },
    { id: 2, name: '茉莉綠茶', category: 'tea', price: 35, icon: '🍵' },
    { id: 3, name: '鐵觀音', category: 'tea', price: 40, icon: '🍵' },
    { id: 4, name: '經典奶茶', category: 'milk-tea', price: 50, icon: '🧋' },
    { id: 5, name: '珍珠奶茶', category: 'milk-tea', price: 60, icon: '🧋' },
    { id: 6, name: '芋頭奶茶', category: 'milk-tea', price: 65, icon: '🧋' },
    { id: 7, name: '多多綠茶', category: 'special', price: 55, icon: '🥤' },
    { id: 8, name: '鮮橙綠茶', category: 'special', price: 65, icon: '🍊' },
    { id: 9, name: '百香雙響炮', category: 'special', price: 70, icon: '🍹' },
];

let cart = [];
let orders = JSON.parse(localStorage.getItem('drinkOrders')) || [];

// DOM Elements
const menuGrid = document.getElementById('menu-grid');
const cartItemsContainer = document.getElementById('cart-items');
const subtotalEl = document.getElementById('subtotal');
const totalEl = document.getElementById('total');
const checkoutBtn = document.getElementById('checkout-btn');
const filterBtns = document.querySelectorAll('.filter-btn');
const navBtns = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');
const modal = document.getElementById('notification-modal');
const closeModalBtn = document.getElementById('close-modal-btn');

// Dashboard Elements
const dashRevenue = document.getElementById('dashboard-revenue');
const dashOrdersCount = document.getElementById('dashboard-orders-count');
const dashBestseller = document.getElementById('dashboard-bestseller');
const ordersTbody = document.getElementById('orders-tbody');
const clearDataBtn = document.getElementById('clear-data-btn');

// Initialize
function init() {
    renderMenu('all');
    updateCartUI();
    updateDashboardUI();
    setupEventListeners();
}

// Render Menu
function renderMenu(category) {
    menuGrid.innerHTML = '';
    const filteredItems = category === 'all' 
        ? menuItems 
        : menuItems.filter(item => item.category === category);

    filteredItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'menu-card';
        card.innerHTML = `
            <div class="drink-icon">${item.icon}</div>
            <div class="drink-name">${item.name}</div>
            <div class="drink-price">$${item.price}</div>
        `;
        card.addEventListener('click', () => addToCart(item));
        menuGrid.appendChild(card);
    });
}

// Cart Logic
function addToCart(item) {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    updateCartUI();
}

function updateQuantity(id, change) {
    const itemIndex = cart.findIndex(item => item.id === id);
    if (itemIndex > -1) {
        cart[itemIndex].quantity += change;
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }
    }
    updateCartUI();
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
}

function updateCartUI() {
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart">購物車是空的</div>';
        subtotalEl.textContent = '$0';
        totalEl.textContent = '$0';
        checkoutBtn.disabled = true;
        return;
    }

    let total = 0;
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const cartItemEl = document.createElement('div');
        cartItemEl.className = 'cart-item';
        cartItemEl.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">$${item.price}</div>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                <button class="remove-btn" onclick="removeFromCart(${item.id})">🗑️</button>
            </div>
        `;
        cartItemsContainer.appendChild(cartItemEl);
    });

    subtotalEl.textContent = `$${total}`;
    totalEl.textContent = `$${total}`; // Can add tax logic here if needed
    checkoutBtn.disabled = false;
}

// Checkout Logic
function checkout() {
    if (cart.length === 0) return;

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const newOrder = {
        id: 'ORD' + Date.now().toString().slice(-6),
        items: [...cart],
        total: total,
        timestamp: new Date().toLocaleString('zh-TW')
    };

    orders.push(newOrder);
    localStorage.setItem('drinkOrders', JSON.stringify(orders));

    // Reset Cart
    cart = [];
    updateCartUI();
    updateDashboardUI();

    // Show Notification
    showModal('結帳成功！', `訂單編號 ${newOrder.id} 已送出。總計 $${total}`);
}

// Dashboard Logic
function updateDashboardUI() {
    // Calculate stats
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    
    // Find bestseller
    let itemCounts = {};
    orders.forEach(order => {
        order.items.forEach(item => {
            itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
        });
    });
    
    let bestseller = '-';
    let maxCount = 0;
    for (const [name, count] of Object.entries(itemCounts)) {
        if (count > maxCount) {
            maxCount = count;
            bestseller = name;
        }
    }

    // Update stats UI
    dashRevenue.textContent = `$${totalRevenue.toLocaleString()}`;
    dashOrdersCount.textContent = totalOrders;
    dashBestseller.textContent = maxCount > 0 ? `${bestseller} (${maxCount}杯)` : '-';

    // Update table
    ordersTbody.innerHTML = '';
    // Reverse to show newest first
    [...orders].reverse().forEach(order => {
        const tr = document.createElement('tr');
        
        const itemsHtml = order.items.map(item => 
            `<span class="order-badge">${item.name} x${item.quantity}</span>`
        ).join('');

        tr.innerHTML = `
            <td><strong>${order.id}</strong></td>
            <td style="color: var(--text-muted); font-size: 0.875rem;">${order.timestamp}</td>
            <td class="order-items-cell">${itemsHtml}</td>
            <td style="font-weight: 600; color: var(--primary);">$${order.total}</td>
        `;
        ordersTbody.appendChild(tr);
    });
    
    if (orders.length === 0) {
        ordersTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem; color: var(--text-muted);">尚無訂單紀錄</td></tr>';
    }
}

// Modal Logic
function showModal(title, message) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    modal.classList.add('active');
}

// Event Listeners
function setupEventListeners() {
    // Menu Category Filters
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderMenu(e.target.dataset.category);
        });
    });

    // Navigation
    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            navBtns.forEach(b => b.classList.remove('active'));
            views.forEach(v => v.classList.remove('active'));
            
            e.target.classList.add('active');
            document.getElementById(e.target.dataset.target).classList.add('active');
            
            // Refresh dashboard when switching to it
            if (e.target.dataset.target === 'backend-view') {
                updateDashboardUI();
            }
        });
    });

    // Checkout
    checkoutBtn.addEventListener('click', checkout);

    // Clear Data
    clearDataBtn.addEventListener('click', () => {
        if (confirm('確定要清除所有訂單資料嗎？此動作無法復原。')) {
            orders = [];
            localStorage.removeItem('drinkOrders');
            updateDashboardUI();
        }
    });

    // Close Modal
    closeModalBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    // Make functions globally available for inline onclick handlers
    window.updateQuantity = updateQuantity;
    window.removeFromCart = removeFromCart;
}

// Start App
init();
