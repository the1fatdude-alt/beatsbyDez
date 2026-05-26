# Sony Music HipHop × BeatsByDez — Product Requirements

## Original Problem Statement
> "Build an e-commerce site for Sony Music — hip hop style." Clarified: **The only person featured on this site is The Producer, Dez.**

## Architecture
- **Backend**: FastAPI + Motor (MongoDB), auto-seeded on startup, all routes prefixed `/api`.
- **Frontend**: React + React Router + Tailwind + Shadcn UI (Sheet for cart). Cart state in `localStorage`.
- **Design**: Dark brutalist Swiss / streetwear. `#FF3300` signal red + `#DFFF00` neon yellow accents. Bebas Neue + Outfit. Grain overlay, glowing radial spotlights, marquee tickers.

## User Personas
- **The Fan / Beat Connoisseur** — wants vinyl, CDs, and merch directly from Dez. Browses by category, expects fast checkout.

## Core Requirements (Static)
- Single-producer storefront under the Sony Music HipHop umbrella.
- Catalog of vinyl, CDs, apparel, accessories — all by DEZ.
- Guest checkout, no auth, mocked payment.
- Cart persists across sessions.
- Producer (Dez) bio page.
- Newsletter capture.

## Implemented (2026-02)
- 8 seeded products, 1 artist (Dez).
- Endpoints: `/api/products`, `/api/products/{slug}`, `/api/artists`, `/api/artists/{slug}`, `/api/orders`, `/api/orders/{order_number}`, `/api/newsletter`.
- Pages: Home, Shop (category filters), Product Detail (size + qty + add-to-cart), Cart Sheet, Checkout, Order Success, Producer page.
- Hero featuring the BeatsByDez graffiti artwork with neon radial glows.
- Marquee tickers, brutalist grid card layouts, sticky glass nav, footer newsletter.
- Free shipping ≥ $100, else $9.99.
- E2E tested: 14/14 backend + full frontend flow.

## Backlog (P0/P1/P2)
- **P1** Migrate FastAPI startup/shutdown to `lifespan` handler.
- **P1** Stripe live checkout (replace mock).
- **P2** Product image gallery (multiple shots per item).
- **P2** Order history (requires auth — JWT or Emergent Google).
- **P2** Search.
- **P2** Admin dashboard for Dez to manage drops.
- **P2** Email confirmation on order (Resend/SendGrid).
- **P2** Pre-order / countdown for upcoming drops.

## Next Tasks
1. Decide on payments (Stripe live vs keep mock).
2. Add product image galleries.
3. Add auth + order history if user wants account flow.
