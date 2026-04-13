# Kirana Store CRM (Owner-Only)

Kirana Store CRM is a billing and operations web app for a **single kirana store owner**.  
It is **not** an e-commerce site and has **no customer roles**.

## Features

- Product management with:
  - Product name and category
  - Purchase price and selling price
  - Stock quantity and product photo upload
  - Image preview before upload
- Smart low-stock warning on dashboard (stock `< 10`)
- Fast search/filter:
  - Product by name
  - Billing history by date range
  - Reports by date range
- Billing system with:
  - Buyer name and phone
  - Payment mode (`UPI`, `CARD`, `CASH`, `CREDIT`)
  - GST percentage and discount amount
  - Auto stock reduction
  - Invoice history with PDF download
- Receipt system with:
  - Auto receipt creation after billing
  - Editable receipt fields (name, phone, payment mode, GST, discount, notes)
  - Receipt PDF download
  - WhatsApp share link
- Reports:
  - Daily, monthly, yearly sales
  - Net profit
  - Top-selling products
  - Date-wise selection (`from` / `to`)
- Security and backend standards:
  - Helmet
  - CORS
  - MVC architecture (models/controllers/routes)

## Tech Stack

- Frontend: React (JSX), Bootstrap 5, Axios, React Router
- Backend: Node.js, Express.js
- Database: MongoDB (Mongoose)
- Utilities: Multer (image upload), PDFKit (invoice/receipt PDFs)

## Project Structure

```text
kirana-crm/
  frontend/
    src/
      components/
      pages/
      css/
      services/
  backend/
    config/
    controllers/
    models/
    routes/
    middleware/
    utils/
```

## Installation

### 1) Backend

```bash
cd backend
npm install
```

Run backend:

```bash
npm start
```

### 2) Frontend

```bash
cd frontend
npm install
npm start
```

## Scripts

- Backend: `npm start`, `npm run dev`
- Frontend: `npm start`, `npm run build`

## Screenshots

Add screenshots in `docs/screenshots/` and reference:

- `dashboard.png`
- `products.png`
- `billing.png`
- `receipts.png`
- `reports.png`
