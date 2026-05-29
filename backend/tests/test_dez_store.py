import os
import pytest
import requests

from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path("/app/frontend/.env"))
BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

NEW_SLUGS = {
    "lung-punch-vinyl", "lung-punch-hoodie", "lung-punch-crew", "lung-punch-tee",
    "graffiti-hoodie", "graffiti-tee", "beats-by-dez-cap", "dez-tapes-vinyl",
}
OLD_SLUGS = {
    "beats-vol-2-cd", "beatsbydez-hoodie", "beatsbydez-tee", "dez-signal-chain",
    "studio-sessions-vinyl", "dez-snapback",
}


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Root ----------
class TestRoot:
    def test_root_no_sony(self, session):
        r = session.get(f"{API}/", timeout=30)
        assert r.status_code == 200
        msg = r.json().get("message", "")
        assert "Sony" not in msg
        assert "BeatsByDez" in msg


# ---------- Products: catalog rebuild ----------
class TestProducts:
    def test_list_8_products(self, session):
        r = session.get(f"{API}/products", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 8, f"Expected 8 products got {len(data)}"
        slugs = {p["slug"] for p in data}
        assert slugs == NEW_SLUGS, f"Unexpected slugs: {slugs}"

    def test_no_old_slugs(self, session):
        r = session.get(f"{API}/products", timeout=30)
        slugs = {p["slug"] for p in r.json()}
        for old in OLD_SLUGS:
            assert old not in slugs, f"Old slug {old} still in catalog"

    def test_all_artists_dez(self, session):
        r = session.get(f"{API}/products", timeout=30)
        for p in r.json():
            assert p["artist"] == "DEZ"

    def test_all_images_are_customer_assets(self, session):
        """No unsplash/pexels stock photos. All images must be customer-assets uploads."""
        r = session.get(f"{API}/products", timeout=30)
        for p in r.json():
            assert p["image"].startswith("https://customer-assets.emergentagent.com/"), \
                f"Product {p['slug']} has non-customer-asset image: {p['image']}"
            assert "unsplash.com" not in p["image"]
            assert "pexels.com" not in p["image"]
            for img in p.get("images", []):
                assert img.startswith("https://customer-assets.emergentagent.com/"), \
                    f"Product {p['slug']} has stock image in images[]: {img}"
                assert "unsplash.com" not in img
                assert "pexels.com" not in img

    def test_lung_punch_hoodie(self, session):
        r = session.get(f"{API}/products/lung-punch-hoodie", timeout=30)
        assert r.status_code == 200
        p = r.json()
        assert p["slug"] == "lung-punch-hoodie"
        assert p["total_supply"] == 500
        assert p["sold_count"] == 218
        assert p["is_limited"]
        assert p["drop_ends_at"] is not None
        assert "L" in p["sizes"]

    def test_graffiti_hoodie(self, session):
        r = session.get(f"{API}/products/graffiti-hoodie", timeout=30)
        assert r.status_code == 200
        p = r.json()
        assert p["slug"] == "graffiti-hoodie"
        assert p["total_supply"] == 400
        assert p["sold_count"] == 247
        assert p["is_limited"]

    def test_lung_punch_vinyl(self, session):
        r = session.get(f"{API}/products/lung-punch-vinyl", timeout=30)
        assert r.status_code == 200
        p = r.json()
        assert p["total_supply"] == 1000
        assert p["sold_count"] == 387
        assert p["is_limited"]

    def test_filter_vinyl(self, session):
        r = session.get(f"{API}/products", params={"category": "vinyl"}, timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 1
        for p in data:
            assert p["category"] == "vinyl"

    def test_filter_apparel(self, session):
        r = session.get(f"{API}/products", params={"category": "apparel"}, timeout=30)
        assert r.status_code == 200
        for p in r.json():
            assert p["category"] == "apparel"

    def test_get_product_not_found(self, session):
        r = session.get(f"{API}/products/does-not-exist", timeout=30)
        assert r.status_code == 404


# ---------- Artists ----------
class TestArtists:
    def test_list_artists_dez_only(self, session):
        r = session.get(f"{API}/artists", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 1
        assert data[0]["slug"] == "dez"
        assert data[0]["name"] == "DEZ"

    def test_get_artist_dez(self, session):
        r = session.get(f"{API}/artists/dez", timeout=30)
        assert r.status_code == 200
        a = r.json()
        assert "Sony" not in a.get("bio", "")
        assert a["image"].startswith("https://customer-assets.emergentagent.com/")


# ---------- Orders ----------
class TestOrders:
    def _get(self, session, slug):
        r = session.get(f"{API}/products/{slug}", timeout=30)
        assert r.status_code == 200
        return r.json()["id"], r.json()["price"]

    def test_create_order_full_flow(self, session):
        """End-to-end with lung-punch-hoodie size L — main smoke test from review."""
        pid, price = self._get(session, "lung-punch-hoodie")
        payload = {
            "items": [{"product_id": pid, "quantity": 1, "size": "L"}],
            "customer_name": "TEST_Buyer",
            "customer_email": "test_lp@example.com",
            "shipping_address": "1 Test St",
            "city": "NYC", "zip_code": "10001", "country": "USA",
        }
        r = session.post(f"{API}/orders", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        order = r.json()
        # Price = $95, free shipping (>= $100? No, $95 < $100 so shipping 9.99)
        assert order["subtotal"] == 95.0
        assert order["shipping"] == 9.99
        assert order["total"] == round(95.0 + 9.99, 2)
        assert order["order_number"].startswith("BBD-")

        # Persistence
        r2 = session.get(f"{API}/orders/{order['order_number']}", timeout=30)
        assert r2.status_code == 200
        assert r2.json()["items"][0]["size"] == "L"
        assert r2.json()["items"][0]["title"] == "LUNG PUNCH — HOODIE"

    def test_free_shipping_graffiti_hoodie(self, session):
        pid, price = self._get(session, "graffiti-hoodie")  # $110
        payload = {
            "items": [{"product_id": pid, "quantity": 1, "size": "M"}],
            "customer_name": "TEST_B2", "customer_email": "free@x.com",
            "shipping_address": "x", "city": "x", "zip_code": "x", "country": "x",
        }
        r = session.post(f"{API}/orders", json=payload, timeout=30)
        assert r.status_code == 200
        assert r.json()["shipping"] == 0.0
        assert r.json()["total"] == price

    def test_empty_cart_400(self, session):
        payload = {"items": [], "customer_name": "x", "customer_email": "x@y.z",
                   "shipping_address": "x", "city": "x", "zip_code": "x", "country": "x"}
        r = session.post(f"{API}/orders", json=payload, timeout=30)
        assert r.status_code == 400

    def test_invalid_product_404(self, session):
        payload = {"items": [{"product_id": "not-real", "quantity": 1}],
                   "customer_name": "x", "customer_email": "x@y.z",
                   "shipping_address": "x", "city": "x", "zip_code": "x", "country": "x"}
        r = session.post(f"{API}/orders", json=payload, timeout=30)
        assert r.status_code == 404


# ---------- Newsletter ----------
class TestNewsletter:
    def test_subscribe_idempotent(self, session):
        payload = {"email": "TEST_news@example.com"}
        r1 = session.post(f"{API}/newsletter", json=payload, timeout=30)
        assert r1.status_code == 200
        r2 = session.post(f"{API}/newsletter", json=payload, timeout=30)
        assert r2.status_code == 200
