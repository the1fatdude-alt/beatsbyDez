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

app = FastAPI(title="Sony Music HipHop Store - BeatsByDez")
api_router = APIRouter(prefix="/api")

DEZ_LOGO = "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/ixiugo5j_Gemini_Generated_Image_.png"
DEZ_PORTRAIT = "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/5btnld6i_Snapchat-1994296522.jpg"
DEZ_STUDIO = "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/m0zgehx2_7bc86a47-de2b-4392-b5a0-e74e5d409500.jpg"
LUNG_PUNCH = "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/t4dqvb7t_Gemini_Generated_Image_%20%281%29-EDIT.jpg"


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
        "image": LUNG_PUNCH,
        "images": [LUNG_PUNCH],
        "description": "The new project. Lung Punch — twelve tracks of pure smoke and bass. Limited red-and-black splatter vinyl. Numbered jacket, exclusive zine, instrumental download code. Signed by Dez.",
        "is_limited": True,
        "is_new_drop": True,
        "stock": 613,
        "total_supply": 1000,
        "sold_count": 387,
        "drop_ends_at": _drop_ends(7),
    },
    {
        "slug": "dez-tapes-vinyl",
        "title": "DEZ TAPES — VOL. 01 VINYL",
        "artist": "DEZ",
        "category": "vinyl",
        "price": 42.00,
        "image": "https://images.unsplash.com/photo-1619983081563-430f63602796?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzV8MHwxfHNlYXJjaHwxfHx2aW55bCUyMHJlY29yZCUyMGhpcCUyMGhvcHxlbnwwfHx8fDE3Nzk3NjU3NTR8MA&ixlib=rb-4.1.0&q=85",
        "images": [],
        "description": "Double-disc, 180g translucent purple pressing of Dez's first instrumental tape. Hand-numbered jacket. 24-page zine with track-by-track production notes. Limited to 2,500 worldwide.",
        "is_limited": True,
        "is_new_drop": True,
        "stock": 240,
    },
    {
        "slug": "beats-vol-2-cd",
        "title": "BEATS VOL. 02 — CD",
        "artist": "DEZ",
        "category": "cd",
        "price": 18.00,
        "image": "https://images.unsplash.com/photo-1619983081636-a91694656575?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzV8MHwxfHNlYXJjaHw0fHx2aW55bCUyMHJlY29yZCUyMGhpcCUyMGhvcHxlbnwwfHx8fDE3Nzk3NjU3NTR8MA&ixlib=rb-4.1.0&q=85",
        "images": [],
        "description": "Twenty-one heaters in yellow casing. Loops, drum kits, vocal chops — every stem cleared for sample use with the included license card.",
        "is_new_drop": True,
        "stock": 580,
    },
    {
        "slug": "beatsbydez-hoodie",
        "title": "BEATSBYDEZ — GRAFFITI HOODIE",
        "artist": "DEZ",
        "category": "apparel",
        "price": 110.00,
        "image": "https://images.pexels.com/photos/14241847/pexels-photo-14241847.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "images": [],
        "description": "Heavyweight 400gsm cotton hoodie. Full-back screen print of the BeatsByDez tag in neon yellow & cyan. Embroidered sleeve mark. Garment-dyed obsidian black.",
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "is_new_drop": True,
        "is_limited": True,
        "stock": 320,
        "total_supply": 500,
        "sold_count": 312,
        "drop_ends_at": _drop_ends(10),
    },
    {
        "slug": "beatsbydez-tee",
        "title": "BEATSBYDEZ — TAG TEE",
        "artist": "DEZ",
        "category": "apparel",
        "price": 48.00,
        "image": "https://images.pexels.com/photos/15360024/pexels-photo-15360024.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "images": [],
        "description": "Boxy-fit heavyweight tee, jet black. Oversized back graphic in neon yellow. Small chest hit. 100% combed ringspun cotton.",
        "sizes": ["S", "M", "L", "XL"],
        "is_new_drop": True,
        "stock": 410,
    },
    {
        "slug": "dez-signal-chain",
        "title": "DEZ SIGNAL CHAIN",
        "artist": "DEZ",
        "category": "accessories",
        "price": 160.00,
        "image": "https://images.unsplash.com/photo-1765153417747-73d012027e36?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjd8MHwxfHNlYXJjaHw0fHxzdHJlZXR3ZWFyJTIwYWNjZXNzb3JpZXMlMjBzdW5nbGFzc2VzJTIwY2hhaW58ZW58MHx8fHwxNzc5NzY1NzczfDA&ixlib=rb-4.1.0&q=85",
        "images": [],
        "description": "Stainless steel cuban link, 22 inches. Hand-finished signal-red enamel D pendant. Anti-tarnish coating. Numbered edition of 250.",
        "is_limited": True,
        "stock": 95,
        "total_supply": 250,
        "sold_count": 189,
        "drop_ends_at": _drop_ends(5),
    },
    {
        "slug": "studio-sessions-vinyl",
        "title": "STUDIO SESSIONS — LP",
        "artist": "DEZ",
        "category": "vinyl",
        "price": 36.00,
        "image": "https://images.unsplash.com/photo-1619983081563-430f63602796?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzV8MHwxfHNlYXJjaHwxfHx2aW55bCUyMHJlY29yZCUyMGhpcCUyMGhvcHxlbnwwfHx8fDE3Nzk3NjU3NTR8MA&ixlib=rb-4.1.0&q=85",
        "images": [],
        "description": "Single LP, 140g black wax. Twelve unreleased studio cuts. Includes A2 lyric poster and instrumental download code.",
        "stock": 510,
    },
    {
        "slug": "graffiti-tee",
        "title": "GRAFFITI WALL TEE",
        "artist": "DEZ",
        "category": "apparel",
        "price": 44.00,
        "image": "https://images.unsplash.com/photo-1507553532144-b9df5e38c8d1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NDh8MHwxfHNlYXJjaHwyfHxzdHJlZXR3ZWFyJTIwZmFzaGlvbiUyMG1vZGVsfGVufDB8fHx8MTc3OTc2NTc3Mnww&ixlib=rb-4.1.0&q=85",
        "images": [],
        "description": "Vintage-feel washed cotton. Full BeatsByDez wall print across the back. Made to fade in like the real wall.",
        "sizes": ["S", "M", "L", "XL"],
        "stock": 220,
    },
    {
        "slug": "dez-snapback",
        "title": "DEZ TAG SNAPBACK",
        "artist": "DEZ",
        "category": "accessories",
        "price": 38.00,
        "image": "https://images.unsplash.com/photo-1765153417747-73d012027e36?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjd8MHwxfHNlYXJjaHw0fHxzdHJlZXR3ZWFyJTIwYWNjZXNzb3JpZXMlMjBzdW5nbGFzc2VzJTIwY2hhaW58ZW58MHx8fHwxNzc5NzY1NzczfDA&ixlib=rb-4.1.0&q=85",
        "images": [],
        "description": "Structured 6-panel snapback. Neon-yellow embroidered D, flat brim, adjustable back.",
        "stock": 600,
    },
]


@app.on_event("startup")
async def seed_database():
    # Force-refresh seed (single-artist site rebrand)
    await db.products.delete_many({})
    await db.artists.delete_many({})
    for a in SEED_ARTISTS:
        artist = Artist(**a)
        await db.artists.insert_one(artist.model_dump())
    for p in SEED_PRODUCTS:
        product = Product(**p)
        await db.products.insert_one(product.model_dump())


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Sony Music HipHop x BeatsByDez API"}


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
    order_number = "SM-" + str(uuid.uuid4())[:8].upper()

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
