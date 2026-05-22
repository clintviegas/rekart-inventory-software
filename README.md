# Rekart OMS

Order management system for refurbished-laptop retail. React + Vite frontend, Express + MongoDB backend, deployed as a single Vercel project.

7 service verticals: **Buy, Sell, Repair, Trade-In, Insurance, Rent, Recycle**.

## Quick start

```bash
npm install
cp .env.example .env       # fill in MONGODB_URI and JWT_SECRET
npm run seed               # imports 43 laptops from scripts/PRICELIST.xlsx
npm run dev:all            # Vite + Express on :5173 and :3001
```

First visit creates the admin account.

## Deploying

See [DEPLOY.md](./DEPLOY.md) for the full Atlas + Vercel walkthrough.

## Stack

- **Frontend:** React 19, Vite 8, lucide-react, react-hot-toast
- **API:** Express 5, Mongoose 9, JWT cookies (bcryptjs)
- **DB:** MongoDB Atlas (free M0 tier is plenty)
- **Host:** Vercel (frontend as static, API as serverless function)

## Project layout

```
api/index.cjs                 Vercel serverless entrypoint
server/
  app.cjs                     Express app (mounted by Vercel + local server)
  index.cjs                   local server entry
  db.cjs, auth.cjs, models.cjs
  routes/
    auth.cjs                  signup/login/logout/me
    zoho.cjs                  generic CRUD for the 6 inventory sections
    oms.cjs                   Order Desk
scripts/
  seed-pricelist.cjs          imports PRICELIST.xlsx
  PRICELIST.xlsx              source pricing data
src/
  main.jsx, App.jsx
  context/  AuthContext, FormContext
  components/
    Login.jsx, AuthGate.jsx
    OrderDesk.jsx, OrderDetailModal.jsx, ProductPicker.jsx
    ProductMaster.jsx, DeviceTracking.jsx, InventoryStock.jsx,
    PricingMargin.jsx, RefurbishmentGrade.jsx, MarketplaceChannels.jsx,
    Dashboard.jsx, RecordsTable.jsx, EditRecordModal.jsx, Sidebar.jsx
  api/  authApi.js, omsApi.js, zohoApi.js
  schema.js                   field definitions for all sections
```
