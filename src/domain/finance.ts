import { CATEGORIES } from './categories';
import type { AppLanguage, CategoryTotal, CurrencyCode, Expense } from './types';

const LOCALE_BY_LANGUAGE: Record<AppLanguage, string> = {
  ja: 'ja-JP',
  en: 'en-US',
  id: 'id-ID',
};

export function getMonthTotal(expenses: Expense[], monthKey: string): number {
  return expenses.reduce((total, expense) => (
    expense.date.startsWith(`${monthKey}-`) ? total + expense.amount : total
  ), 0);
}

export function getTodayTotal(expenses: Expense[], todayKey: string): number {
  return expenses.reduce((total, expense) => (
    expense.date === todayKey ? total + expense.amount : total
  ), 0);
}

export function getRemainingBudget(monthlyBudget: number | undefined, spent: number): number | null {
  if (monthlyBudget === undefined) return null;
  return monthlyBudget - spent;
}

export function getDailyTarget(remainingBudget: number | null, daysRemaining: number): number | null {
  if (remainingBudget === null) return null;
  if (daysRemaining <= 0) return 0;
  return Math.floor(Math.max(remainingBudget, 0) / daysRemaining);
}

export function getCategoryBreakdown(expenses: Expense[], monthKey: string): CategoryTotal[] {
  const monthlyExpenses = expenses.filter((expense) => expense.date.startsWith(`${monthKey}-`));
  const monthTotal = monthlyExpenses.reduce((total, expense) => total + expense.amount, 0);

  return CATEGORIES
    .map((category) => {
      const amount = monthlyExpenses.reduce((total, expense) => (
        expense.categoryId === category.id ? total + expense.amount : total
      ), 0);

      return {
        categoryId: category.id,
        amount,
        percent: monthTotal === 0 ? 0 : Math.round((amount / monthTotal) * 100),
      };
    })
    .filter((category) => category.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

export function formatCurrency(amount: number, currency: CurrencyCode, language: AppLanguage): string {
  return new Intl.NumberFormat(LOCALE_BY_LANGUAGE[language], {
    style: 'currency',
    currency,
  }).format(amount);
}

export function getCurrencySymbol(currency: CurrencyCode, language: AppLanguage): string {
  return new Intl.NumberFormat(LOCALE_BY_LANGUAGE[language], {
    style: 'currency',
    currency,
  }).formatToParts(0).find((part) => part.type === 'currency')?.value ?? currency;
}

export function formatPercent(percent: number, language: AppLanguage): string {
  return new Intl.NumberFormat(LOCALE_BY_LANGUAGE[language], {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(percent / 100);
}
