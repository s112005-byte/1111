const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'orders.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper to read data
function getOrders() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return [];
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading data:', err);
        return [];
    }
}

// Helper to write data
function saveOrders(orders) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2), 'utf8');
    } catch (err) {
        console.error('Error writing data:', err);
    }
}

// API Routes
app.get('/api/orders', (req, res) => {
    const orders = getOrders();
    res.json(orders);
});

app.post('/api/orders', (req, res) => {
    const newOrder = req.body;
    const orders = getOrders();

    // Add server timestamp if not provided
    if (!newOrder.timestamp) {
        newOrder.timestamp = new Date().toLocaleString('zh-TW');
    }

    orders.push(newOrder);
    saveOrders(orders);

    res.status(201).json({ message: 'Order created', order: newOrder });
});

app.delete('/api/orders', (req, res) => {
    saveOrders([]);
    res.json({ message: 'All orders cleared' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Drink Order Server running on http://localhost:${PORT}`);
});
