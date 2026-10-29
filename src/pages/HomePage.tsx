import { CATEGORIES, getCategory } from '../domain/categories';
import { formatDateLabel, formatMonthLabel } from '../domain/dates';
import { formatCurrency } from '../domain/finance';
import type { AppLanguage, CategoryTotal, CurrencyCode, ExchangeRates, Expense } from '../domain/types';
import { EmptyState } from '../components/EmptyState';
import { ExpenseRow } from '../components/ExpenseRow';
import { t } from '../i18n/messages';
import { convertFromJpy } from '../lib/exchangeRates';

type HomePageProps = {
  expenses: Expense[];
  todayKey: string;
  monthKey: string;
  todayTotal: number;
  monthTotal: number;
  monthlyBudget?: number;
  remainingBudget: number | null;
  dailyTarget: number | null;
  categoryTotals: CategoryTotal[];
  onAdd: () => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  onOpenSettings: () => void;
  language: AppLanguage;
  currency: CurrencyCode;
  exchangeRates: ExchangeRates | null;
};

export function HomePage({
  expenses, todayKey, monthKey, todayTotal, monthTotal, monthlyBudget, remainingBudget,
  dailyTarget, categoryTotals, onAdd, onEdit, onDelete, onOpenSettings, language, currency, exchangeRates,
}: HomePageProps) {
  const money = (amount: number) => {
    const converted = convertFromJpy(amount, currency, exchangeRates);
    return converted === null ? '—' : formatCurrency(converted, currency, language);
  };
  const text = (ja: string, en: string, id: string) => language === 'ja' ? ja : language === 'en' ? en : id;
  const recentExpenses = [...expenses]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);
  const budgetPercent = monthlyBudget && monthlyBudget > 0
    ? Math.min(Math.round((monthTotal / monthlyBudget) * 100), 100)
    : monthTotal > 0 ? 100 : 0;
  const topCategories = categoryTotals.slice(0, 3);

  return (
    <div className="page-content home-page">
      <section className="budget-panel" aria-labelledby="budget-title">
        <div className="budget-panel-copy">
          <p className="eyebrow">{formatMonthLabel(monthKey, language)} · {t(language, 'budget' as never)}</p>
          <h2 id="budget-title">{t(language, 'budgetQuestion' as never)}</h2>
          {monthlyBudget === undefined ? (
            <>
              <p className="budget-empty-copy">{t(language, 'noBudget' as never)}</p>
              <button className="button button-light" onClick={onOpenSettings} type="button">{t(language, 'setBudget' as never)}</button>
            </>
          ) : (
            <>
              <p className={`budget-remaining${(remainingBudget ?? 0) < 0 ? ' is-over' : ''}`}>
                {(remainingBudget ?? 0) < 0 ? text('予算を超えています','Over budget','Anggaran terlampaui') : money(remainingBudget ?? 0)}
              </p>
              {(remainingBudget ?? 0) < 0 && <p className="budget-over-copy">{text('超過額','Over by','Melebihi sebesar')} {money(Math.abs(remainingBudget ?? 0))}</p>}
              <div className="budget-progress-meta">
                <span>{t(language, 'month' as never)} {money(monthTotal)}</span>
                <span>{t(language, 'budget' as never)} {money(monthlyBudget)}</span>
              </div>
              <div
                aria-label={`${budgetPercent}%`}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={budgetPercent}
                className="budget-progress-track"
                role="progressbar"
              >
                <span className={budgetPercent >= 80 ? 'is-warning' : ''} style={{ width: `${budgetPercent}%` }} />
              </div>
            </>
          )}
        </div>
        <div className="daily-target">
          <span className="daily-target-label">{text('今日からの1日あたり目安','Daily target from today','Batas harian mulai hari ini')}</span>
          <strong>{dailyTarget === null ? '—' : money(dailyTarget)}</strong>
          <span>{dailyTarget === null ? text('予算を設定してください','Set a budget to begin','Silakan atur anggaran') : text('月末までの残日数で計算','Based on days left in the month','Dihitung dari sisa hari dalam bulan')}</span>
        </div>
        <div className="budget-panel-footer">
          <span>{formatDateLabel(todayKey, language)} {t(language, 'today' as never)}</span>
          <strong>{money(todayTotal)}</strong>
        </div>
      </section>

      <section aria-label={t(language, 'total' as never)} className="summary-strip">
        <div className="summary-item">
          <span>{t(language, 'today' as never)}</span>
          <strong>{money(todayTotal)}</strong>
          <small>{formatDateLabel(todayKey, language)}</small>
        </div>
        <div className="summary-item">
          <span>{t(language, 'month' as never)}</span>
          <strong>{money(monthTotal)}</strong>
          <small>{formatMonthLabel(monthKey, language)}</small>
        </div>
        <button className="add-expense-tile" onClick={onAdd} type="button">
          <span className="add-mark" aria-hidden="true">＋</span>
          <span><strong>{t(language, 'record' as never)}</strong><small>{text('使った金額を追加する','Add an amount you spent','Tambahkan nominal yang digunakan')}</small></span>
        </button>
      </section>

      <div className="home-lower-grid">
        <section className="content-section recent-section">
          <div className="section-heading">
            <div><p className="eyebrow">{t(language, 'recent' as never)}</p><h2>{t(language, 'expenseHistory' as never)}</h2></div>
          {expenses.length > 4 && <span className="subtle-count">{language === 'ja' ? `全${expenses.length}件` : language === 'en' ? `${expenses.length} total` : `Total ${expenses.length}`}</span>}
          </div>
          {recentExpenses.length === 0 ? (
            <EmptyState title={t(language, 'empty' as never)} description={t(language, 'emptyHint' as never)} actionLabel={t(language, 'record' as never)} onAction={onAdd} />
          ) : (
            <div className="expense-list">
              {recentExpenses.map((expense) => <ExpenseRow expense={expense} language={language} currency={currency} exchangeRates={exchangeRates} key={expense.id} onDelete={onDelete} onEdit={onEdit} />)}
            </div>
          )}
        </section>

        <section className="content-section category-section">
          <div className="section-heading">
            <div><p className="eyebrow">{formatMonthLabel(monthKey, language)}</p><h2>{t(language, 'analysisTitle' as never)}</h2></div>
            <span className="subtle-count">{language === 'ja' ? `${categoryTotals.length}費目` : language === 'en' ? `${categoryTotals.length} categories` : `${categoryTotals.length} kategori`}</span>
          </div>
          {topCategories.length === 0 ? (
            <p className="muted-copy">{t(language, 'noBreakdown' as never)}</p>
          ) : (
            <div className="category-mini-list">
              {topCategories.map((item) => {
                const category = getCategory(item.categoryId, language);
                const maxAmount = topCategories[0]?.amount ?? 1;
                return (
                  <div className="category-mini-row" key={item.categoryId}>
                    <div className="category-mini-head"><span><i style={{ backgroundColor: category.color }} />{category.label}</span><strong>{money(item.amount)}</strong></div>
                    <div className="category-mini-track"><span style={{ width: `${Math.max((item.amount / maxAmount) * 100, 3)}%`, backgroundColor: category.color }} /></div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="category-footnote">
            <span>{language === 'ja' ? '初期費目' : language === 'en' ? 'Default categories' : 'Kategori bawaan'}</span><strong>{language === 'ja' ? `${CATEGORIES.length}種類` : `${CATEGORIES.length}`}</strong>
          </div>
        </section>
      </div>
    </div>
  );
}
