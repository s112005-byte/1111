from flask import Flask, request, jsonify, send_from_directory
import json
import os
from datetime import datetime
from waitress import serve

app = Flask(__name__, static_folder='public', static_url_path='')
DATA_FILE = os.path.join(os.path.dirname(__file__), 'orders.json')

def get_orders():
    try:
        if not os.path.exists(DATA_FILE):
            return []
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print('Error reading data:', e)
        return []

def save_orders(orders):
    try:
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(orders, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print('Error writing data:', e)

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/orders', methods=['GET'])
def api_get_orders():
    return jsonify(get_orders())

@app.route('/api/orders', methods=['POST'])
def api_create_order():
    new_order = request.json
    orders = get_orders()
    
    if 'timestamp' not in new_order:
        new_order['timestamp'] = datetime.now().strftime('%Y/%m/%d %H:%M:%S')
        
    orders.append(new_order)
    save_orders(orders)
    
    return jsonify({'message': 'Order created', 'order': new_order}), 201

@app.route('/api/orders', methods=['DELETE'])
def api_clear_orders():
    save_orders([])
    return jsonify({'message': 'All orders cleared'})

if __name__ == '__main__':
    port = 3000
    print(f"Drink Order Server running on http://localhost:{port}")
    serve(app, host='0.0.0.0', port=port)
