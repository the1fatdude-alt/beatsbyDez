from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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
    email: str


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
        "bio": "Producer. Architect of the underground. Dez doesn't chase the wave — he builds it. From dust-cracked vinyl loops to skull-rattling 808s, every beat is signed in spray paint. BEATSBYDEZ is the sound the whole game is biting next.",
        "image": DEZ_LOGO,
    },
]

SEED_PRODUCTS = [
    {
        "slug": "lung-punch-vinyl",
        "title": "LUNG PUNCH — VINYL LP",
        "artist": "DEZ",
        "category": "vinyl",
        "price": 45.00,
        "image": LUNG_PUNCH_LOGO,
        "images": [LUNG_PUNCH_LOGO],
        "description": "The new project. Lung Punch — twelve tracks of pure smoke and bass. Limited red-and-black splatter vinyl. Numbered jacket, exclusive zine, instrumental download code. Signed by Dez.",
        "is_limited": True,
        "is_new_drop": True,
        "stock": 613,
        "total_supply": 1000,
        "sold_count": 387,
        "drop_ends_at": _drop_ends(7),
    },
    {
        "slug": "lung-punch-hoodie",
        "title": "LUNG PUNCH — HOODIE",
        "artist": "DEZ",
        "category": "apparel",
        "price": 95.00,
        "image": LUNG_PUNCH_MERCH,
        "images": [LUNG_PUNCH_MERCH],
        "description": "Heavyweight 400gsm cotton hoodie. Full-front Lung Punch graphic — embroidered lungs, red fist, dripping bass. Available in jet black and heather grey. Garment-washed for instant worn-in feel.",
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "is_limited": True,
        "is_new_drop": True,
        "stock": 280,
        "total_supply": 500,
        "sold_count": 218,
        "drop_ends_at": _drop_ends(12),
    },
    {
        "slug": "lung-punch-crew",
        "title": "LUNG PUNCH — CREW SWEATSHIRT",
        "artist": "DEZ",
        "category": "apparel",
        "price": 78.00,
        "image": LUNG_PUNCH_MERCH,
        "images": [LUNG_PUNCH_MERCH],
        "description": "Heather charcoal crewneck with 'Beats By Dez' script across the chest. Mid-weight fleece, ribbed cuffs and hem.",
        "sizes": ["S", "M", "L", "XL"],
        "is_new_drop": True,
        "stock": 340,
    },
    {
        "slug": "lung-punch-tee",
        "title": "LUNG PUNCH — TEE",
        "artist": "DEZ",
        "category": "apparel",
        "price": 42.00,
        "image": LUNG_PUNCH_MERCH,
        "images": [LUNG_PUNCH_MERCH],
        "description": "Black premium cotton tee. Centred Lung Punch graphic with 'Beats By Dez' inset on the arm. 100% combed ringspun cotton, 6.5oz weight.",
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "is_new_drop": True,
        "stock": 420,
    },
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
    # FOR-SALE — 30s previews
    {
        "slug": "obsidian-bounce",
        "title": "OBSIDIAN BOUNCE",
        "mood": "TRAP",
        "bpm": 142,
        "key": "F# Minor",
        "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        "cover": "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/c32fw61l_Gemini_Generated_Image_-EDIT.jpg",
        "is_free": False,
        "price": 34.99,
        "preview_seconds": 30,
    },
    {
        "slug": "lung-punch-instrumental",
        "title": "LUNG PUNCH (INSTR)",
        "mood": "BOOM BAP",
        "bpm": 92,
        "key": "C Minor",
        "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        "cover": "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/t4dqvb7t_Gemini_Generated_Image_%20%281%29-EDIT.jpg",
        "is_free": False,
        "price": 49.99,
        "preview_seconds": 30,
    },
    {
        "slug": "midnight-808s",
        "title": "MIDNIGHT 808s",
        "mood": "DRILL",
        "bpm": 148,
        "key": "G Minor",
        "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        "cover": "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/c32fw61l_Gemini_Generated_Image_-EDIT.jpg",
        "is_free": False,
        "price": 29.99,
        "preview_seconds": 30,
    },
    {
        "slug": "spraycan-soul",
        "title": "SPRAYCAN SOUL",
        "mood": "LO-FI",
        "bpm": 78,
        "key": "A Minor",
        "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        "cover": "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/t4dqvb7t_Gemini_Generated_Image_%20%281%29-EDIT.jpg",
        "is_free": False,
        "price": 24.99,
        "preview_seconds": 30,
    },
    # FREE — 3 free downloads
    {
        "slug": "weak-relatives",
        "title": "WEAK RELATIVES",
        "mood": "HIP HOP / FREE",
        "bpm": 88,
        "key": "A Minor",
        "audio_url": "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/hlhaon6o_The%201FatDUDe-weak%20as%20relatives-Open-High.mp3",
        "cover": "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/c32fw61l_Gemini_Generated_Image_-EDIT.jpg",
        "is_free": True,
        "price": 0.0,
    },
    {
        "slug": "free-starter-02",
        "title": "STARTER PACK 02",
        "mood": "BOOM BAP / FREE",
        "bpm": 88,
        "key": "F Minor",
        "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
        "cover": "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/c32fw61l_Gemini_Generated_Image_-EDIT.jpg",
        "is_free": True,
        "price": 0.0,
    },
    {
        "slug": "free-wall-bounce",
        "title": "WALL BOUNCE FREEBIE",
        "mood": "LO-FI / FREE",
        "bpm": 82,
        "key": "E Minor",
        "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
        "cover": "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/c32fw61l_Gemini_Generated_Image_-EDIT.jpg",
        "is_free": True,
        "price": 0.0,
    },
]


@app.on_event("startup")
async def seed_database():
    # Force-refresh seed (single-artist site rebrand)
    await db.products.delete_many({})
    await db.artists.delete_many({})
    await db.instrumentals.delete_many({})
    for a in SEED_ARTISTS:
        artist = Artist(**a)
        await db.artists.insert_one(artist.model_dump())
    for p in SEED_PRODUCTS:
        product = Product(**p)
        await db.products.insert_one(product.model_dump())
    for inst in SEED_INSTRUMENTALS:
        instrumental = Instrumental(**inst)
        await db.instrumentals.insert_one(instrumental.model_dump())


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
    for item in payload.items:
        prod = await db.products.find_one({"id": item.product_id}, {"_id": 0})
        if not prod:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        line_total = prod["price"] * item.quantity
        subtotal += line_total
        enriched_items.append({
            "product_id": prod["id"],
            "title": prod["title"],
            "artist": prod["artist"],
            "price": prod["price"],
            "image": prod["image"],
            "quantity": item.quantity,
            "size": item.size,
            "line_total": round(line_total, 2),
        })

    shipping = 0.0 if subtotal >= 100 else 9.99
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


@api_router.post("/newsletter")
async def newsletter_signup(payload: NewsletterSignup):
    await db.newsletter.update_one(
        {"email": payload.email},
        {"$set": {"email": payload.email, "subscribed_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"success": True, "message": "Subscribed"}


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

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
