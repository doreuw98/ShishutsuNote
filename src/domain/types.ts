export type ViewId = 'home' | 'history' | 'analysis' | 'settings';
export type AppLanguage = 'ja' | 'en' | 'id';
export type CurrencyCode = 'JPY' | 'USD' | 'IDR';
export type ExchangeRates = {
  base: 'USD';
  timestamp: number;
  fetchedAt: number;
  rates: { JPY: number; IDR: number };
};

export type CategoryId =
  | 'food'
  | 'transport'
  | 'housing'
  | 'study'
  | 'communications'
  | 'entertainment'
  | 'daily-goods'
  | 'other';

export type Category = {
  id: CategoryId;
  color: string;
  labels: Record<AppLanguage, string>;
};

export type LocalizedCategory = {
  id: CategoryId;
  label: string;
  color: string;
};

export type Expense = {
  id: string;
  amount: number;
  categoryId: CategoryId;
  date: string;
  note: string;
  createdAt: string;
};

export type ExpenseInput = Pick<Expense, 'amount' | 'categoryId' | 'date' | 'note'>;

export type CategoryTotal = {
  categoryId: CategoryId;
  amount: number;
  percent: number;
};

export type AppSettings = {
  monthlyBudgets: Record<string, number>;
  budgetWarningShownMonths: string[];
  language: AppLanguage;
  currency: CurrencyCode;
  amountsMigratedToJpy: boolean;
  legacyAmountsAssumedJpy?: boolean;
};

export type AppState = {
  expenses: Expense[];
  settings: AppSettings;
};

export type LoadStatus = 'ready' | 'malformed' | 'unavailable';
