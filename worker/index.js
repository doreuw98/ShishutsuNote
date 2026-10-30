const RATE_URL = "https://openexchangerates.org/api/latest.json";
const RATE_MAX_AGE_MS = 60 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const VALID_LANGUAGES = new Set(["ja", "en", "id"]);
const VALID_CURRENCIES = new Set(["JPY", "USD", "IDR"]);
const VALID_CATEGORIES = new Set([
  "food", "transport", "housing", "study", "communications",
  "entertainment", "daily-goods", "other",
]);
const DEFAULT_STATE = {
  expenses: [],
  settings: {
    monthlyBudgets: {},
    budgetWarningShownMonths: [],
    language: "ja",
    currency: "JPY",
    amountsMigratedToJpy: true,
  },
};

function headersFor(request, env, additional = {}) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...additional,
  });
  const origin = request.headers.get("Origin");
  const allowed = (env.ALLOWED_ORIGINS || "")
    .split(",").map((value) => value.trim()).filter(Boolean);
  if (origin && allowed.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
    headers.set("Access-Control-Max-Age", "600");
    headers.set("Vary", "Origin");
  }
  return headers;
}

function json(request, env, body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: headersFor(request, env, extraHeaders),
  });
}

function monthKey(value) {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00.000Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateState(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const settings = value.settings;
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return false;
  if (!Array.isArray(value.expenses) || value.expenses.length > 900) return false;
  if (!settings.monthlyBudgets || typeof settings.monthlyBudgets !== "object"
      || Array.isArray(settings.monthlyBudgets)) return false;
  if (!Array.isArray(settings.budgetWarningShownMonths)) return false;
  if (!VALID_LANGUAGES.has(settings.language) || !VALID_CURRENCIES.has(settings.currency)) return false;
  if (settings.amountsMigratedToJpy !== true) return false;
  if (settings.legacyAmountsAssumedJpy !== undefined
      && typeof settings.legacyAmountsAssumedJpy !== "boolean") return false;

  for (const expense of value.expenses) {
    if (!expense || typeof expense !== "object"
        || typeof expense.id !== "string" || expense.id.length < 1 || expense.id.length > 80
        || !Number.isSafeInteger(expense.amount) || expense.amount <= 0
        || !VALID_CATEGORIES.has(expense.categoryId)
        || !validDate(expense.date)
        || typeof expense.note !== "string" || expense.note.length > 500
        || typeof expense.createdAt !== "string"
        || !Number.isFinite(Date.parse(expense.createdAt))) return false;
  }
  for (const [key, amount] of Object.entries(settings.monthlyBudgets)) {
    if (!monthKey(key) || !Number.isSafeInteger(amount) || amount < 0) return false;
  }
  return settings.budgetWarningShownMonths.every(monthKey);
}

async function digestHex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function equalSecret(left, right) {
  const [a, b] = await Promise.all([digestHex(left), digestHex(right)]);
  let difference = 0;
  for (let i = 0; i < a.length; i += 1) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function rateLimitLogin(request, env, now) {
  const ip = request.headers.get("CF-Connecting-IP") || "local";
  const row = await env.DB.prepare(
    "SELECT attempts, window_started_at, blocked_until FROM login_attempts WHERE ip_address = ?",
  ).bind(ip).first();
  if (row && row.blocked_until && row.blocked_until > now) return { blocked: true };
  const inWindow = row && now - row.window_started_at < LOGIN_WINDOW_MS;
  return {
    blocked: false,
    ip,
    attempts: inWindow ? row.attempts : 0,
    windowStartedAt: inWindow ? row.window_started_at : now,
  };
}

async function recordFailedLogin(env, limit, now) {
  const attempts = limit.attempts + 1;
  const blockedUntil = attempts >= LOGIN_MAX_ATTEMPTS ? now + LOGIN_WINDOW_MS : 0;
  const sql = "INSERT INTO login_attempts (ip_address, attempts, window_started_at, blocked_until) " +
    "VALUES (?, ?, ?, ?) ON CONFLICT(ip_address) DO UPDATE SET attempts = excluded.attempts, " +
    "window_started_at = excluded.window_started_at, blocked_until = excluded.blocked_until";
  await env.DB.prepare(sql).bind(limit.ip, attempts, limit.windowStartedAt, blockedUntil).run();
  return blockedUntil > now;
}

async function login(request, env) {
  if (!env.APP_PASSWORD || env.APP_PASSWORD.length < 12) {
    return json(request, env, { error: "auth_not_configured" }, 503);
  }
  const now = Date.now();
  const limit = await rateLimitLogin(request, env, now);
  if (limit.blocked) return json(request, env, { error: "login_temporarily_locked" }, 429);

  let body;
  try { body = await request.json(); } catch { return json(request, env, { error: "invalid_json" }, 400); }
  if (!body || typeof body.password !== "string" || body.password.length > 256) {
    return json(request, env, { error: "invalid_credentials" }, 401);
  }
  if (!await equalSecret(body.password, env.APP_PASSWORD)) {
    const locked = await recordFailedLogin(env, limit, now);
    return json(request, env, { error: locked ? "login_temporarily_locked" : "invalid_credentials" }, locked ? 429 : 401);
  }

  await env.DB.prepare("DELETE FROM login_attempts WHERE ip_address = ?").bind(limit.ip).run();
  await env.DB.prepare("DELETE FROM sessions WHERE expires_at <= ?").bind(now).run();
  const token = randomToken();
  const expiresAt = now + SESSION_TTL_MS;
  await env.DB.prepare("INSERT INTO sessions (token_hash, expires_at) VALUES (?, ?)")
    .bind(await digestHex(token), expiresAt).run();
  return json(request, env, { token, expiresAt });
}

async function authorize(request, env) {
  const match = /^Bearer ([a-f0-9]{64})$/i.exec(request.headers.get("Authorization") || "");
  if (!match) return false;
  const tokenHash = await digestHex(match[1]);
  const session = await env.DB.prepare(
    "SELECT token_hash FROM sessions WHERE token_hash = ? AND expires_at > ?",
  ).bind(tokenHash, Date.now()).first();
  return Boolean(session);
}

async function getState(env) {
  const [settings, expenseRows, budgetRows, warningRows] = await Promise.all([
    env.DB.prepare("SELECT language, currency, amounts_migrated_to_jpy, legacy_amounts_assumed_jpy FROM app_settings WHERE id = 1").first(),
    env.DB.prepare("SELECT id, amount_jpy, category_id, expense_date, note, created_at FROM expenses ORDER BY expense_date DESC, created_at DESC").all(),
    env.DB.prepare("SELECT month_key, amount_jpy FROM monthly_budgets ORDER BY month_key").all(),
    env.DB.prepare("SELECT month_key FROM budget_warnings ORDER BY month_key").all(),
  ]);
  return {
    initialized: Boolean(settings),
    state: {
      expenses: (expenseRows.results || []).map((row) => ({
        id: row.id,
        amount: row.amount_jpy,
        categoryId: row.category_id,
        date: row.expense_date,
        note: row.note,
        createdAt: row.created_at,
      })),
      settings: {
        monthlyBudgets: Object.fromEntries((budgetRows.results || []).map((row) => [row.month_key, row.amount_jpy])),
        budgetWarningShownMonths: (warningRows.results || []).map((row) => row.month_key),
        language: settings?.language || DEFAULT_STATE.settings.language,
        currency: settings?.currency || DEFAULT_STATE.settings.currency,
        amountsMigratedToJpy: settings ? Boolean(settings.amounts_migrated_to_jpy) : true,
        ...(settings?.legacy_amounts_assumed_jpy ? { legacyAmountsAssumedJpy: true } : {}),
      },
    },
  };
}

async function replaceState(env, state) {
  const appSettingsSql = "INSERT INTO app_settings " +
    "(id, language, currency, amounts_migrated_to_jpy, legacy_amounts_assumed_jpy) " +
    "VALUES (1, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET language = excluded.language, " +
    "currency = excluded.currency, amounts_migrated_to_jpy = excluded.amounts_migrated_to_jpy, " +
    "legacy_amounts_assumed_jpy = excluded.legacy_amounts_assumed_jpy";
  const expenseSql = "INSERT INTO expenses (id, amount_jpy, category_id, expense_date, note, created_at) VALUES (?, ?, ?, ?, ?, ?)";
  const statements = [
    env.DB.prepare("DELETE FROM expenses"),
    env.DB.prepare("DELETE FROM monthly_budgets"),
    env.DB.prepare("DELETE FROM budget_warnings"),
    env.DB.prepare(appSettingsSql).bind(
      state.settings.language,
      state.settings.currency,
      1,
      state.settings.legacyAmountsAssumedJpy ? 1 : 0,
    ),
    ...state.expenses.map((expense) => env.DB.prepare(expenseSql).bind(
      expense.id, expense.amount, expense.categoryId, expense.date, expense.note, expense.createdAt,
    )),
    ...Object.entries(state.settings.monthlyBudgets).map(([month, amount]) => env.DB.prepare(
      "INSERT INTO monthly_budgets (month_key, amount_jpy) VALUES (?, ?)",
    ).bind(month, amount)),
    ...state.settings.budgetWarningShownMonths.map((month) => env.DB.prepare(
      "INSERT INTO budget_warnings (month_key) VALUES (?)",
    ).bind(month)),
  ];
  await env.DB.batch(statements);
}

function storedRates(row, stale = false) {
  return {
    base: "USD",
    timestamp: row.source_timestamp,
    fetchedAt: row.fetched_at,
    rates: { JPY: row.jpy, IDR: row.idr },
    ...(stale ? { stale: true } : {}),
  };
}

async function exchangeRates(request, env) {
  const now = Date.now();
  const cached = await env.DB.prepare(
    "SELECT base, source_timestamp, fetched_at, jpy, idr FROM exchange_rates_cache WHERE id = 1",
  ).first();
  if (cached && now - cached.fetched_at < RATE_MAX_AGE_MS && now >= cached.fetched_at) {
    return json(request, env, storedRates(cached), 200, { "Cache-Control": "private, max-age=3600" });
  }
  if (!env.OPEN_EXCHANGE_RATES_APP_ID) {
    if (cached) return json(request, env, storedRates(cached, true), 200);
    return json(request, env, { error: "rates_not_configured" }, 503);
  }

  try {
    const upstreamUrl = new URL(RATE_URL);
    upstreamUrl.searchParams.set("app_id", env.OPEN_EXCHANGE_RATES_APP_ID);
    upstreamUrl.searchParams.set("symbols", "JPY,IDR");
    const upstream = await fetch(upstreamUrl, { signal: AbortSignal.timeout(10_000) });
    if (!upstream.ok) throw new Error("rates_upstream_unavailable");
    const payload = await upstream.json();
    const jpy = payload?.rates?.JPY;
    const idr = payload?.rates?.IDR;
    if (payload?.base !== "USD" || !Number.isFinite(payload?.timestamp)
        || !Number.isFinite(jpy) || jpy <= 0 || !Number.isFinite(idr) || idr <= 0) {
      throw new Error("rates_invalid_response");
    }
    const row = {
      base: "USD", source_timestamp: payload.timestamp, fetched_at: now, jpy, idr,
    };
    const sql = "INSERT INTO exchange_rates_cache (id, base, source_timestamp, fetched_at, jpy, idr) " +
      "VALUES (1, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET base = excluded.base, " +
      "source_timestamp = excluded.source_timestamp, fetched_at = excluded.fetched_at, " +
      "jpy = excluded.jpy, idr = excluded.idr";
    await env.DB.prepare(sql).bind(row.base, row.source_timestamp, row.fetched_at, row.jpy, row.idr).run();
    return json(request, env, storedRates(row), 200, { "Cache-Control": "private, max-age=3600" });
  } catch {
    if (cached) return json(request, env, storedRates(cached, true), 200);
    return json(request, env, { error: "rates_upstream_unavailable" }, 502);
  }
}

async function handle(request, env) {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin");
  const allowedOrigins = (env.ALLOWED_ORIGINS || "")
    .split(",").map((value) => value.trim()).filter(Boolean);
  if (origin && !allowedOrigins.includes(origin)) return new Response(null, { status: 403 });
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: headersFor(request, env) });
  }
  if (url.pathname === "/api/health" && request.method === "GET") {
    await env.DB.prepare("SELECT 1 AS ok").first();
    return json(request, env, { ok: true });
  }
  if (url.pathname === "/api/login" && request.method === "POST") return login(request, env);

  if (!url.pathname.startsWith("/api/")) return json(request, env, { error: "not_found" }, 404);
  if (!await authorize(request, env)) return json(request, env, { error: "unauthorized" }, 401);

  if (url.pathname === "/api/logout" && request.method === "POST") {
    const token = /^Bearer ([a-f0-9]{64})$/i.exec(request.headers.get("Authorization") || "")?.[1];
    if (token) await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await digestHex(token)).run();
    return json(request, env, { ok: true });
  }
  if (url.pathname === "/api/state" && request.method === "GET") {
    return json(request, env, await getState(env));
  }
  if (url.pathname === "/api/state" && request.method === "PUT") {
    const contentLength = Number(request.headers.get("Content-Length") || 0);
    if (contentLength > 1_000_000) return json(request, env, { error: "payload_too_large" }, 413);
    let body;
    try { body = await request.json(); } catch { return json(request, env, { error: "invalid_json" }, 400); }
    if (!validateState(body)) return json(request, env, { error: "invalid_state" }, 400);
    await replaceState(env, body);
    return json(request, env, { ok: true });
  }
  if (url.pathname === "/api/rates" && request.method === "GET") return exchangeRates(request, env);
  return json(request, env, { error: "not_found" }, 404);
}

export default {
  async fetch(request, env) {
    try {
      return await handle(request, env);
    } catch {
      return json(request, env, { error: "internal_error" }, 500);
    }
  },
};

