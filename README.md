# 🔁 ReLoop

**ReLoop** is a full-stack AI-powered retail assistant that helps businesses optimize inventory operations and streamline returns management. It currently ships with two powerful modules:

- 🧠 **Smart Buyer & Supplier Intelligence**  
- 🔄 **Returns & Resale Manager**

Built for modern retail teams looking to reduce manual work, improve restock decisions, and recover revenue from returned or excess inventory.

---

## 🚀 Features

### 1. Smart Buyer & Supplier Intelligence

Predicts restock needs, benchmarks suppliers, and generates purchase orders.

- 🔮 **Restock Forecasting**  
  Uses sales data, trends, and seasonality to predict SKU-level restocking needs with Gemini 2.0 reasoning.

- 🏷 **Supplier Benchmarking**  
  Compares vendors based on price, delivery speed, MOQ, and reliability (mock API or real integrations).

- 🤝 **Auto Purchase Order Suggestions**  
  Suggests optimal POs and negotiation terms (e.g., bulk discounts). Email POs via Resend.

- 📊 **Buyer Dashboard**  
  View restock recommendations, supplier rankings, and PO statuses.

---

### 2. Returns & Resale Manager

Classifies returns, determines resale paths, and assists refund decisions.

- 🧠 **Return Classification Assistant**  
  Gemini suggests what to do with returned items based on product info, condition, and seasonality.  
  Possible actions:
  - Relist in main storefront
  - Send to outlet
  - Recommend resale on platforms like eBay, TheRealReal, ThredUp
  - Discard/donate/manual review

- ✅ **Returns Eligibility Engine**  
  Automatically checks item return eligibility based on:
  - Store policy
  - Purchase date
  - Product type
  - Return reason and condition

- 💸 **Refund Processing Logic**  
  - Auto-approves refunds (Stripe/PayPal)
  - Flags ambiguous or partial cases for review
  - Sends status updates via Resend

- 🛍️ **Resale Suggestions (Manual for Now)**  
  - Gemini recommends the best resale channel
  - In future versions, resale listing will be automated via eBay, ThredUp, and TheRealReal APIs

- 📈 **Returns Dashboard**  
  Track return status, refund flow, and resale suggestions.

---

## 🛠️ Tech Stack

| Layer         | Technology                            |
|---------------|----------------------------------------|
| Frontend      | React (Next.js), TailwindCSS           |
| Backend       | FastAPI (Python)                       |
| AI            | Gemini 2.0 API (Chat + Vision)         |
| Database      | PostgreSQL (via Supabase)              |
| Auth          | Supabase Auth                          |
| Storage       | Supabase Storage                       |
| Email         | Resend                                 |
| Resale APIs   | eBay, TheRealReal, ThredUp, etc        |
| Payment       | Stripe, PayPal                         |
| POS Sync      | Shopify, Square, WooCommerce           |
| Deployment    | Vercel (frontend), Render (backend)    |

---

## ⚙️ Local Setup

### 1. Clone the Repo

```bash
git clone https://github.com/vidhip222/reloop.git
cd reloop
