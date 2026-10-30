# ShishutsuNote

Responsive expense tracker for students in Japan. The frontend is a static React/Vite app hosted on GitHub Pages; a Cloudflare Worker API protects personal data and stores it in D1 (SQLite). Amounts are stored in JPY; the selected currency is used for display and input conversion.

## Local development

Use Node.js 22 or newer. In the project folder, create `.dev.vars` from `.dev.vars.example`, then enter your private app password (at least 12 characters) and optional Open Exchange Rates App ID. Never commit `.dev.vars`.

```powershell
npm ci
npm run db:local:migrate
```

Open two PowerShell terminals in the project folder:

```powershell
npm run worker:dev
```

```powershell
npm run dev
```

Open the Vite address (normally `http://localhost:5173`). The Worker runs at `http://127.0.0.1:8787`. Local D1 data is separate from production D1.

## Deployment

Live frontend: https://doreuw98.github.io/ShishutsuNote/

Live API: https://shishutsu-note-api.smart-expense-tracker.workers.dev

The frontend is published from the `gh-pages` branch (root folder). Source code is maintained on `main`. Build with `GITHUB_ACTIONS=true` and `VITE_API_BASE_URL` set to the API URL so Vite uses the `/ShishutsuNote/` base path. Publish the contents of `dist/`, including a `.nojekyll` file, to `gh-pages`.

The production D1 database is bound in `wrangler.jsonc`. For future backend updates, sign in using `npx wrangler login`, then run `npm run db:remote:migrate` and `npm run worker:deploy`. Worker secrets `APP_PASSWORD` and `OPEN_EXCHANGE_RATES_APP_ID` are configured in Cloudflare.

A generated production password is stored only in the ignored local file `.dev.vars.production`. Use its `APP_PASSWORD` value to sign in. To migrate existing records, first sign in at the same local frontend origin where the old records were saved; `.env.development.local` now points that frontend at the production Worker. An empty production database imports those browser records once, then later sign-ins load D1 data. Do this before creating records on GitHub Pages. Browser storage is specific to each origin, so GitHub Pages cannot directly read records from localhost.

Optional GitHub Actions workflow templates are in `docs/deployment/`. To enable them later, copy them into `.github/workflows/`, use a GitHub token with workflow permission, configure the Cloudflare API token, and select GitHub Actions as the Pages deployment source. Repository variables for the API URL and Cloudflare account ID and repository secrets for the app password and exchange-rate App ID are already set; a Cloudflare CI API token must still be supplied for automated Worker deploys.

## SQL practice

The D1 schema is in `worker/migrations/`. Try these reports against local D1 with `npx wrangler d1 execute shishutsu-note-db --local --file docs/sql-practice.sql`. They demonstrate category totals, monthly totals, recent transactions, and budget comparison.

## Features

- Add, edit, delete, search, and filter expense records.
- View daily and monthly totals, budget progress, and category analysis.
- Choose Japanese, English, or Indonesian and choose JPY, USD, or IDR separately.
- Refresh exchange rates hourly from Open Exchange Rates; rate access is proxied through the Worker and cached in D1.
- Sign in to access the single-user dataset stored in D1.
