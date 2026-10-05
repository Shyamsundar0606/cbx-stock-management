# CBX Stock

A small warehouse inventory app built with React Native and TypeScript. You can look up products, record stock coming in or going out, and see which items need restocking.

## Run it

You need Node.js 24 LTS, npm, and Expo Go compatible with SDK 57.

```bash
git clone https://github.com/Shyamsundar0606/cbx-stock-management.git
cd cbx-stock-management
npm ci
npx expo start
```

The install command also installs the backend. Starting Expo starts the API on port 3000 and creates the SQLite database with six sample products. There are no API keys or environment files to set up.

Scan the QR code with Expo Go. Keep your phone and computer on the same local network. The app gets the API address from the Expo server, so you do not need to put your IP address in the code. Your firewall needs to allow local access to ports 3000 and 8081.

Press `a` in the Expo terminal for an Android emulator, `i` for the iOS simulator on macOS, or `w` for the browser. You can also run the browser preview directly:

```bash
npm run web
```

If the app cannot reach the API, check that the terminal shows `Stock API: http://localhost:3000` and that both devices are on the same network. Expo's tunnel mode only tunnels the Expo server, not this API.

## What is included

- Product list with search, category filtering, and an alerts-only filter.
- Product details, descriptions, stock quantities, thresholds, and last-updated dates.
- Add and edit forms with required fields, unique references, and whole-number validation.
- Stock entries and exits with a history of the last 50 movements.
- Dashboard with product totals, stock alerts, and a category chart.
- Loading and empty states, retry buttons, pull-to-refresh, and accessible labels.

A product has normal stock when its quantity is above the threshold, low stock when it is at or below the threshold but above zero, and no stock when it reaches zero. The dashboard counts low stock and out-of-stock items separately.

Quantities and thresholds can be whole numbers from 0 to 1,000,000. Stock movements must be positive. Removing more than is available returns an error and leaves both the stock and history unchanged.

Editing a quantity in the product form is an inventory correction. Use the stock buttons when you want to record an entry or exit in the movement history.

## Screenshots

These are actual browser-preview screenshots at a phone-sized viewport. A fresh database starts with six sample products; the extra product shown here was added while checking the forms.

| Inventory                                                                             | Product details                                                                           |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| <img src="docs/inventory.jpg" width="280" alt="Product list with search and filters"> | <img src="docs/product-details.jpg" width="280" alt="Product details with stock actions"> |

| Product form                                                         | Dashboard                                                                     |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| <img src="docs/product-form.jpg" width="280" alt="New product form"> | <img src="docs/dashboard.jpg" width="280" alt="Dashboard and category chart"> |

## Why this stack

Expo keeps the mobile setup simple. React Navigation handles the stack for product pages and forms, with tabs for the inventory and dashboard. React state hooks are enough for this app; each screen fetches current data when it gets focus.

Express exposes the REST API. SQLite lives on the server in `backend/data/stock.sqlite`, so the app uses a real database rather than local storage. Node 24 includes SQLite support, which avoids installing a separate database server or compiling a native package.

Stock movements use a SQLite transaction. The quantity update and history entry either both succeed or both roll back. SQL parameters, foreign keys, quantity constraints, and a case-insensitive unique reference also protect the data.

The versions used are Expo 57.0.26, React Native 0.86.3, React 19.2.3, TypeScript 6.0.3, React Navigation 7, and Express 5.2.1. Development and tests use Node 24.17.0. Exact dependency versions are recorded in the lockfiles.

## Code layout

```text
src/
  App.tsx                 Navigation setup
  api.ts                  HTTP requests and API address
  types.ts                Product types and stock status
  components/             Shared controls and product cards
  screens/                Inventory, details, form, and dashboard
backend/
  src/app.ts              Express setup and error handling
  src/index.ts            Server startup and shutdown
  src/database/           SQLite schema and sample products
  src/controllers/        Input validation
  src/models/             Product input type
  src/routes/             REST endpoints and stock transactions
  tests/                  API and database integration tests
scripts/                  Start the API alongside Expo
docs/                     Screenshots
```

## API

The default base URL is `http://localhost:3000/api`.

| Method | Path                      | Purpose                                                         |
| ------ | ------------------------- | --------------------------------------------------------------- |
| GET    | `/health`                 | Check the server                                                |
| GET    | `/products`               | List products; accepts `search` and `category` query parameters |
| GET    | `/products/:id`           | Get one product                                                 |
| POST   | `/products`               | Create a product                                                |
| PUT    | `/products/:id`           | Update all product fields                                       |
| GET    | `/products/:id/movements` | Get the last 50 movements                                       |
| POST   | `/products/:id/movements` | Record a stock entry or exit                                    |
| GET    | `/dashboard`              | Get totals and category counts                                  |

Example product body:

```json
{
  "name": "Box of screws",
  "reference": "OUT-003",
  "description": "5mm screws",
  "category": "Tools",
  "quantity": 20,
  "threshold": 5
}
```

Example movement body:

```json
{ "direction": "out", "quantity": 3 }
```

Errors return a `message` field. Invalid input returns 400, missing products return 404, and duplicate references or insufficient stock return 409. New products and movements return 201.

## Checks

```bash
npm run lint
npm run check
npx expo install --check
npx expo export --platform all
```

The integration tests cover creation, updates, filters, duplicate references, invalid input, concurrent stock exits, movement history, dashboard counts, and persistence after reopening the database. They use separate test databases. GitHub Actions runs the same checks and exports the Android, iOS, and web bundles.

The browser flows have been checked at a phone-sized viewport. Native bundles have been exported, but the app has not been tested on a physical phone or native simulator in this environment.

## Optional configuration

Defaults work for local development. If you need another setup:

| Variable              | Purpose                            |
| --------------------- | ---------------------------------- |
| `EXPO_PUBLIC_API_URL` | API URL, including `/api`          |
| `DATABASE_PATH`       | SQLite file path                   |
| `PORT`                | Port for an API started separately |
| `STOCK_SKIP_API=1`    | Skip automatic API startup         |

Use `npm run api` to run the backend separately. For a compiled backend, run `npm --prefix backend run build` followed by `npm --prefix backend start`. If you change the API port, set `EXPO_PUBLIC_API_URL` too.

The database is ignored by Git and survives restarts. To start over, stop the server, back up the database, and remove the files in `backend/data/`. The next start recreates the sample data. Existing product text is stored as entered; changing the app language does not automatically translate custom product names.

## Scope

The dashboard bonus is included. Local notifications are not implemented. This exercise uses a local warehouse API without authentication, offline sync, or pagination. A production deployment would need HTTPS, authentication, and restricted CORS.

The backend dependency audit was clean when checked. Expo's development tooling still has transitive advisories after compatible fixes; the forced npm fix proposes an incompatible Expo downgrade, so it was not applied.
