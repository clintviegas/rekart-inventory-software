# Rekart OMS — Deployment Guide

Stack: React + Vite (frontend) · Express 5 + Mongoose (API) · MongoDB Atlas · Vercel.

Everything below is free-tier friendly and can be set up in under 30 minutes.

---

## 1. MongoDB Atlas

1. Sign up: <https://www.mongodb.com/cloud/atlas/register>
2. **Create a free M0 cluster** (any region close to you — pick AWS Mumbai or Frankfurt for UAE).
3. **Database Access → Add new user**
   - Username: `rekart`
   - Password: generate one, **save it** (you'll paste it into Vercel later).
   - Built-in role: `Read and write to any database`.
4. **Network Access → Add IP Address → Allow access from anywhere (0.0.0.0/0)**.
   (Required because Vercel functions have dynamic IPs. For tighter security, use Vercel's static-IP add-on later.)
5. **Database → Connect → Drivers → Node.js**. Copy the SRV string. It will look like:
   ```
   mongodb+srv://rekart:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Insert the database name** between `.net/` and the `?`:
   ```
   mongodb+srv://rekart:<password>@cluster0.xxxxx.mongodb.net/rekart_oms?retryWrites=true&w=majority
   ```
   (`rekart_oms` is the DB name. Mongoose will create it on first write.)

---

## 2. Local setup

```bash
git clone https://github.com/clintviegas/rekart-inventory-software.git
cd rekart-inventory-software
npm install

cp .env.example .env
# Edit .env and paste:
#   MONGODB_URI=mongodb+srv://...
#   JWT_SECRET=<generate one — see below>
```

Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Seed the product catalogue (43 laptops from PRICELIST.xlsx)
```bash
npm run seed
```

### Run dev server (Vite + Express in parallel)
```bash
npm run dev:all
```
- Frontend: <http://localhost:5173>
- API:      <http://localhost:3001>

On first visit you'll see the **signup screen** (the first account becomes the admin).
After that, only the admin can create more accounts via the same form.

---

## 3. Deploy to Vercel

1. Push your repo to GitHub (or use the existing one).
2. <https://vercel.com/new> → **Import** your repo.
3. Framework preset: **Vite** (Vercel auto-detects).
4. **Environment Variables** — add these in the Vercel project settings:

   | Key | Value |
   |---|---|
   | `MONGODB_URI` | the Atlas SRV string from step 1.6 |
   | `JWT_SECRET`  | the 96-char random hex from above |
   | `NODE_ENV`    | `production` |

5. Click **Deploy**. Vercel reads `vercel.json`:
   - `npm run build` → static frontend → `dist/`
   - `/api/:path*` → `api/index.cjs` (Express serverless function)
   - Everything else → `index.html` (SPA fallback)

6. After deploy, open `https://<your-project>.vercel.app`.
   First visit shows the signup screen → create the admin account → land on the OMS.

### Seed against the production DB

From your local machine (the seed script uses the same `MONGODB_URI` env var):
```bash
MONGODB_URI="<your prod URI>" npm run seed
```

---

## 4. Architecture recap

```
┌──────────────────┐       ┌─────────────────────┐       ┌──────────────────┐
│  React + Vite    │       │   Express on Vercel │       │  MongoDB Atlas   │
│  (dist/, SPA)    │ ───▶  │   api/index.cjs     │ ───▶  │  rekart_oms DB   │
└──────────────────┘       └─────────────────────┘       └──────────────────┘
        ▲                            │
        │                            ▼
        │                  ┌─────────────────────┐
        └──── HttpOnly ────│   JWT cookie auth   │
              cookie       │  /api/auth/*        │
                           └─────────────────────┘
```

- **`/api/health`** — public, returns OK.
- **`/api/auth/*`** — public (signup/login/logout/me).
- **`/api/zoho/:section`** — generic CRUD for the 6 inventory sections (Product, Device, Inventory, Pricing, Refurbishment, Marketplace). Protected.
- **`/api/oms/*`** — Order Desk: create order (with stock movement), list, update, stats, product search. Protected.

Mongo collections: `users`, `products`, `devices`, `inventory`, `pricing`, `refurbishment`, `marketplace`, `customers`, `orders`.

---

## 5. Common operations

### Add another staff user
Sign in as admin → there's no UI yet; use:
```bash
curl https://<your-app>/api/auth/signup \
  -H "Content-Type: application/json" \
  -b "rekart_token=<your admin cookie>" \
  -d '{"email":"staff@rekart.com","password":"changeme","name":"Sameer"}'
```
(A user-management screen is the obvious next feature.)

### Wipe and re-seed
```bash
MONGODB_URI="..." node -e "require('mongoose').connect(process.env.MONGODB_URI).then(m => m.connection.dropDatabase().then(() => m.disconnect()))"
MONGODB_URI="..." npm run seed
```

### Stock control
Open Inventory & Stock section in the UI → edit a row → set `Available_Stock` and `Current_Stock`. The OMS Buy/Rent flow will decrement `Available_Stock` and increment `Reserved_Stock` on every order; Repair adds to `Repair_Stock`.

---

## 6. What's NOT yet wired up

- The original Zoho Creator code is still in `server/zohoCreator.cjs` and `server/ZOHO_CREATOR_SCHEMA.js`. They're no longer called by any route — safe to delete once you're sure the Mongo migration is good.
- No user-management UI (only admin-via-curl above).
- No Customers / Payments / Settings screens in the sidebar (the design shows them but they're placeholders).
- Stock-movement happens **before** order create — if order create fails, stock would be off by one. For production: wrap in a Mongo transaction (requires Atlas replica set, which the free tier provides).
