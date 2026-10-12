# Timera Backend (FastAPI)

Standalone FastAPI app: customer website at `/`, admin panel at `/admin`, API at `/api/v1`.

## Folders
- `app/main.py` – app entry, mounts routers, `/uploads` and `/admin`
- `app/core/` – config (.env), database, security (JWT + bcrypt), helpers
- `app/models.py` – every database table
- `app/routers/` – `public` (catalogue/settings), `auth`, `orders` (checkout + tracking), `tracking` (analytics, cart leads, Meta bridge), `admin` (full CRUD)
- `app/services/` – `email.py` (order emails over SMTP, logged), `meta.py` (Meta Conversions API)
- `app/admin_panel/index.html` – admin panel served at `/admin`
- `scripts/create_admin.py`, `scripts/import_json.py`
- `data_export/` – your current products, orders, leads, settings and images
- `tests/` – automated end-to-end test

## Run on a VPS (Docker)
```bash
cp .env.example .env        # fill JWT_SECRET, PUBLIC_BASE_URL, CORS_ORIGINS, SMTP_*, META_*
docker compose up -d --build
docker compose exec api python -m scripts.import_json data_export
docker compose exec api python -m scripts.create_admin you@email.com YourPassword
```
Admin panel: `https://api.yourdomain.com/admin` · API docs: `/docs`.
Put Nginx/Caddy in front for HTTPS (proxy to port 8000, set `client_max_body_size 200M`).

## Without Docker
```bash
python3 -m venv venv && . venv/bin/activate && pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Key API (prefix `/api/v1`)
Public: `GET /products`, `/products/{slug}`, `/collections`, `/categories`, `/hero-slides`, `/deals`, `/popups`, `/reviews`, `/blog`, `/blog/{slug}`, `/faqs`, `/trust`, `/settings`; `POST /reviews`, `/coupons/validate`
Auth: `POST /auth/signup`, `/auth/login` → `token`; `GET /auth/session`, `GET|PUT /auth/profile` (header `Authorization: Bearer <token>`)
Orders: `POST /orders` (prices recomputed on server, `idempotency_key` stops double orders), `GET /orders/{number}?email=` or `?phone=`
Tracking: `POST /track/event`, `/track/lead`, `/track/meta`
Admin (admin/staff only): `/admin/r/{table}` CRUD, `/admin/settings/{site_settings|payment_settings|meta_settings}`, `/admin/orders`, `PATCH /admin/orders/{id}`, `/admin/stats`, `/admin/upload`, `/admin/users`

## Emails
Sent automatically when an order is placed, and when admin sets status to confirmed / shipped / delivered / cancelled. Every email (sent or failed) appears in admin → "Emails sent". Needs SMTP settings in `.env`.

## Tests
`pip install -r requirements.txt && pytest -q`
