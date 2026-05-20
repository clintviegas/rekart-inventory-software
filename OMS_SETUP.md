# Order Desk (OMS) — Setup

The Order Desk extends rekart-inventory with a walk-in / field / workshop
order punching workflow across 7 service verticals
(Buy, Sell, Repair, Trade-In, Insurance, Rent, Recycle).

Backend routes live at `/api/oms/*`; the frontend section appears in the
sidebar as **Order Desk**.

## What you need to do in Zoho Creator

The Order Desk reuses the existing `Product_Master` and `Inventory_Stock`
forms, but needs **two new forms** and **one new field** on `Inventory_Stock`.

Create these manually in https://creator.zoho.com → your `rekart-inventory`
app. Field link-names below are case-sensitive and must match exactly.

### 1. Add SKU field to `Inventory_Stock`

Open the existing `Inventory_Stock` form and add:

| Field link name | Type        | Notes                              |
| --------------- | ----------- | ---------------------------------- |
| `SKU`           | Single Line | Must match `Product_Master.SKU`    |

Without this field the OMS cannot find which inventory row to decrement
when an order is created.

### 2. New form: `Order_Master`

Create a new form named exactly `Order_Master`. Add the default list view
report and rename it to **`All_Orders`**.

| Field link name      | Type        | Values / notes                                                                  |
| -------------------- | ----------- | ------------------------------------------------------------------------------- |
| `Order_ID`           | Auto Number | Prefix `RKT-`                                                                   |
| `Customer_Name`      | Single Line |                                                                                 |
| `Customer_Phone`     | Phone       |                                                                                 |
| `Customer_Email`     | Email       | optional                                                                        |
| `Service_Type`       | Dropdown    | `Buy, Sell, Repair, Trade-In, Insurance, Rent, Recycle`                         |
| `Product_SKU`        | Single Line | optional; set by product picker                                                 |
| `Device_Description` | Single Line | free text                                                                       |
| `Amount`             | Decimal     | AED                                                                             |
| `Payment_Mode`       | Dropdown    | `Cash, Card (POS), Bank Transfer, Tabby / BNPL, Pending`                        |
| `Status`             | Dropdown    | `Pending, Processing, Completed, Cancelled, Awaiting Parts`                     |
| `Order_Date`         | Date        |                                                                                 |
| `Location`           | Dropdown    | `Dubai — HQ, Sharjah — Walk-in, India — Rohini, Field Visit`                    |
| `Handled_By`         | Single Line |                                                                                 |
| `Notes`              | Multi Line  |                                                                                 |
| `Fault_Description`  | Multi Line  | Repair only                                                                     |
| `Estimated_Delivery` | Date        | Repair only                                                                     |
| `Technician`         | Single Line | Repair only                                                                     |
| `Trade_In_Value`     | Decimal     | Trade-In only                                                                   |
| `Rental_Start_Date`  | Date        | Rent only                                                                       |
| `Rental_End_Date`    | Date        | Rent only                                                                       |
| `Stock_Adjusted`     | Dropdown    | `Yes, No` — written by backend after inventory mutation                         |

### 3. New form: `Customer_Master`

Create a new form named `Customer_Master`. Default report → **`All_Customers`**.

| Field link name | Type        | Notes                                            |
| --------------- | ----------- | ------------------------------------------------ |
| `Customer_Name` | Single Line |                                                  |
| `Phone`         | Phone       | OMS de-duplicates by phone                       |
| `Email`         | Email       |                                                  |
| `Address`       | Multi Line  |                                                  |
| `City`          | Single Line |                                                  |
| `Loyalty_Tier`  | Dropdown    | `New, Bronze, Silver, Gold, Platinum`            |
| `Notes`         | Multi Line  |                                                  |

## How the integration works

When a user submits a new order in the Order Desk:

1. **Customer upsert** — the backend searches `Customer_Master` by
   `Phone`. If no match, a new customer record is created.
2. **Stock movement** — if `Product_SKU` is set, the backend looks up the
   matching `Inventory_Stock` row by SKU and applies:
   - **Buy / Rent** → `Available_Stock -= 1`, `Reserved_Stock += 1`,
     `Last_Outward_Date = today`
   - **Repair** → `Repair_Stock += 1`
   - other service types are no-op for stock
3. **Order create** — the order is written to `Order_Master` with
   `Stock_Adjusted = Yes/No` so you can audit which orders touched
   inventory.

If the inventory row is missing or out of stock the order is still
recorded — the UI surfaces the warning as a toast.

## Run locally

```bash
npm install
cp .env.example .env   # (if you have one) — fill in ZOHO_* secrets
npm run dev:all        # vite + express
```

The frontend proxies `/api/*` → `localhost:3001`, so calls to
`/api/oms/*` and `/api/zoho/*` both hit the Express server.