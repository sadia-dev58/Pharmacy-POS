# Apothecary POS — Pharmacy Point of Sale

A complete pharmacy POS system on top of your existing `pos` MySQL database:
PHP REST API backend + React frontend (no Node/build step). Includes
laptop-camera barcode scanning, printable/PDF receipts, sales charts, and
every module of a professional POS: Login, Dashboard, Inventory, Medicines,
Categories, Customers, Suppliers, Purchases, Sales (POS), Payments, Reports,
Users, Settings.

## 1. Install into XAMPP

1. Copy the whole `pos` folder into your XAMPP `htdocs` directory, e.g.:
   ```
   C:\xampp\htdocs\pos                (Windows)
   /Applications/XAMPP/htdocs/pos     (Mac)
   /opt/lampp/htdocs/pos              (Linux)
   ```
2. Start **Apache** and **MySQL** from the XAMPP control panel.
3. Open **phpMyAdmin** (`http://localhost/phpmyadmin`) and confirm your `pos`
   database has all its tables (import `pos.sql` at the project root if you
   need a fresh copy — but if you already have live data in `pos`, skip this
   and just point the app at your existing database, see step 4).
4. Check `backend/config/db.php` — defaults are `host=127.0.0.1`, `db=pos`,
   `user=root`, empty password (a stock XAMPP install). **Update these to
   match your real MySQL credentials/port if they differ** — this is the
   #1 reason an app shows "wrong" data: it's silently pointed at an empty or
   different database than the one you're looking at in phpMyAdmin.

## 2. Open the app — and why it will now read YOUR real data

Visit:
```
http://localhost/pos/frontend/index.html
```

**What changed from the previous version:** the frontend used to guess its
backend URL from the folder name in the browser address bar, so if the
folder wasn't named exactly the same way, every API call silently went to
the wrong URL and the app looked like it was showing "made up" data (really
it just couldn't reach your backend/database at all, or old cached fallback
paths were used). It's now computed **relative to wherever `index.html`
actually loads from** (`js/api.js` → `new URL('../backend/api/', ...)`), so
it always finds `backend/api` correctly no matter what you name the project
folder. If you still see unexpected data after this fix, it means your
`pos` database itself has that data — check phpMyAdmin directly to confirm,
and double-check `backend/config/db.php` points at the same host/database
your phpMyAdmin is showing you.

Log in with the seeded user:
- **Username:** `admin`
- **Password:** `admin123`

## 3. Barcode scanning — laptop camera

The POS screen's **"📷 Scan barcode with camera"** button is the way to add
items to a sale:
1. Click it — allow the camera permission prompt the first time.
2. Point a medicine's barcode at the webcam — it's added to the cart
   automatically with a "✓ Last scanned" confirmation.
3. The camera stays open for scanning several items in a row — click
   **Done scanning** when finished.

Camera access needs HTTPS if you ever deploy outside `localhost` — that's a
browser restriction, not something in this app.

## 4. Dashboard & Reports — sales charts

- **Dashboard** now shows a 30-day sales trend line chart and a top-selling
  medicines bar chart right alongside the existing stats and alerts.
- **Reports** (new page) gives you a full breakdown for any date range you
  pick: revenue trend, revenue by category, top medicines by units sold AND
  by revenue, and a payment-method breakdown — all backed by
  `backend/api/reports.php`, which aggregates directly from your
  `sales` / `sale_items` / `payments` tables.

## 5. All modules

| Module | Page | Backend |
|---|---|---|
| Login | `Login` | `auth.php` |
| Dashboard | `Dashboard` (with charts) | `dashboard.php`, `reports.php` |
| Inventory | `Inventory` — batch-level stock, low-stock & expiry filters | `stock.php?all=1` |
| Medicines | `Medicines` — catalog CRUD, barcode field | `medicines.php` |
| Categories | `Categories` | `categories.php` |
| Customers | `Customers` | `customers.php` |
| Suppliers | `Suppliers` | `suppliers.php` |
| Purchases | `Purchases` — record stock received from a supplier (creates new batches) | `purchases.php` |
| Sales (POS) | `POS` — checkout, camera scanning, receipts | `sales.php` |
| Payments | `Payments` — filterable payment log | `payments.php` |
| Sales History | `Sales` — reopen/reprint any past receipt | `sales.php` |
| Reports | `Reports` — charts by date range | `reports.php` |
| Users | `Users` — staff accounts | `users.php` |
| Settings | `Settings` — pharmacy name/address/phone, default tax, receipt footer | `settings.php` |

`settings.php` auto-creates a small `app_settings` key-value table the first
time it runs — no manual migration needed, and it won't touch any of your
existing tables.

## 6. Notes

- All prices/totals are recalculated server-side at checkout and at purchase
  time from the current `medicine_stock` row — the cart/forms are just UI,
  so nothing can be tampered with client-side.
- User passwords: the seeded `admin` account has a plain-text password in
  your original dump; new users created from the **Users** page are hashed
  with `password_hash()` automatically, and login accepts both.
- For production use: add a proper session/auth token instead of the
  current lightweight `sessionStorage` login, restrict
  `Access-Control-Allow-Origin` to your real domain, and serve over HTTPS.
