import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://music-commerce-hub.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Products ----------
class TestProducts:
    def test_list_all_products(self, session):
        r = session.get(f"{API}/products", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 9, f"Expected 9 products got {len(data)}"
        for p in data:
            assert p["artist"] == "DEZ"
            assert "slug" in p and "price" in p
            # New fields exist for all products
            assert "total_supply" in p
            assert "sold_count" in p
            assert "drop_ends_at" in p

    def test_limited_products_have_drop_fields(self, session):
        r = session.get(f"{API}/products", timeout=30)
        assert r.status_code == 200
        data = r.json()
        limited_slugs = {"lung-punch-vinyl", "beatsbydez-hoodie", "dez-signal-chain"}
        # dez-tapes-vinyl is is_limited=True but in seed has no total_supply set;
        # verify the four expected limited slugs are present and check that
        # ones with total_supply have proper sold_count + drop_ends_at
        for p in data:
            if p["total_supply"] is not None:
                assert p["sold_count"] >= 0
                assert p["sold_count"] <= p["total_supply"]
                assert p["drop_ends_at"] is not None
                # ISO parseable
                from datetime import datetime
                datetime.fromisoformat(p["drop_ends_at"].replace("Z", "+00:00"))
        # Ensure the explicit limited slugs are present
        slugs = {p["slug"] for p in data}
        for s in limited_slugs:
            assert s in slugs, f"Missing limited slug {s}"

    def test_lung_punch_product(self, session):
        r = session.get(f"{API}/products/lung-punch-vinyl", timeout=30)
        assert r.status_code == 200
        p = r.json()
        assert p["slug"] == "lung-punch-vinyl"
        assert p["total_supply"] == 1000
        assert p["sold_count"] == 387
        assert p["is_limited"] is True
        assert p["drop_ends_at"] is not None
        from datetime import datetime, timezone
        dt = datetime.fromisoformat(p["drop_ends_at"].replace("Z", "+00:00"))
        # ~7 days in the future
        delta = (dt - datetime.now(timezone.utc)).total_seconds()
        assert 6 * 86400 < delta < 8 * 86400, f"drop_ends_at not ~7 days out: {delta}s"

    def test_non_limited_product_fields_null_or_zero(self, session):
        r = session.get(f"{API}/products/dez-snapback", timeout=30)
        assert r.status_code == 200
        p = r.json()
        assert p.get("total_supply") in (None, 0)
        assert p.get("sold_count") == 0
        assert p.get("drop_ends_at") in (None, "")

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
        data = r.json()
        assert all(p["category"] == "apparel" for p in data)

    def test_get_product_by_slug(self, session):
        r = session.get(f"{API}/products/dez-tapes-vinyl", timeout=30)
        assert r.status_code == 200
        p = r.json()
        assert p["slug"] == "dez-tapes-vinyl"
        assert p["artist"] == "DEZ"
        assert p["price"] == 42.00

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
        assert a["slug"] == "dez"
        assert "bio" in a and len(a["bio"]) > 10
        assert a["image"].startswith("http")

    def test_get_artist_not_found(self, session):
        r = session.get(f"{API}/artists/nope", timeout=30)
        assert r.status_code == 404


# ---------- Orders ----------
class TestOrders:
    def _get_product_id(self, session, slug):
        r = session.get(f"{API}/products/{slug}", timeout=30)
        assert r.status_code == 200
        return r.json()["id"], r.json()["price"]

    def test_create_order_with_shipping(self, session):
        pid, price = self._get_product_id(session, "beats-vol-2-cd")
        # $18 -> subtotal under $100, shipping should be 9.99
        payload = {
            "items": [{"product_id": pid, "quantity": 2}],
            "customer_name": "TEST_Buyer",
            "customer_email": "test@example.com",
            "shipping_address": "1 Test St",
            "city": "NYC",
            "zip_code": "10001",
            "country": "USA",
        }
        r = session.post(f"{API}/orders", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        order = r.json()
        assert order["subtotal"] == round(price * 2, 2)
        assert order["shipping"] == 9.99
        assert order["total"] == round(price * 2 + 9.99, 2)
        assert order["order_number"].startswith("SM-")
        assert len(order["order_number"]) == 11  # SM- + 8 hex
        assert order["status"] == "confirmed"

        # Verify persistence
        order_no = order["order_number"]
        r2 = session.get(f"{API}/orders/{order_no}", timeout=30)
        assert r2.status_code == 200
        assert r2.json()["order_number"] == order_no
        assert r2.json()["customer_email"] == "test@example.com"

    def test_create_order_free_shipping(self, session):
        pid, price = self._get_product_id(session, "beatsbydez-hoodie")  # $110
        payload = {
            "items": [{"product_id": pid, "quantity": 1, "size": "L"}],
            "customer_name": "TEST_Buyer2",
            "customer_email": "free@example.com",
            "shipping_address": "2 Test St",
            "city": "LA",
            "zip_code": "90001",
            "country": "USA",
        }
        r = session.post(f"{API}/orders", json=payload, timeout=30)
        assert r.status_code == 200
        order = r.json()
        assert order["shipping"] == 0.0
        assert order["total"] == price

    def test_empty_cart_400(self, session):
        payload = {
            "items": [],
            "customer_name": "x", "customer_email": "x@y.z",
            "shipping_address": "x", "city": "x", "zip_code": "x", "country": "x",
        }
        r = session.post(f"{API}/orders", json=payload, timeout=30)
        assert r.status_code == 400

    def test_invalid_product_404(self, session):
        payload = {
            "items": [{"product_id": "not-a-real-id", "quantity": 1}],
            "customer_name": "x", "customer_email": "x@y.z",
            "shipping_address": "x", "city": "x", "zip_code": "x", "country": "x",
        }
        r = session.post(f"{API}/orders", json=payload, timeout=30)
        assert r.status_code == 404

    def test_get_order_not_found(self, session):
        r = session.get(f"{API}/orders/SM-NOTREAL1", timeout=30)
        assert r.status_code == 404


# ---------- Newsletter ----------
class TestNewsletter:
    def test_subscribe_idempotent(self, session):
        payload = {"email": "TEST_news@example.com"}
        r1 = session.post(f"{API}/newsletter", json=payload, timeout=30)
        assert r1.status_code == 200
        assert r1.json()["success"] is True
        # second call should also succeed (upsert)
        r2 = session.post(f"{API}/newsletter", json=payload, timeout=30)
        assert r2.status_code == 200
