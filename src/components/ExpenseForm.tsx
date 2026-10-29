import { useEffect, useRef, useState } from 'react';
import type { FormEvent, SyntheticEvent } from 'react';
import { getCategories } from '../domain/categories';
import { getCurrencySymbol } from '../domain/finance';
import { getDateInputValue } from '../domain/dates';
import type { AppLanguage, CategoryId, CurrencyCode, ExchangeRates, Expense, ExpenseInput } from '../domain/types';
import { t } from '../i18n/messages';
import { convertFromJpy, convertToJpy, hasValidCurrencyPrecision } from '../lib/exchangeRates';

type ExpenseFormProps = {
  open: boolean;
  initialExpense?: Expense;
  onSave: (input: ExpenseInput) => void;
  onCancel: () => void;
  language: AppLanguage;
  currency: CurrencyCode;
  exchangeRates: ExchangeRates | null;
};

export function ExpenseForm({ open, initialExpense, onSave, onCancel, language, currency, exchangeRates }: ExpenseFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [ratesAtOpen] = useState(exchangeRates);
  const initialDisplayAmount = initialExpense ? convertFromJpy(initialExpense.amount, currency, ratesAtOpen) : null;
  const initialAmountText = initialExpense ? String(initialDisplayAmount === null ? initialExpense.amount : Math.round(initialDisplayAmount * 100) / 100) : '';
  const [amount, setAmount] = useState(initialAmountText);
  const [categoryId, setCategoryId] = useState<CategoryId>(initialExpense?.categoryId ?? 'food');
  const [date, setDate] = useState(initialExpense?.date ?? getDateInputValue());
  const [note, setNote] = useState(initialExpense?.note ?? '');
  const [amountError, setAmountError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || !hasValidCurrencyPrecision(numericAmount, currency)) {
      setAmountError(t(language, 'amountError' as never));
      return;
    }
    const amountInJpy = initialExpense && numericAmount === Number(initialAmountText)
      ? initialExpense.amount
      : convertToJpy(numericAmount, currency, ratesAtOpen);
    if (amountInJpy === null || amountInJpy < 1) { setAmountError(t(language, 'rateUnavailable' as never)); return; }
    setAmountError('');
    onSave({ amount: amountInJpy, categoryId, date, note: note.trim() });
  }

  function handleCancel(event: SyntheticEvent<HTMLDialogElement, Event>) {
    event.preventDefault();
    onCancel();
  }

  return (
    <dialog aria-labelledby="expense-form-title" className="dialog expense-dialog" onCancel={handleCancel} ref={dialogRef}>
      <div className="dialog-heading">
        <div>
          <p className="eyebrow">{t(language, 'record' as never)}</p>
          <h2 id="expense-form-title">{t(language, initialExpense ? 'editExpense' : 'newExpense')}</h2>
        </div>
        <button aria-label={t(language, 'close' as never)} className="icon-button" onClick={onCancel} type="button">×</button>
      </div>
      <form className="expense-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>{t(language, 'amount' as never)} <b>{t(language, 'required' as never)}</b></span>
          <div className={`amount-input${amountError ? ' has-error' : ''}`}>
            <span aria-hidden="true">{getCurrencySymbol(currency, language)}</span>
            <input
              aria-describedby={amountError ? 'amount-error' : undefined}
              aria-invalid={Boolean(amountError)}
              autoComplete="off"
              autoFocus
              inputMode={currency === 'USD' ? 'decimal' : 'numeric'}
              min={currency === 'USD' ? '0.01' : '1'}
              onChange={(event) => { setAmount(event.target.value); if (amountError) setAmountError(''); }}
              placeholder="0"
              step={currency === 'USD' ? '0.01' : '1'}
              type="number"
              value={amount}
            />
          </div>
          {amountError && <small className="field-error" id="amount-error">{amountError}</small>}
        </label>
        <label className="field">
          <span>{t(language, 'category' as never)} <b>{t(language, 'required' as never)}</b></span>
          <select onChange={(event) => setCategoryId(event.target.value as CategoryId)} value={categoryId}>
            {getCategories(language).map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
          </select>
        </label>
        <label className="field">
          <span>{t(language, 'date' as never)} <b>{t(language, 'required' as never)}</b></span>
          <input onChange={(event) => setDate(event.target.value)} required type="date" value={date} />
        </label>
        <label className="field">
          <span>{t(language, 'note' as never)} <small>{t(language, 'optional' as never)}</small></span>
          <input maxLength={80} onChange={(event) => setNote(event.target.value)} placeholder={t(language, 'notePlaceholder' as never)} type="text" value={note} />
        </label>
        <div className="dialog-actions">
          <button className="button button-quiet" onClick={onCancel} type="button">{t(language, 'cancel' as never)}</button>
          <button className="button button-primary" type="submit">{t(language, 'saveExpense' as never)}</button>
        </div>
      </form>
    </dialog>
  );
}
