"""Backend tests for Boombox instrumentals + downloads + producer logo.

Updated for current catalog: 5 free real-Dez tracks + 4 'coming soon' paid placeholders.
Producer/instrumental covers now point to /dez-logo.png (transparent PNG served by frontend).
"""
import os
import pytest
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path("/app/frontend/.env"))
BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

LOGO_PATH = "/dez-logo.png"
PAID_SLUGS = {"obsidian-bounce", "lung-punch-instrumental", "midnight-808s", "spraycan-soul"}
FREE_SLUGS = {"weak-relatives", "lover-i-know", "all-of-it", "bounce-back-again", "too-late"}
TOTAL_TRACKS = len(PAID_SLUGS) + len(FREE_SLUGS)


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# -------- Instrumentals listing --------
class TestInstrumentalsList:
    def test_returns_full_catalog(self, session):
        r = session.get(f"{API}/instrumentals")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == TOTAL_TRACKS, f"Expected {TOTAL_TRACKS} instrumentals, got {len(data)}"

    def test_paid_slugs_present(self, session):
        slugs = {t["slug"] for t in session.get(f"{API}/instrumentals").json()}
        assert PAID_SLUGS.issubset(slugs), f"Missing paid: {PAID_SLUGS - slugs}"

    def test_free_slugs_present(self, session):
        slugs = {t["slug"] for t in session.get(f"{API}/instrumentals").json()}
        assert FREE_SLUGS.issubset(slugs), f"Missing free: {FREE_SLUGS - slugs}"

    def test_paid_have_price_and_not_free(self, session):
        data = session.get(f"{API}/instrumentals").json()
        for t in [t for t in data if t["slug"] in PAID_SLUGS]:
            assert not t["is_free"], f"{t['slug']} should not be free"
            assert t["price"] > 0, f"{t['slug']} should have price>0"

    def test_paid_are_coming_soon(self, session):
        data = session.get(f"{API}/instrumentals").json()
        for t in [t for t in data if t["slug"] in PAID_SLUGS]:
            assert t.get("coming_soon") is True, f"{t['slug']} should be coming_soon"
            assert t["audio_url"] == "", f"{t['slug']} should have empty audio_url while coming_soon"

    def test_free_are_free_with_real_audio(self, session):
        data = session.get(f"{API}/instrumentals").json()
        for t in [t for t in data if t["slug"] in FREE_SLUGS]:
            assert t["is_free"], f"{t['slug']} should be free"
            assert t["price"] == 0.0, f"{t['slug']} should have price 0"
            assert t["audio_url"].startswith("https://"), f"{t['slug']} needs real audio_url"
            assert "customer-assets.emergentagent.com" in t["audio_url"], (
                f"{t['slug']} audio_url should point to the asset bucket"
            )
            assert not t.get("coming_soon", False)

    def test_free_only_filter_returns_all_free(self, session):
        r = session.get(f"{API}/instrumentals", params={"free_only": "true"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) == len(FREE_SLUGS)
        assert {t["slug"] for t in data} == FREE_SLUGS
        for t in data:
            assert t["is_free"]

    def test_required_fields(self, session):
        data = session.get(f"{API}/instrumentals").json()
        required = {"id", "slug", "title", "mood", "bpm", "key", "audio_url",
                    "cover", "is_free", "price", "coming_soon"}
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
        r = session.post(f"{API}/instrumentals/weak-relatives/download")
        assert r.status_code == 200
        body = r.json()
        assert "audio_url" in body
        assert "downloads" in body
        assert body["audio_url"].startswith("https://")
        assert isinstance(body["downloads"], int)
        assert body["downloads"] >= 1

    def test_download_increments_counter(self, session):
        r1 = session.post(f"{API}/instrumentals/lover-i-know/download")
        r2 = session.post(f"{API}/instrumentals/lover-i-know/download")
        assert r1.status_code == 200 and r2.status_code == 200
        assert r2.json()["downloads"] == r1.json()["downloads"] + 1

    def test_paid_download_forbidden(self, session):
        r = session.post(f"{API}/instrumentals/obsidian-bounce/download")
        assert r.status_code == 403, f"Expected 403 got {r.status_code}: {r.text}"

    def test_nonexistent_download_404(self, session):
        r = session.post(f"{API}/instrumentals/does-not-exist/download")
        assert r.status_code == 404


# -------- Producer logo presence --------
class TestProducerLogo:
    def test_artist_dez_returns_image(self, session):
        r = session.get(f"{API}/artists/dez")
        assert r.status_code == 200
        body = r.json()
        assert body["image"], "Artist Dez should have a non-empty image"

    def test_instrumental_covers_use_dez_logo(self, session):
        data = session.get(f"{API}/instrumentals").json()
        local_logo_covers = [t for t in data if t.get("cover") == LOGO_PATH]
        # Most instrumentals should use the transparent PNG cover
        assert len(local_logo_covers) >= 4, (
            f"Expected >=4 instrumentals to use the transparent dez-logo.png cover. "
            f"Found {len(local_logo_covers)}."
        )
