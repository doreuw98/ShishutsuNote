import { apiUrl } from './api';
import type { CurrencyCode, ExchangeRates } from '../domain/types';

const CACHE_KEY = 'shishutsu-note.exchange-rates.v1';
export const RATE_MAX_AGE_MS = 60 * 60 * 1000;

export type RateResult = { rates: ExchangeRates | null; state: 'ready' | 'missing-key' | 'error' };
let requestInFlight: Promise<RateResult> | null = null;
let lastNetworkAttemptAt = 0;

function isExchangeRates(value: unknown): value is ExchangeRates {
  if (!value || typeof value !== 'object') return false;
  const rates = value as Partial<ExchangeRates>;
  return rates.base === 'USD'
    && typeof rates.timestamp === 'number' && Number.isFinite(rates.timestamp)
    && typeof rates.fetchedAt === 'number' && Number.isFinite(rates.fetchedAt)
    && Boolean(rates.rates)
    && typeof rates.rates?.JPY === 'number' && Number.isFinite(rates.rates.JPY) && rates.rates.JPY > 0
    && typeof rates.rates?.IDR === 'number' && Number.isFinite(rates.rates.IDR) && rates.rates.IDR > 0;
}

export function loadCachedExchangeRates(): ExchangeRates | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isExchangeRates(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function saveCachedExchangeRates(rates: ExchangeRates): void {
  try { window.localStorage.setItem(CACHE_KEY, JSON.stringify(rates)); } catch { /* Cache is optional. */ }
}

export function isRateFresh(rates: ExchangeRates, now = Date.now()): boolean {
  return now - rates.fetchedAt < RATE_MAX_AGE_MS && now >= rates.fetchedAt;
}

export async function getLatestExchangeRates(accessToken: string): Promise<RateResult> {
  const cached = loadCachedExchangeRates();
  if (cached && isRateFresh(cached)) return { rates: cached, state: 'ready' };

  if (requestInFlight) return requestInFlight;
  if (Date.now() - lastNetworkAttemptAt < 60_000) return { rates: cached, state: 'error' };
  lastNetworkAttemptAt = Date.now();

  requestInFlight = (async (): Promise<RateResult> => { try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10_000);
    let response: Response;
    try { response = await fetch(apiUrl('/api/rates'), { signal: controller.signal, headers: { Authorization: 'Bearer ' + accessToken } }); }
    finally { window.clearTimeout(timeout); }
    if (response.status === 503) {
      const errorBody: unknown = await response.json().catch(() => null);
      if (errorBody && typeof errorBody === 'object' && (errorBody as { error?: unknown }).error === 'rates_not_configured') {
        return { rates: cached, state: 'missing-key' };
      }
    }
    if (!response.ok) return { rates: cached, state: 'error' };
    const body: unknown = await response.json();
    if (!body || typeof body !== 'object') return { rates: cached, state: 'error' };
    const payload = body as { timestamp?: unknown; fetchedAt?: unknown; stale?: unknown; base?: unknown; rates?: { JPY?: unknown; IDR?: unknown } };
    if (payload.base !== 'USD' || typeof payload.timestamp !== 'number'
      || typeof payload.rates?.JPY !== 'number' || typeof payload.rates?.IDR !== 'number'
      || !Number.isFinite(payload.timestamp) || !Number.isFinite(payload.rates.JPY) || !Number.isFinite(payload.rates.IDR)
      || payload.rates.JPY <= 0 || payload.rates.IDR <= 0) return { rates: cached, state: 'error' };

    const rates: ExchangeRates = {
      base: 'USD', timestamp: payload.timestamp, fetchedAt: typeof payload.fetchedAt === 'number' && Number.isFinite(payload.fetchedAt) ? payload.fetchedAt : Date.now(),
      rates: { JPY: payload.rates.JPY, IDR: payload.rates.IDR },
    };
    saveCachedExchangeRates(rates);
    return { rates, state: payload.stale === true ? 'error' : 'ready' };
  } catch { return { rates: cached, state: 'error' }; } })();
  try { return await requestInFlight; } finally { requestInFlight = null; }
}

export function convertFromJpy(amount: number, currency: CurrencyCode, rates: ExchangeRates | null): number | null {
  if (currency === 'JPY') return amount;
  if (!rates) return null;
  const targetPerUsd = currency === 'USD' ? 1 : rates.rates.IDR;
  return (amount / rates.rates.JPY) * targetPerUsd;
}

export function convertToJpy(amount: number, currency: CurrencyCode, rates: ExchangeRates | null): number | null {
  if (!Number.isFinite(amount) || amount < 0) return null;
  if (currency === 'JPY') return Number.isSafeInteger(Math.round(amount)) ? Math.round(amount) : null;
  if (!rates) return null;
  const targetPerUsd = currency === 'USD' ? 1 : rates.rates.IDR;
  const converted = Math.round((amount / targetPerUsd) * rates.rates.JPY);
  return Number.isSafeInteger(converted) ? converted : null;
}

export function hasValidCurrencyPrecision(amount: number, currency: CurrencyCode): boolean {
  const factor = currency === 'USD' ? 100 : 1;
  return Math.abs(amount * factor - Math.round(amount * factor)) < 1e-7;
}

export function formatRateTimestamp(rates: ExchangeRates, language: 'ja' | 'en' | 'id'): string {
  return new Intl.DateTimeFormat(language === 'ja' ? 'ja-JP' : language === 'id' ? 'id-ID' : 'en-US', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tokyo',
  }).format(new Date(rates.timestamp * 1000));
}
