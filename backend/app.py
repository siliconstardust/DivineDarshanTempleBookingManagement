import os
from flask import Flask, request, jsonify, Blueprint
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from flask_bcrypt import Bcrypt
from datetime import datetime, timezone
from dotenv import load_dotenv
import pathlib

# Load .env from backend directory
env_path = pathlib.Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path)

app = Flask(__name__)

# Vercel Services: backend is mounted at routePrefix (e.g. /_/backend). Override with API_URL_PREFIX.
if "API_URL_PREFIX" in os.environ:
    API_URL_PREFIX = os.environ["API_URL_PREFIX"].strip().rstrip("/")
elif os.environ.get("VERCEL"):
    API_URL_PREFIX = "/_/backend"
else:
    API_URL_PREFIX = ""

# Configure CORS for production
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
CORS(app, resources={
    r"/*": {
        "origins": ALLOWED_ORIGINS,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

bcrypt = Bcrypt(app)

MONGO_URI = os.getenv("MONGO_URI")
print(f"MONGO_URI loaded: {'Yes' if MONGO_URI else 'NO - check .env file!'}")
_prefix_display = repr(API_URL_PREFIX) if API_URL_PREFIX else "none (routes at /login, /menu, ...)"
print(f"API_URL_PREFIX: {_prefix_display}")

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    # Use 'canteenDB' database (specified in URI)
    db = client.canteenDB
    # Test connection
    client.admin.command('ping')
    print(f"MongoDB Connected successfully! Database: canteenDB")
except Exception as e:
    print(f"Failed to initialize MongoClient: {e}")
    client = None
    db = None

def init_admin():
    if db is None:
        return
    try:
        if db.users.count_documents({"email": "admin@canteen.com"}) == 0:
            db.users.insert_one({
                "email": "admin@canteen.com",
                "password": bcrypt.generate_password_hash("admin123").decode('utf-8'),
                "role": "admin"
            })
            print("Admin user initialized in users collection.")
    except Exception as e:
        print(f"DB Connection failed during admin init: {e}")

init_admin()

def serialize_doc(doc):
    if doc:
        doc['_id'] = str(doc['_id'])
    return doc

bp = Blueprint("api", __name__)

@bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    admin = db.users.find_one({"email": email})
    if admin and bcrypt.check_password_hash(admin['password'], password):
        return jsonify({"success": True, "message": "Login successful"}), 200
    
    return jsonify({"success": False, "message": "Invalid credentials"}), 401

@bp.route('/menu', methods=['GET'])
def get_menu():
    items = []
    try:
        items = [serialize_doc(i) for i in db.menus.find()]
    except Exception as e:
        print("Error fetching menu:", e)
    return jsonify(items), 200

@bp.route('/menu', methods=['POST'])
def add_menu():
    data = request.json
    item = {
        "item_name": data.get("item_name"),
        "price": float(data.get("price")),
        "category": data.get("category"),
        "available": data.get("available", True),
        "created_at": datetime.now(timezone.utc)
    }
    result = db.menus.insert_one(item)
    item['_id'] = str(result.inserted_id)
    return jsonify(item), 201

@bp.route('/menu/<id>', methods=['PUT'])
def update_menu(id):
    data = request.json
    update_data = {}
    if "item_name" in data: update_data["item_name"] = data["item_name"]
    if "price" in data: update_data["price"] = float(data["price"])
    if "category" in data: update_data["category"] = data["category"]
    if "available" in data: update_data["available"] = data["available"]
    
    db.menus.update_one({"_id": ObjectId(id)}, {"$set": update_data})
    return jsonify({"success": True}), 200

@bp.route('/menu/<id>', methods=['DELETE'])
def delete_menu(id):
    db.menus.delete_one({"_id": ObjectId(id)})
    return jsonify({"success": True}), 200

@bp.route('/orders', methods=['GET'])
def get_orders():
    orders = []
    try:
        orders = [serialize_doc(o) for o in db.orders.find().sort("created_at", -1)]
    except Exception as e:
        print("Error fetching orders:", e)
    return jsonify(orders), 200

@bp.route('/orders', methods=['POST'])
def create_order():
    data = request.json
    items = data.get("items", [])
    if not items:
        return jsonify({"error": "No items provided"}), 400

    total_price = sum(float(i.get("price", 0)) * int(i.get("quantity", 1)) for i in items)

    order = {
        "items": items,
        "total_price": round(total_price, 2),
        "status": "pending",
        "created_at": datetime.now(timezone.utc)
    }
    result = db.orders.insert_one(order)
    order["_id"] = str(result.inserted_id)
    return jsonify(order), 201

@bp.route('/orders/<id>', methods=['PUT'])
def update_order(id):
    data = request.json
    status = data.get("status")
    if status in ["pending", "preparing", "completed"]:
        db.orders.update_one({"_id": ObjectId(id)}, {"$set": {"status": status}})
        return jsonify({"success": True}), 200
    return jsonify({"error": "Invalid status"}), 400

@bp.route('/sales/today', methods=['GET'])
def daily_sales():
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    orders = []
    total_menu_items = 0
    try:
        orders = list(db.orders.find({"created_at": {"$gte": today_start}}))
        total_menu_items = db.menus.count_documents({})
    except Exception as e:
        print("Error fetching sales:", e)

    total_orders = len(orders)
    total_revenue = sum(o.get('total_price', 0) for o in orders)
    
    return jsonify({
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "total_menu_items": total_menu_items
    }), 200

@bp.route('/seed', methods=['POST'])
def seed_menu():
    """Seed the database with sample menu items."""
    if db is None:
        return jsonify({"error": "Database not connected"}), 500

    sample_items = [
        {"item_name": "Masala Dosa", "price": 60.0, "category": "Breakfast", "available": True, "created_at": datetime.now(timezone.utc)},
        {"item_name": "Idli Sambar", "price": 40.0, "category": "Breakfast", "available": True, "created_at": datetime.now(timezone.utc)},
        {"item_name": "Poha", "price": 30.0, "category": "Breakfast", "available": True, "created_at": datetime.now(timezone.utc)},
        {"item_name": "Veg Biryani", "price": 120.0, "category": "Lunch", "available": True, "created_at": datetime.now(timezone.utc)},
        {"item_name": "Paneer Butter Masala", "price": 150.0, "category": "Lunch", "available": True, "created_at": datetime.now(timezone.utc)},
        {"item_name": "Dal Tadka", "price": 90.0, "category": "Lunch", "available": True, "created_at": datetime.now(timezone.utc)},
        {"item_name": "Chapati (2 pcs)", "price": 20.0, "category": "Lunch", "available": True, "created_at": datetime.now(timezone.utc)},
        {"item_name": "Veg Sandwich", "price": 50.0, "category": "Snacks", "available": True, "created_at": datetime.now(timezone.utc)},
        {"item_name": "Samosa (2 pcs)", "price": 30.0, "category": "Snacks", "available": True, "created_at": datetime.now(timezone.utc)},
        {"item_name": "Tea", "price": 15.0, "category": "Beverages", "available": True, "created_at": datetime.now(timezone.utc)},
        {"item_name": "Coffee", "price": 20.0, "category": "Beverages", "available": True, "created_at": datetime.now(timezone.utc)},
        {"item_name": "Fresh Lime Soda", "price": 35.0, "category": "Beverages", "available": True, "created_at": datetime.now(timezone.utc)},
    ]

    db.menus.delete_many({})
    result = db.menus.insert_many(sample_items)
    
    return jsonify({
        "success": True,
        "message": f"Seeded {len(result.inserted_ids)} menu items into canteenDB"
    }), 201

app.register_blueprint(bp, url_prefix=API_URL_PREFIX or None)

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV") != "production"
    app.run(debug=debug, host="0.0.0.0", port=port)
