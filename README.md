# 🔁 ReLoop – AI-Powered Retail Recovery & Resupply

**ReLoop** is a modular AI retail platform that helps modern businesses optimize supplier restocks and recover revenue from returns. Our mission:  
**Rethink how retail handles returns and resupply—cut costs, reduce landfill waste, and make resale intelligent, scalable, and profitable.**

---

## 🧭 Modules

1. 🧠 **Smart Buyer & Supplier Intelligence**  
   Predict restock needs, benchmark suppliers, and negotiate better purchase orders.

2. 🔄 **Returns & Resale Manager**  
   Classify returns, trigger refunds, and auto-route resale to platforms like eBay.

---

### 🧠 Smart Buyer & Supplier Intelligence

#### ✅ Core Features

- 🔮 **Restock Prediction**  
  Predict SKU-level quantities using inventory, sales, trends, and seasonality  
  → Gemini explains “Why this quantity?”

- 📊 **Supplier Benchmarking**  
  Compare vendors by price, SLA, return %, defect rate, and location  
  → Gemini flags poor suppliers

- 📄 **PO Generator**  
  Editable POs with Gemini-suggested MOQ, discounts, and shipping  
  → Auto-send or save as draft

- 📈 **PO Tracker**  
  Status timeline: Created → Confirmed → Shipped → Delayed  
  → Exception alerts for quantity mismatches, delays, or SLA issues

---

### 🔄 Returns & Resale Manager

#### ✅ Core Features

- 🧠 **Return Classification**  
  Gemini evaluates image, metadata, trend score → suggests action  
  → Outputs a 1-word tag (e.g., “Relist”, “Donate”) + expandable reason

- 🔁 **Resale Routing**  
  - eBay API (live)
  - CSV Export (ThredUp, Depop, Poshmark, etc.)
  - Gemini selects resale channel per item type

- 📥 **Bulk Intake & Manual Override**  
  - Upload returns via CSV + image blob  
  - Override AI suggestions, with audit logs

- 💳 **Refund Logic & Fraud Flagging**  
  Auto-refund if eligible, flag edge cases  
  → Triggers Stripe/PayPal actions

- 🔄 **Inventory Sync** (planned)  
  Shopify, Square, WooCommerce support

#### 🖥️ Return UI Components

- **Return Intake Card**  
  Upload image, metadata → view tag → expand reasoning

- **Eligibility Checker**  
  Rules: return window, item condition, receipt  
  → Gemini fallback for ambiguous cases

- **Auto Refund Trigger**  
  Processes or flags refund

- **Resale Sync Panel**  
  Platform routing logic + sync status

---

## 📊 Admin Dashboards

- 🔥 **Product Trend Panel** – Gemini says: Hot / Declining / Niche
- ♻️ **Return Funnel** – Approved / Flagged / Denied
- 🛒 **Resale Tracker** – Live listings, Sold %, Failed %
- 📦 **Inventory Recovery** – % of returns salvaged
- 💰 **ROI Dashboard** – Profit per resale channel vs COGS

---

## 🛠️ Tech Stack

| Layer        | Tech                                         |
|--------------|----------------------------------------------|
| Frontend     | React (Next.js), Tailwind CSS                |
| Backend      | FastAPI (Python)                             |
| Database     | PostgreSQL (Supabase)                        |
| Auth         | Supabase Auth                                |
| AI           | Gemini 2.0 (Chat + Vision)                   |
| Resale Sync  | eBay API (live), CSV export for others       |
| Payments     | Stripe, PayPal                               |
| POS (Planned)| Shopify, Square, WooCommerce                 |
| Storage      | Supabase Storage                             |
| Email        | Resend                                       |
| Hosting      | Vercel (frontend), Render (backend)          |

---

## Local Setup

Frontend:

```bash
pnpm install
pnpm dev
```

Backend (FastAPI):

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Env Vars Checklist

Frontend:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_API_BASE_URL (example: http://localhost:8000)
- GEMINI_API_KEY
- RESEND_API_KEY
- EBAY_CLIENT_ID
- EBAY_CLIENT_SECRET

Backend:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_STORAGE_BUCKET
- GEMINI_API_KEY
- STRIPE_SECRET_KEY
- EBAY_CLIENT_ID
- EBAY_CLIENT_SECRET

## Environment Files

- Frontend: copy `.env.local.example` to `.env.local`
- Backend: copy `backend/.env.example` to `backend/.env`
