# Smart Expense Tracker

A responsive expense tracker for university students in Japan. The interface is in Japanese and uses Japanese yen.

## Run locally

```powershell
npm install
npm run dev
```

Open the local address printed by Vite. The app works on a phone-sized viewport and a desktop browser.

For the production-style class presentation, build and run the local server:

```powershell
npm run build
npm start
```

Then open `http://localhost:4173`. Exchange rates are fetched by the local server, so the App ID stays out of the browser bundle.

## Current scope

- Add, edit, delete, search, and filter expenses.
- See today's and this month's spending.
- Set a separate monthly budget and view the remaining daily target.
- See a breakdown of this month's spending by category.
- Keep records in the current browser's local storage; there is no account or cloud sync.

The Japanese PRD is in `docs/reference/`. Product decisions and implementation notes are in `docs/superpowers/`.
# Exchange rates (optional for the JPY-only offline mode)

Create a local `.env.local` file and add your Open Exchange Rates App ID:

```env
OPEN_EXCHANGE_RATES_APP_ID=your_app_id_here
```

Restart the server after changing the file. The App ID is read only by the local server and is never included in the browser JavaScript. The free plan updates hourly and uses USD as its base. The presentation server binds to all local network interfaces; keep the App ID private and do not expose this demo server to the public internet.
