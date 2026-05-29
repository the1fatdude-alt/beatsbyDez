"""Backend tests for Iteration 5: Boombox feature (instrumentals + downloads + new logo)."""
import os
import pytest
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path("/app/frontend/.env"))
BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

NEW_LOGO_TOKEN = "c32fw61l_Gemini_Generated_Image_-EDIT.jpg"

PAID_SLUGS = {"obsidian-bounce", "lung-punch-instrumental", "midnight-808s", "spraycan-soul"}
FREE_SLUGS = {"free-starter-01", "free-starter-02", "free-wall-bounce"}


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# -------- Instrumentals listing --------
class TestInstrumentalsList:
    def test_returns_7_tracks(self, session):
        r = session.get(f"{API}/instrumentals")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 7, f"Expected 7 instrumentals, got {len(data)}"

    def test_paid_slugs_present(self, session):
        r = session.get(f"{API}/instrumentals")
        slugs = {t["slug"] for t in r.json()}
        assert PAID_SLUGS.issubset(slugs), f"Missing paid: {PAID_SLUGS - slugs}"

    def test_free_slugs_present(self, session):
        r = session.get(f"{API}/instrumentals")
        slugs = {t["slug"] for t in r.json()}
        assert FREE_SLUGS.issubset(slugs), f"Missing free: {FREE_SLUGS - slugs}"

    def test_paid_have_price_and_not_free(self, session):
        data = session.get(f"{API}/instrumentals").json()
        paid = [t for t in data if t["slug"] in PAID_SLUGS]
        for t in paid:
            assert t["is_free"] is False, f"{t['slug']} should not be free"
            assert t["price"] > 0, f"{t['slug']} should have price>0"

    def test_free_are_free_with_price_zero(self, session):
        data = session.get(f"{API}/instrumentals").json()
        free = [t for t in data if t["slug"] in FREE_SLUGS]
        for t in free:
            assert t["is_free"] is True, f"{t['slug']} should be free"
            assert t["price"] == 0.0, f"{t['slug']} should have price 0"

    def test_free_only_filter_returns_3(self, session):
        r = session.get(f"{API}/instrumentals", params={"free_only": "true"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 3
        assert {t["slug"] for t in data} == FREE_SLUGS
        for t in data:
            assert t["is_free"] is True

    def test_required_fields(self, session):
        data = session.get(f"{API}/instrumentals").json()
        required = {"id", "slug", "title", "mood", "bpm", "key", "audio_url", "cover", "is_free", "price"}
        for t in data:
            missing = required - set(t.keys())
            assert not missing, f"{t['slug']} missing fields: {missing}"

    def test_no_mongo_id_leaked(self, session):
        data = session.get(f"{API}/instrumentals").json()
        for t in data:
            assert "_id" not in t


# -------- Download endpoint --------
class TestDownload:
    def test_free_download_success(self, session):
        r = session.post(f"{API}/instrumentals/free-starter-01/download")
        assert r.status_code == 200
        body = r.json()
        assert "audio_url" in body
        assert "downloads" in body
        assert body["audio_url"].startswith("http")
        assert isinstance(body["downloads"], int)
        assert body["downloads"] >= 1

    def test_download_increments_counter(self, session):
        r1 = session.post(f"{API}/instrumentals/free-starter-02/download")
        r2 = session.post(f"{API}/instrumentals/free-starter-02/download")
        assert r1.status_code == 200 and r2.status_code == 200
        assert r2.json()["downloads"] == r1.json()["downloads"] + 1

    def test_paid_download_forbidden(self, session):
        r = session.post(f"{API}/instrumentals/obsidian-bounce/download")
        assert r.status_code == 403, f"Expected 403 got {r.status_code}: {r.text}"

    def test_nonexistent_download_404(self, session):
        r = session.post(f"{API}/instrumentals/does-not-exist/download")
        assert r.status_code == 404


# -------- New logo presence --------
class TestNewLogo:
    def test_artist_dez_uses_new_logo(self, session):
        r = session.get(f"{API}/artists/dez")
        assert r.status_code == 200
        body = r.json()
        assert NEW_LOGO_TOKEN in body["image"], (
            f"Expected new logo token '{NEW_LOGO_TOKEN}' in artist image, got: {body['image']}"
        )

    def test_instrumental_covers_use_new_logo(self, session):
        r = session.get(f"{API}/instrumentals")
        data = r.json()
        # At minimum, the free + obsidian/midnight tracks should use the new c32fw61l cover.
        c32_covers = [t for t in data if NEW_LOGO_TOKEN in t.get("cover", "")]
        assert len(c32_covers) >= 4, (
            f"Expected >=4 instrumentals to use new logo cover. Found {len(c32_covers)}."
        )
