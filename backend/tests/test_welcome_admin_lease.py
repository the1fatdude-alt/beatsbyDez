# Iteration 7: newsletter/welcome email, admin auth + subscribers, brute force, beat lease orders, stable ids
import os
import uuid
import random
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_EMAIL = "admin@beatsbydez.com"
ADMIN_PASSWORD = "mZ0KawviisO8"
OBSIDIAN_ID = str(uuid.uuid5(uuid.NAMESPACE_URL, "beat:obsidian-bounce"))
TEE_ID = str(uuid.uuid5(uuid.NAMESPACE_URL, "product:graffiti-tee"))
FREE_ID = str(uuid.uuid5(uuid.NAMESPACE_URL, "beat:all-of-it"))
MIDNIGHT_ID = str(uuid.uuid5(uuid.NAMESPACE_URL, "beat:midnight-808s"))

ORDER_BASE = {"customer_name": "TEST_QA", "customer_email": "qa_order@example.com",
              "shipping_address": "1 Test St", "city": "Testville", "zip_code": "00000",
              "country": "United States"}


@pytest.fixture
def s():
    return requests.Session()


# --- Stable ids (uuid5) ---
class TestStableIds:
    def test_instrumental_ids_deterministic(self, s):
        r = s.get(f"{API}/instrumentals")
        assert r.status_code == 200
        by_slug = {t["slug"]: t for t in r.json()}
        for slug, t in by_slug.items():
            assert t["id"] == str(uuid.uuid5(uuid.NAMESPACE_URL, f"beat:{slug}"))

    def test_product_ids_deterministic(self, s):
        r = s.get(f"{API}/products")
        assert r.status_code == 200
        for p in r.json():
            assert p["id"] == str(uuid.uuid5(uuid.NAMESPACE_URL, f"product:{p['slug']}"))


# --- Newsletter ---
class TestNewsletter:
    def test_new_signup_sends_welcome(self, s):
        r = s.post(f"{API}/newsletter", json={"email": "delivered@resend.dev"})
        assert r.status_code == 200, r.text
        d = r.json()
        print("NEWSLETTER NEW:", d)
        assert d["already_subscribed"] is False
        assert d["welcome_sent"] is True

    def test_duplicate_signup(self, s):
        r = s.post(f"{API}/newsletter", json={"email": "Delivered@Resend.dev"})
        assert r.status_code == 200
        d = r.json()
        assert d["already_subscribed"] is True
        assert "welcome_sent" not in d

    def test_invalid_email_422(self, s):
        r = s.post(f"{API}/newsletter", json={"email": "not-an-email"})
        assert r.status_code == 422


# --- Admin auth ---
class TestAdmin:
    def test_subscribers_requires_auth(self, s):
        assert s.get(f"{API}/admin/subscribers").status_code == 401
        assert s.get(f"{API}/admin/subscribers.csv").status_code == 401
        assert s.get(f"{API}/auth/me").status_code == 401

    def test_wrong_password_401(self, s):
        r = s.post(f"{API}/auth/login", json={"email": "wrong_" + str(random.randint(1, 99999)) + "@example.com",
                                              "password": "nope"})
        assert r.status_code == 401

    def test_login_list_csv_logout(self, s):
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200, r.text
        assert r.json()["role"] == "admin"
        sc = r.headers.get("set-cookie", "")
        assert "access_token=" in sc and "HttpOnly" in sc and "Secure" in sc
        assert s.get(f"{API}/auth/me").json()["email"] == ADMIN_EMAIL
        subs = s.get(f"{API}/admin/subscribers")
        assert subs.status_code == 200
        d = subs.json()
        assert d["count"] == len(d["subscribers"])
        assert any(x["email"] == "delivered@resend.dev" for x in d["subscribers"])
        assert all("_id" not in x and "ip" not in x for x in d["subscribers"])
        csv_r = s.get(f"{API}/admin/subscribers.csv")
        assert csv_r.status_code == 200
        assert "text/csv" in csv_r.headers["content-type"]
        assert "attachment" in csv_r.headers.get("content-disposition", "")
        assert csv_r.text.splitlines()[0] == "email,subscribed_at,welcome_sent"
        assert "delivered@resend.dev" in csv_r.text
        lo = s.post(f"{API}/auth/logout")
        assert lo.status_code == 200
        s.cookies.clear()
        assert s.get(f"{API}/admin/subscribers").status_code == 401

    def test_brute_force_lockout(self, s):
        email = "nobody@beatsbydez.com"
        codes = [s.post(f"{API}/auth/login", json={"email": email, "password": f"bad{i}"}).status_code
                 for i in range(6)]
        print("BRUTE CODES:", codes)
        assert codes[:5] == [401] * 5
        assert codes[5] == 429


# --- Orders with beats (requires obsidian-bounce set live in Mongo) ---
class TestLeaseOrders:
    def test_beat_only_order_free_shipping(self, s):
        r = s.post(f"{API}/orders", json={**ORDER_BASE, "items": [{"product_id": OBSIDIAN_ID, "quantity": 1}]})
        assert r.status_code == 200, r.text
        o = r.json()
        assert o["items"][0]["kind"] == "beat"
        assert o["items"][0]["size"] == "Non-Exclusive Lease"
        assert o["shipping"] == 0
        assert o["total"] == 29.99
        g = s.get(f"{API}/orders/{o['order_number']}")
        assert g.status_code == 200 and g.json()["total"] == 29.99

    def test_mixed_cart_shipping(self, s):
        r = s.post(f"{API}/orders", json={**ORDER_BASE, "items": [
            {"product_id": OBSIDIAN_ID, "quantity": 1}, {"product_id": TEE_ID, "quantity": 1, "size": "M"}]})
        assert r.status_code == 200, r.text
        o = r.json()
        assert o["shipping"] == 9.99
        assert o["subtotal"] == 81.99
        assert o["total"] == 91.98

    def test_coming_soon_beat_400(self, s):
        r = s.post(f"{API}/orders", json={**ORDER_BASE, "items": [{"product_id": MIDNIGHT_ID, "quantity": 1}]})
        assert r.status_code == 400

    def test_free_beat_400(self, s):
        r = s.post(f"{API}/orders", json={**ORDER_BASE, "items": [{"product_id": FREE_ID, "quantity": 1}]})
        assert r.status_code == 400

    def test_unknown_id_404(self, s):
        r = s.post(f"{API}/orders", json={**ORDER_BASE, "items": [{"product_id": "nope", "quantity": 1}]})
        assert r.status_code == 404
