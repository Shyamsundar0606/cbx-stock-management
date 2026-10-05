# Stock Management App

This is my solution to the mobile stock management exercise. The goal was to build a small app with the required screens and a working backend. I kept the layout basic and used React state hooks instead of adding a state management library.

## Setup

You need Node.js 24 LTS, npm, and Expo Go compatible with SDK 57.

```bash
git clone https://github.com/Shyamsundar0606/cbx-stock-management.git
cd cbx-stock-management
npm ci
npx expo start
```

The backend starts automatically on port 3000. SQLite creates its database and adds six example products the first time you run it. No `.env` file is needed.

Press `w` to open the browser preview. For a phone, scan the QR code with Expo Go and keep the phone and computer on the same Wi-Fi. The app uses the Expo server address to find the API. Allow local access to ports 3000 and 8081 if your firewall blocks them.

Press `a` for an Android emulator, or `i` for an iOS simulator on macOS. You can also use `npm run web` for the browser.

Stop any running Expo or API process with Ctrl+C before reinstalling dependencies. On Windows, a running backend can lock `esbuild.exe` and make `npm ci` fail.

## Features

- Product list with search and category filters.
- Normal, low-stock and out-of-stock labels.
- Product details and stock entry/exit forms.
- Add and edit products with input validation.
- Stock movement history.
- A basic dashboard with totals and a category bar chart.

Low stock means `0 < quantity <= threshold`. Out of stock means `quantity = 0`. A stock exit cannot make the quantity negative. References must be unique, and quantities must be whole numbers.

## Technical choices

I used **Expo with React Native and TypeScript** to keep the setup simple. **React Navigation** provides the product/detail/form stack and the two bottom tabs. The app uses `useState` and reloads data when a screen gets focus.

The backend uses **Express and SQLite**. SQLite is a separate server-side database, not local storage in the app. Node 24 includes SQLite support, so no separate database server is needed. A transaction keeps each stock update and its history entry together.

Versions: Expo 57.0.26, React Native 0.86.3, React 19.2.3, TypeScript 6.0.3, React Navigation 7 and Express 5.2.1.

## Project structure

```text
src/
  App.tsx          Navigation
  api.ts           Requests to the backend
  types.ts         Shared app types
  components/      Buttons, fields and product cards
  screens/         Products, details, form and dashboard
backend/
  src/database/    SQLite setup and example data
  src/controllers/ Input validation
  src/routes/      API endpoints
  tests/           Integration tests
scripts/           Starts the API with Expo
```

## API endpoints

Base URL: `http://localhost:3000/api`.

| Method | Path                      | Description                                            |
| ------ | ------------------------- | ------------------------------------------------------ |
| GET    | `/products`               | List products; optional search and category parameters |
| GET    | `/products/:id`           | Product details                                        |
| POST   | `/products`               | Create a product                                       |
| PUT    | `/products/:id`           | Update a product                                       |
| POST   | `/products/:id/movements` | Add or remove stock                                    |
| GET    | `/products/:id/movements` | Recent stock movements                                 |
| GET    | `/dashboard`              | Stock totals and category counts                       |
| GET    | `/health`                 | Server health check                                    |

A movement body is `{ "direction": "in", "quantity": 5 }`, or use `"out"` for a stock exit. Validation errors return a message with status 400; duplicate references or insufficient stock return 409.

## Screenshots

The screenshots below show the earlier layout at phone width. The current version uses simpler blue buttons and smaller, plain panels; the features are the same. The extra product was added during testing.

<img src="docs/inventory.jpg" width="250" alt="Product list"> <img src="docs/product-details.jpg" width="250" alt="Product details">

<img src="docs/product-form.jpg" width="250" alt="Product form"> <img src="docs/dashboard.jpg" width="250" alt="Dashboard">

## Checks

```bash
npm run lint
npm run check
npx expo export --platform all
```

The tests cover product validation, duplicate references, stock movements, concurrent exits and SQLite persistence. GitHub Actions runs the checks too. Browser flows have been checked; Android and iOS bundles have been exported, but I have not tested on a physical device or native simulator in this environment.

## Notes

The database is saved in `backend/data/stock.sqlite` and excluded from Git. Data stays after a restart. Editing a quantity in the product form is an inventory correction; use the stock buttons to record a movement.

Optional settings: `EXPO_PUBLIC_API_URL` for another API address (including `/api`), `DATABASE_PATH` for another database file, `PORT` for a separately started API, and `STOCK_SKIP_API=1` to skip automatic API startup. Run `npm run api` to start the API separately. Expo tunnel mode does not tunnel the backend.

The dashboard bonus is included. Local notifications, authentication and offline mode are not implemented. For production I would add authentication, HTTPS and pagination. Expo tooling has some transitive dependency advisories; the backend audit was clean when checked.
