# Beats by Dez — Product Requirements

## Original Problem Statement
Started as "e-commerce site for Sony Music — hip hop style", then pivoted fully to **Beats by Dez**, the independent music + clothing brand of producer Dez. Absolutely no Sony Music branding or stock photos.

## Architecture
- Backend: FastAPI + Motor (MongoDB), all routes under `/api`. Catalog seeded by slug-upsert on startup (stable uuid5 ids; download counters persist).
- `backend/emailer.py`: Emergent managed email (Resend) with guardrail gate; welcome email template.
- `backend/auth.py`: single-admin JWT auth (httpOnly cookie), bcrypt, lockout after 5 failures.
- Frontend: React + Router + Tailwind + Shadcn. Cart in localStorage. Dark brutalist streetwear design (#FF3300 / #DFFF00, Bebas Neue + Outfit).

## Implemented
- Store: Home, Shop, Product Detail, Cart Sheet, Checkout (DEMO payment — MOCKED), Order Success, Producer bio page.
- Interactive graffiti Boombox (free downloads, 30-sec previews on paid beats), ambient background music, hype bars/countdowns.
- Lung Punch collection archived (logo kept on cap image).
- 2026-06: "Welcome to My World" mailing-list section on Home + footer signup; real welcome email sent on first signup; social links (placeholder URLs in `frontend/src/lib/socials.js`).
- 2026-06: Private `/admin` page (password login) listing signups + CSV download.
- 2026-06: Paid beats = $29.99 Non-Exclusive Lease, add to bag (qty 1, no shipping for digital-only orders); "Exclusive negotiable" note.

## Backlog
- P0 Dez uploads paid MP3s → replace the 3 coming-soon placeholders in `SEED_INSTRUMENTALS` (server.py), set audio_url, coming_soon False.
- P0 Real social profile URLs.
- P1 Real payments (Stripe) — checkout is still demo.
- P1 Deliver purchased beat files after payment (download link / email); protect paid full-length audio (serve preview clips only).
- P1 Order confirmation email.
- P2 Admin: manage drops/tracks without code; send newsletter broadcasts (must stay opt-in).
- P2 Multi-site sales/distribution (parked).
