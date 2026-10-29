import { useMemo, useState } from 'react';
import { getCategories } from '../domain/categories';
import type { AppLanguage, CategoryId, CurrencyCode, ExchangeRates, Expense } from '../domain/types';
import { EmptyState } from '../components/EmptyState';
import { ExpenseRow } from '../components/ExpenseRow';
import { t } from '../i18n/messages';

type HistoryPageProps = {
  expenses: Expense[];
  onAdd: () => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  language: AppLanguage; currency: CurrencyCode;
  exchangeRates: ExchangeRates | null;
};

export function HistoryPage({ expenses, onAdd, onEdit, onDelete, language, currency, exchangeRates }: HistoryPageProps) {
  const text = (ja: string, en: string, id: string) => language === 'ja' ? ja : language === 'en' ? en : id;
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryId | 'all'>('all');
  const filteredExpenses = useMemo(() => {
      const normalizedQuery = query.trim().toLocaleLowerCase(language === 'ja' ? 'ja-JP' : language === 'id' ? 'id-ID' : 'en-US');
    return [...expenses]
      .filter((expense) => categoryFilter === 'all' || expense.categoryId === categoryFilter)
      .filter((expense) => !normalizedQuery || expense.note.toLocaleLowerCase(language === 'ja' ? 'ja-JP' : language === 'id' ? 'id-ID' : 'en-US').includes(normalizedQuery))
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [categoryFilter, expenses, query, language]);

  return (
    <div className="page-content">
      <section className="content-section history-section">
        <div className="section-heading history-heading">
          <div><p className="eyebrow">{t(language, 'history' as never)}</p><h2>{t(language, 'expenseHistory' as never)}</h2></div>
          <span className="subtle-count">{language === 'ja' ? `${filteredExpenses.length}件` : language === 'en' ? `${filteredExpenses.length} records` : `${filteredExpenses.length} catatan`}</span>
        </div>
        <div className="history-filters">
          <label className="search-field">
            <span className="sr-only">{text('メモを検索','Search notes','Cari catatan')}</span>
            <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg>
            <input onChange={(event) => setQuery(event.target.value)} placeholder={t(language, 'search' as never)} type="search" value={query} />
          </label>
          <label className="select-field">
            <span className="sr-only">{text('費目で絞り込む','Filter by category','Filter kategori')}</span>
            <select onChange={(event) => setCategoryFilter(event.target.value as CategoryId | 'all')} value={categoryFilter}>
              <option value="all">{text('すべての費目','All categories','Semua kategori')}</option>
              {getCategories(language).map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
            </select>
          </label>
        </div>
        {expenses.length === 0 ? (
          <EmptyState title={t(language, 'empty' as never)} description={t(language, 'emptyHint' as never)} actionLabel={t(language, 'record' as never)} onAction={onAdd} />
        ) : filteredExpenses.length === 0 ? (
          <EmptyState title={text('該当する記録がありません','No matching records','Catatan tidak ditemukan')} description={text('検索語や費目を変えて、もう一度お試しください。','Try another search or category.','Coba kata pencarian atau kategori lain.')} />
        ) : (
          <div className="expense-list history-list">
            {filteredExpenses.map((expense) => <ExpenseRow expense={expense} language={language} currency={currency} exchangeRates={exchangeRates} key={expense.id} onDelete={onDelete} onEdit={onEdit} />)}
          </div>
        )}
      </section>
    </div>
  );
}
