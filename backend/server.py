from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from fastapi.responses import PlainTextResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import csv  # noqa: E402
import io  # noqa: E402
from emailer import send_email, welcome_email_html  # noqa: E402
from auth import (  # noqa: E402
    seed_admin, verify_password, create_access_token, set_auth_cookie,
    check_lockout, record_failure, get_admin,
)

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="BeatsByDez Store")
api_router = APIRouter(prefix="/api")

DEZ_LOGO = "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/c32fw61l_Gemini_Generated_Image_-EDIT.jpg"
DEZ_PORTRAIT = "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/5btnld6i_Snapchat-1994296522.jpg"
DEZ_STUDIO = "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/m0zgehx2_7bc86a47-de2b-4392-b5a0-e74e5d409500.jpg"
LUNG_PUNCH_LOGO = "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/t4dqvb7t_Gemini_Generated_Image_%20%281%29-EDIT.jpg"
LUNG_PUNCH_MERCH = "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/bb1tyl2e_Gemini_Generated_Image_%20%283%29-EDIT.jpg"
GRAFFITI_MERCH = "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/16porl9k_Gemini_Generated_Image_-EDIT.jpg"


# ---------- Models ----------
class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str
    title: str
    artist: str
    category: str  # vinyl | cd | apparel | accessories
    price: float
    image: str
    images: List[str] = []
    description: str
    sizes: List[str] = []
    is_limited: bool = False
    is_new_drop: bool = False
    stock: int = 100
    total_supply: Optional[int] = None
    sold_count: int = 0
    drop_ends_at: Optional[str] = None


class Artist(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str
    name: str
    bio: str
    image: str


class CartItem(BaseModel):
    product_id: str
    quantity: int
    size: Optional[str] = None


class OrderCreate(BaseModel):
    items: List[CartItem]
    customer_name: str
    customer_email: str
    shipping_address: str
    city: str
    zip_code: str
    country: str


class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str
    items: List[dict]
    customer_name: str
    customer_email: str
    shipping_address: str
    city: str
    zip_code: str
    country: str
    subtotal: float
    shipping: float
    total: float
    status: str = "confirmed"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class NewsletterSignup(BaseModel):
    email: EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


LEASE_PRICE = 29.99
LEASE_LABEL = "Non-Exclusive Lease"


class Instrumental(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str
    title: str
    mood: str
    bpm: int
    key: str
    audio_url: str
    cover: str
    is_free: bool = False
    price: float = 0.0
    preview_seconds: int = 30
    downloads: int = 0
    coming_soon: bool = False
    license: Optional[str] = None


class DownloadResponse(BaseModel):
    audio_url: str
    downloads: int


# ---------- Seed Data (DEZ ONLY) ----------
def _drop_ends(days: int) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()


SEED_ARTISTS = [
    {
        "slug": "dez",
        "name": "DEZ",
        "bio": "For Dez, music isn't just a career path or a creative outlet — it is a lifelong obsession. Since 1994, they have dedicated their life entirely to the craft, driven by a simple, unyielding truth: this is the only thing I know. From the complex chords of a jazz and gospel piano to the sharp delivery of an elite emcee, Dez has spent over three decades evolving into a complete, full-circle musical force capable of holding their own on any level.\n\nThat journey took shape early on with Elevation Nation, laying the foundational groundwork for a lifetime of sharp execution. Moving his creative energy down to Florida's Treasure Coast, he brought vital production and artistic support to the US-1 label, sharpening a signature sonic blueprint. Today, that relentless drive continues in the lab, currently working with E-Productions at Mo Budmans Studios.\n\nThese eras and alliances have forged a style that seamlessly blends the soulful, sophisticated harmonies of gospel and jazz with the raw, gritty aesthetic of classic 80s and 90s hip-hop. Whether commanding a room from the keys, laying down a formidable verse, or manipulating hardware behind the boards, every element of their work carries a distinct, authentic weight.\n\nThis multi-dimensional artistry naturally demanded a larger canvas, leading to the creation of Beats by Dez — an independent music and clothing brand where sound and street culture collide. As the chief producer, lyricist, and visual designer, Dez translates over thirty years of musical history into bold, graffiti-inspired apparel and striking visual art, proving that true independent legacy is built, not given.",
        "image": DEZ_LOGO,
    },
]

SEED_PRODUCTS = [
    {
        "slug": "graffiti-hoodie",
        "title": "BEATSBYDEZ — GRAFFITI HOODIE",
        "artist": "DEZ",
        "category": "apparel",
        "price": 110.00,
        "image": GRAFFITI_MERCH,
        "images": [GRAFFITI_MERCH],
        "description": "The signature graffiti tag, screen-printed across the chest in full colour. Heavyweight 380gsm hoodie. Available in royal blue, optic white, and heather grey.",
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "is_limited": True,
        "is_new_drop": True,
        "stock": 195,
        "total_supply": 400,
        "sold_count": 247,
        "drop_ends_at": _drop_ends(9),
    },
    {
        "slug": "graffiti-tee",
        "title": "BEATSBYDEZ — GRAFFITI TEE",
        "artist": "DEZ",
        "category": "apparel",
        "price": 52.00,
        "image": GRAFFITI_MERCH,
        "images": [GRAFFITI_MERCH],
        "description": "Soft heavyweight tee with the full BeatsByDez airbrush tag printed across the front. Royal blue, optic white, heather grey.",
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "is_new_drop": True,
        "stock": 510,
    },
    {
        "slug": "beats-by-dez-cap",
        "title": "BEATS BY DEZ — DAD CAP",
        "artist": "DEZ",
        "category": "accessories",
        "price": 38.00,
        "image": LUNG_PUNCH_MERCH,
        "images": [LUNG_PUNCH_MERCH],
        "description": "Six-panel unstructured dad cap. Red script 'Beats By Dez' embroidery on the front. Curved brim, adjustable strap-back. Black or charcoal.",
        "is_new_drop": True,
        "stock": 480,
    },
    {
        "slug": "dez-tapes-vinyl",
        "title": "DEZ TAPES — VOL. 01 VINYL",
        "artist": "DEZ",
        "category": "vinyl",
        "price": 42.00,
        "image": DEZ_LOGO,
        "images": [DEZ_LOGO],
        "description": "Double-disc, 180g translucent purple pressing of Dez's first instrumental tape. Hand-numbered jacket. 24-page zine with track-by-track production notes. Limited to 2,500 worldwide.",
        "is_limited": True,
        "stock": 240,
        "total_supply": 2500,
        "sold_count": 1843,
        "drop_ends_at": _drop_ends(14),
    },
]


SEED_INSTRUMENTALS = [
    # FOR-SALE — coming soon (placeholders until real paid beats uploaded)
    {
        "slug": "obsidian-bounce",
        "title": "OBSIDIAN BOUNCE",
        "mood": "TRAP",
        "bpm": 142,
        "key": "F# Minor",
        "audio_url": "",
        "cover": "/dez-logo.png",
        "is_free": False,
        "price": LEASE_PRICE,
        "license": LEASE_LABEL,
        "preview_seconds": 30,
        "coming_soon": True,
    },
    {
        "slug": "midnight-808s",
        "title": "MIDNIGHT 808s",
        "mood": "DRILL",
        "bpm": 148,
        "key": "G Minor",
        "audio_url": "",
        "cover": "/dez-logo.png",
        "is_free": False,
        "price": LEASE_PRICE,
        "license": LEASE_LABEL,
        "preview_seconds": 30,
        "coming_soon": True,
    },
    {
        "slug": "spraycan-soul",
        "title": "SPRAYCAN SOUL",
        "mood": "LO-FI",
        "bpm": 78,
        "key": "A Minor",
        "audio_url": "",
        "cover": "/dez-logo.png",
        "is_free": False,
        "price": LEASE_PRICE,
        "license": LEASE_LABEL,
        "preview_seconds": 30,
        "coming_soon": True,
    },
    # FREE — Dez's real productions
    {
        "slug": "weak-relatives",
        "title": "WEAK RELATIVES",
        "mood": "HIP HOP / FREE",
        "bpm": 88,
        "key": "A Minor",
        "audio_url": "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/hlhaon6o_The%201FatDUDe-weak%20as%20relatives-Open-High.mp3",
        "cover": "/dez-logo.png",
        "is_free": True,
        "price": 0.0,
    },
    {
        "slug": "lover-i-know",
        "title": "LOVER I KNOW",
        "mood": "SOUL / FREE",
        "bpm": 82,
        "key": "C Minor",
        "audio_url": "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/32jghgbi_Lover%20i%20know%2082mix.mp3",
        "cover": "/dez-logo.png",
        "is_free": True,
        "price": 0.0,
    },
    {
        "slug": "all-of-it",
        "title": "ALL OF IT",
        "mood": "HIP HOP / FREE",
        "bpm": 92,
        "key": "D Minor",
        "audio_url": "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/427p94pz_all%20of%20it.mp3",
        "cover": "/dez-logo.png",
        "is_free": True,
        "price": 0.0,
    },
    {
        "slug": "bounce-back-again",
        "title": "BOUNCE BACK AGAIN",
        "mood": "BOOM BAP / FREE",
        "bpm": 95,
        "key": "F Minor",
        "audio_url": "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/n6flq9si_bounce%20back%20again%20SONG%20full.mp3",
        "cover": "/dez-logo.png",
        "is_free": True,
        "price": 0.0,
    },
    {
        "slug": "too-late",
        "title": "TOO LATE",
        "mood": "GOSPEL JAZZ / FREE",
        "bpm": 86,
        "key": "G Minor",
        "audio_url": "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/ns555hgo_too%20late%20v3.mp3",
        "cover": "/dez-logo.png",
        "is_free": True,
        "price": 0.0,
    },
]


@app.on_event("startup")
async def seed_database():
    # Upsert catalog by slug so ids and download counters survive restarts
    seeds = [
        (db.artists, Artist, "artist", SEED_ARTISTS, set()),
        (db.products, Product, "product", SEED_PRODUCTS, set()),
        (db.instrumentals, Instrumental, "beat", SEED_INSTRUMENTALS, {"downloads"}),
    ]
    for coll, model, prefix, items, keep in seeds:
        slugs = [it["slug"] for it in items]
        await coll.delete_many({"slug": {"$nin": slugs}})
        for it in items:
            doc = model(id=str(uuid.uuid5(uuid.NAMESPACE_URL, f"{prefix}:{it['slug']}")), **it).model_dump()
            on_insert = {k: doc.pop(k) for k in keep | {"id"}}
            await coll.update_one({"slug": it["slug"]}, {"$set": doc, "$setOnInsert": on_insert}, upsert=True)
    await seed_admin(db)
    await db.newsletter.create_index("email", unique=True)


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "BeatsByDez Store API"}


@api_router.get("/products", response_model=List[Product])
async def list_products(category: Optional[str] = None, artist: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    if artist:
        query["artist"] = artist
    docs = await db.products.find(query, {"_id": 0}).to_list(500)
    return [Product(**d) for d in docs]


@api_router.get("/products/{slug}", response_model=Product)
async def get_product(slug: str):
    doc = await db.products.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**doc)


@api_router.get("/artists", response_model=List[Artist])
async def list_artists():
    docs = await db.artists.find({}, {"_id": 0}).to_list(100)
    return [Artist(**d) for d in docs]


@api_router.get("/artists/{slug}", response_model=Artist)
async def get_artist(slug: str):
    doc = await db.artists.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Artist not found")
    return Artist(**doc)


@api_router.post("/orders", response_model=Order)
async def create_order(payload: OrderCreate):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    enriched_items = []
    subtotal = 0.0
    physical_subtotal = 0.0
    for item in payload.items:
        if item.quantity < 1:
            raise HTTPException(status_code=400, detail="Quantity must be at least 1")
        prod = await db.products.find_one({"id": item.product_id}, {"_id": 0})
        if prod:
            line = {"title": prod["title"], "artist": prod["artist"], "image": prod["image"],
                    "price": prod["price"], "size": item.size, "kind": "merch"}
        else:
            beat = await db.instrumentals.find_one({"id": item.product_id}, {"_id": 0})
            if not beat:
                raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
            if beat.get("is_free") or beat.get("coming_soon"):
                raise HTTPException(status_code=400, detail=f"{beat['title']} is not for sale yet")
            line = {"title": beat["title"], "artist": "DEZ", "image": beat["cover"],
                    "price": beat["price"], "size": beat.get("license") or LEASE_LABEL, "kind": "beat"}
        line_total = line["price"] * item.quantity
        subtotal += line_total
        if line["kind"] == "merch":
            physical_subtotal += line_total
        enriched_items.append({
            "product_id": item.product_id,
            **line,
            "quantity": item.quantity,
            "line_total": round(line_total, 2),
        })

    shipping = 0.0 if physical_subtotal == 0 or physical_subtotal >= 100 else 9.99
    total = round(subtotal + shipping, 2)
    order_number = "BBD-" + str(uuid.uuid4())[:8].upper()

    order = Order(
        order_number=order_number,
        items=enriched_items,
        customer_name=payload.customer_name,
        customer_email=payload.customer_email,
        shipping_address=payload.shipping_address,
        city=payload.city,
        zip_code=payload.zip_code,
        country=payload.country,
        subtotal=round(subtotal, 2),
        shipping=shipping,
        total=total,
    )
    await db.orders.insert_one(order.model_dump())
    return order


@api_router.get("/orders/{order_number}", response_model=Order)
async def get_order(order_number: str):
    doc = await db.orders.find_one({"order_number": order_number}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    return Order(**doc)


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for", "")
    return fwd.split(",")[0].strip() if fwd else (request.client.host if request.client else "unknown")


@api_router.post("/newsletter")
async def newsletter_signup(payload: NewsletterSignup, request: Request):
    email = payload.email.lower()
    if await db.newsletter.find_one({"email": email}):
        return {"success": True, "already_subscribed": True, "message": "You're already on the list"}
    ip = _client_ip(request)
    hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    if await db.newsletter.count_documents({"ip": ip, "subscribed_at": {"$gte": hour_ago}}) >= 5:
        raise HTTPException(status_code=429, detail="Too many signups. Try again later.")
    await db.newsletter.insert_one({
        "email": email,
        "ip": ip,
        "subscribed_at": datetime.now(timezone.utc).isoformat(),
        "welcome_sent": False,
    })
    try:
        await send_email(to=email, subject="Welcome to my world — Beats by Dez", html=welcome_email_html())
        await db.newsletter.update_one({"email": email}, {"$set": {"welcome_sent": True}})
        sent = True
    except Exception as e:
        logger.error(f"Welcome email failed for signup: {e}")
        sent = False
    return {"success": True, "already_subscribed": False, "welcome_sent": sent, "message": "Subscribed"}


# ---------- Admin ----------
@api_router.post("/auth/login")
async def admin_login(payload: LoginRequest, request: Request, response: Response):
    email = payload.email.lower()
    identifier = f"login:{email}"
    await check_lockout(db, identifier)
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        await record_failure(db, identifier)
        raise HTTPException(status_code=401, detail="Wrong email or password")
    await db.login_attempts.delete_one({"identifier": identifier})
    set_auth_cookie(response, create_access_token(str(user["_id"]), email))
    return {"id": str(user["_id"]), "email": email, "name": user.get("name"), "role": user["role"]}


@api_router.post("/auth/logout")
async def admin_logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"success": True}


@api_router.get("/auth/me")
async def admin_me(request: Request):
    return await get_admin(request, db)


async def _subscribers():
    return await db.newsletter.find(
        {}, {"_id": 0, "email": 1, "subscribed_at": 1, "welcome_sent": 1}
    ).sort("subscribed_at", -1).to_list(10000)


@api_router.get("/admin/subscribers")
async def list_subscribers(request: Request):
    await get_admin(request, db)
    subs = await _subscribers()
    return {"count": len(subs), "subscribers": subs}


@api_router.get("/admin/subscribers.csv")
async def export_subscribers(request: Request):
    await get_admin(request, db)
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["email", "subscribed_at", "welcome_sent"])
    for s_ in await _subscribers():
        writer.writerow([s_["email"], s_.get("subscribed_at", ""), s_.get("welcome_sent", False)])
    return PlainTextResponse(buf.getvalue(), media_type="text/csv",
                             headers={"Content-Disposition": "attachment; filename=beatsbydez-subscribers.csv"})


@api_router.get("/instrumentals", response_model=List[Instrumental])
async def list_instrumentals(free_only: bool = False):
    query = {"is_free": True} if free_only else {}
    docs = await db.instrumentals.find(query, {"_id": 0}).to_list(200)
    return [Instrumental(**d) for d in docs]


@api_router.post("/instrumentals/{slug}/download", response_model=DownloadResponse)
async def download_instrumental(slug: str):
    doc = await db.instrumentals.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Instrumental not found")
    if not doc.get("is_free"):
        raise HTTPException(status_code=403, detail="This beat is for sale, not free download")
    await db.instrumentals.update_one(
        {"slug": slug}, {"$inc": {"downloads": 1}}
    )
    return DownloadResponse(audio_url=doc["audio_url"], downloads=doc.get("downloads", 0) + 1)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
