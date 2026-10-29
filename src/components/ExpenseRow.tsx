import { getCategory } from '../domain/categories';
import { formatDateLabel } from '../domain/dates';
import { formatCurrency } from '../domain/finance';
import type { AppLanguage, CurrencyCode, ExchangeRates, Expense } from '../domain/types';
import { t } from '../i18n/messages';
import { convertFromJpy } from '../lib/exchangeRates';
type Props = { expense: Expense; language: AppLanguage; currency: CurrencyCode; exchangeRates: ExchangeRates | null; onEdit?: (expense: Expense) => void; onDelete?: (expense: Expense) => void };
export function ExpenseRow({ expense, language, currency, exchangeRates, onEdit, onDelete }: Props) {
  const category = getCategory(expense.categoryId, language);
  const displayAmount = convertFromJpy(expense.amount, currency, exchangeRates);
  return <article className="expense-row"><span className="category-marker" style={{ backgroundColor: category.color }} aria-hidden="true"/><div className="expense-row-main"><strong>{expense.note || category.label}</strong><span>{category.label}<span className="row-separator" aria-hidden="true"> / </span>{formatDateLabel(expense.date, language)}</span></div><strong className="expense-amount">{displayAmount === null ? '—' : formatCurrency(displayAmount, currency, language)}</strong>{(onEdit||onDelete)&&<div className="row-actions">{onEdit&&<button aria-label={`${category.label}: ${t(language,'edit')}`} onClick={()=>onEdit(expense)} type="button">{t(language,'edit')}</button>}{onDelete&&<button aria-label={`${category.label}: ${t(language,'delete')}`} className="text-danger" onClick={()=>onDelete(expense)} type="button">{t(language,'delete')}</button>}</div>}</article>;
}
