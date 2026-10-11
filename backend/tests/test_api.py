import os, tempfile
os.environ["DATABASE_URL"] = "sqlite:///" + os.path.join(tempfile.mkdtemp(), "t.db")
os.environ["UPLOAD_DIR"] = tempfile.mkdtemp()
from fastapi.testclient import TestClient
from app.main import app
from scripts.create_admin import main as make_admin

c = TestClient(app)

def admin_h():
    make_admin("admin@test.com", "secret123")
    t = c.post("/api/v1/auth/login", json={"email": "admin@test.com", "password": "secret123"}).json()["token"]
    return {"Authorization": f"Bearer {t}"}

def test_full_flow():
    h = admin_h()
    assert c.get("/api/v1/admin/stats").status_code == 401
    p = c.post("/api/v1/admin/r/products", headers=h, json={"name": "Test Watch", "brand": "Timera", "collection": "x",
        "price": 10000, "image_url": "https://x/y.jpg", "description": "d", "stock": 5, "active": True}).json()["row"]
    assert c.get(f"/api/v1/products/{p['slug']}").status_code == 200
    c.put("/api/v1/admin/settings/payment_settings", headers=h, json={"delivery_charge": 250, "free_delivery_above": 5000, "cod_charge": 0})
    o = c.post("/api/v1/orders", json={"customer_name": "Ali", "customer_email": "ali@test.com", "customer_phone": "03001234567",
        "shipping_address": "Lahore", "items": [{"slug": p["slug"], "quantity": 2}], "idempotency_key": "k1"}).json()["order"]
    assert o["total"] == 20000  # 2 x 10000, free delivery above 5000
    again = c.post("/api/v1/orders", json={"customer_name": "Ali", "customer_email": "ali@test.com", "customer_phone": "03001234567",
        "shipping_address": "Lahore", "items": [{"slug": p["slug"], "quantity": 2}], "idempotency_key": "k1"}).json()
    assert again["duplicate"] is True
    r = c.patch(f"/api/v1/admin/orders/{o['id']}", headers=h, json={"status": "shipped", "tracking_number": "TCS1"})
    assert r.json()["order"]["status"] == "shipped"
    emails = c.get("/api/v1/admin/r/order_emails", headers=h).json()["rows"]
    assert {e["template"] for e in emails} >= {"placed", "shipped"}
    assert c.get(f"/api/v1/orders/{o['order_number']}?email=ali@test.com").status_code == 200
    assert c.get(f"/api/v1/orders/{o['order_number']}?email=x@y.com").status_code == 404
    assert c.get("/admin").status_code == 200
