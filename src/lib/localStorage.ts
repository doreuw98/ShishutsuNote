import type { AppLanguage, AppState, CurrencyCode, Expense, LoadStatus } from '../domain/types';

export const STORAGE_KEY = 'smart-expense-tracker.v1';

export const EMPTY_APP_STATE: AppState = {
  expenses: [],
  settings: {
    monthlyBudgets: {},
    budgetWarningShownMonths: [],
    language: 'ja',
    currency: 'JPY',
    amountsMigratedToJpy: true,
  },
};

export type LoadResult = {
  state: AppState;
  status: LoadStatus;
};

function isExpense(value: unknown): value is Expense {
  if (!value || typeof value !== 'object') return false;
  const expense = value as Partial<Expense>;
  const dateParts = typeof expense.date === 'string' ? expense.date.split('-').map(Number) : [];
  const validDate = dateParts.length === 3
    && Number.isInteger(dateParts[0])
    && Number.isInteger(dateParts[1])
    && Number.isInteger(dateParts[2])
    && dateParts[1] >= 1
    && dateParts[1] <= 12
    && dateParts[2] >= 1
    && dateParts[2] <= new Date(Date.UTC(dateParts[0], dateParts[1], 0)).getUTCDate();
  return typeof expense.id === 'string'
    && typeof expense.amount === 'number'
    && Number.isInteger(expense.amount)
    && expense.amount > 0
    && typeof expense.categoryId === 'string'
    && typeof expense.date === 'string'
    && validDate
    && typeof expense.note === 'string'
    && typeof expense.createdAt === 'string';
}

function isAppLanguage(value: unknown): value is AppLanguage {
  return value === 'ja' || value === 'en' || value === 'id';
}

function isCurrencyCode(value: unknown): value is CurrencyCode {
  return value === 'JPY' || value === 'USD' || value === 'IDR';
}

function migrateStoredAppState(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  const state = value as Record<string, unknown>;
  if (!state.settings || typeof state.settings !== 'object') return value;

  const settings = state.settings as Record<string, unknown>;
  return {
    ...state,
    settings: {
      ...settings,
      language: isAppLanguage(settings.language) ? settings.language : 'ja',
      currency: isCurrencyCode(settings.currency) ? settings.currency : 'JPY',
      amountsMigratedToJpy: settings.amountsMigratedToJpy === true,
    },
  };
}

function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<AppState>;
  const settings = state.settings;
  if (!Array.isArray(state.expenses) || !state.expenses.every(isExpense) || !settings) return false;
  if (typeof settings !== 'object' || !settings.monthlyBudgets || !Array.isArray(settings.budgetWarningShownMonths)) {
    return false;
  }

  return Object.values(settings.monthlyBudgets).every((budget) => (
    typeof budget === 'number' && Number.isInteger(budget) && budget >= 0
  ))
    && settings.budgetWarningShownMonths.every((month) => typeof month === 'string')
    && isAppLanguage(settings.language)
    && isCurrencyCode(settings.currency)
    && typeof settings.amountsMigratedToJpy === 'boolean'
    && (settings.legacyAmountsAssumedJpy === undefined || typeof settings.legacyAmountsAssumedJpy === 'boolean');
}

export function loadAppState(): LoadResult {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === null) return { state: EMPTY_APP_STATE, status: 'ready' };

    const parsed: unknown = migrateStoredAppState(JSON.parse(saved));
    return isAppState(parsed)
      ? { state: parsed, status: 'ready' }
      : { state: EMPTY_APP_STATE, status: 'malformed' };
  } catch {
    return { state: EMPTY_APP_STATE, status: 'unavailable' };
  }
}

export function saveAppState(state: AppState): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearSavedAppState(): boolean {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
