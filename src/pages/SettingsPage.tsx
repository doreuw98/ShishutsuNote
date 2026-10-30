import { useState } from 'react';
import type { FormEvent } from 'react';
import { formatMonthLabel } from '../domain/dates';
import { formatCurrency, getCurrencySymbol } from '../domain/finance';
import type { AppLanguage, AppSettings, CurrencyCode, ExchangeRates } from '../domain/types';
import { t } from '../i18n/messages';
import { convertFromJpy, convertToJpy, formatRateTimestamp, hasValidCurrencyPrecision } from '../lib/exchangeRates';

type Props = { monthKey: string; monthlyBudget?: number; editable: boolean; language: AppLanguage; currency: CurrencyCode; hasSavedData: boolean; exchangeRates: ExchangeRates | null; rateStatus: 'loading' | 'ready' | 'missing-key' | 'error'; legacyAmountsAssumedJpy: boolean; onRefreshRates: () => void; onSaveBudget: (monthKey: string, amount: number) => Promise<boolean>; onSavePreferences: (preferences: Pick<AppSettings, 'language' | 'currency'>) => Promise<boolean> };
export function SettingsPage({ monthKey, monthlyBudget, editable, language, currency, hasSavedData, exchangeRates, rateStatus, legacyAmountsAssumedJpy, onRefreshRates, onSaveBudget, onSavePreferences }: Props) {
  const initialDisplayBudget = monthlyBudget === undefined ? null : convertFromJpy(monthlyBudget, currency, exchangeRates);
  const [amountDraft, setAmountDraft] = useState<string | null>(null);
  const amount = amountDraft ?? (monthlyBudget === undefined || initialDisplayBudget === null ? '' : String(Math.round(initialDisplayBudget * 100) / 100));
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);
  const [pendingCurrency, setPendingCurrency] = useState<CurrencyCode | null>(null);
  const [savingPreference, setSavingPreference] = useState(false);
  const [preferenceError, setPreferenceError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const value = Number(amount);
    if (!amount.trim() || !Number.isFinite(value) || value < 0 || !hasValidCurrencyPrecision(value, currency)) { setError(t(language, 'budgetError' as never)); return; }
    const amountInJpy = convertToJpy(value, currency, exchangeRates);
    if (amountInJpy === null) { setError(t(language, 'rateUnavailable' as never)); return; }
    setError(''); setSavingBudget(true); const didSave = await onSaveBudget(monthKey, amountInJpy); setSavingBudget(false); setSaved(didSave); if (didSave) setAmountDraft(null); else setError(language === 'ja' ? '保存できませんでした。接続を確認してください。' : language === 'en' ? 'Could not save. Check your connection.' : 'Tidak dapat menyimpan. Periksa koneksi.');
  }
  const selectLanguage = (next: AppLanguage) => { if (next !== language) void onSavePreferences({ language: next, currency }); };
  const selectCurrency = (next: CurrencyCode) => { if (next === currency) return; setPreferenceError(''); if (hasSavedData) setPendingCurrency(next); else void saveCurrency(next); };
  async function saveCurrency(next: CurrencyCode) {
    setSavingPreference(true);
    const success = await onSavePreferences({ language, currency: next });
    setSavingPreference(false);
    if (!success) setPreferenceError(t(language, 'currencyConversionError' as never));
    return success;
  }
  return <div className="page-content settings-page">
    <section className="content-section settings-section">
      <div className="section-heading"><div><p className="eyebrow">{t(language,'setBudget' as never)}</p><h2>{formatMonthLabel(monthKey, language)} · {t(language,'budget' as never)}</h2></div><span className="settings-currency">{currency}</span></div>
      <p className="settings-intro">{t(language,'budgetIntro' as never)}</p>
      <form className="budget-form" onSubmit={submit}><label className="field"><span>{t(language,'budget' as never)}</span><div className="amount-input settings-amount"><span aria-hidden="true">{getCurrencySymbol(currency, language)}</span><input disabled={!editable || (currency !== 'JPY' && !exchangeRates)} inputMode={currency === 'USD' ? 'decimal' : 'numeric'} min="0" onChange={(e)=>{setAmountDraft(e.target.value);setError('');setSaved(false);}} placeholder="60000" step={currency === 'USD' ? '0.01' : '1'} type="number" value={amount}/></div>{error&&<small className="field-error">{error}</small>}</label><button className="button button-primary" disabled={savingBudget || !editable || (currency !== 'JPY' && !exchangeRates)} type="submit">{savingBudget ? '…' : t(language,'saveBudget' as never)}</button>{saved&&<span className="save-success">{formatCurrency(Number(amount),currency,language)} · {t(language,'saved' as never)}</span>}</form>
      <div className="settings-divider"/>
      <label className="field settings-preference"><span>{t(language,'language' as never)}</span><select disabled={!editable} onChange={(e)=>selectLanguage(e.target.value as AppLanguage)} value={language}><option value="ja">日本語</option><option value="en">English</option><option value="id">Bahasa Indonesia</option></select></label>
      <label className="field settings-preference"><span>{t(language,'currency' as never)}</span><select disabled={!editable || savingPreference} onChange={(e)=>selectCurrency(e.target.value as CurrencyCode)} value={pendingCurrency ?? currency}><option value="JPY">JPY — {t(language,'yen' as never)}</option><option value="USD">USD — {t(language,'usd' as never)}</option><option value="IDR">IDR — {t(language,'idr' as never)}</option></select></label>
      {preferenceError && <small className="field-error">{preferenceError}</small>}
      <div className="settings-divider"/><div className="settings-info-row"><span>{t(language,'storage' as never)}</span><strong>{t(language,'browser' as never)}</strong></div>
      <div className="settings-rate-info"><div><strong>{t(language,'rateTitle' as never)}</strong><p>{t(language,'rateInfo' as never)}</p>{exchangeRates && <small>{t(language,'rateUpdated' as never)}: {formatRateTimestamp(exchangeRates, language)} JST</small>}{exchangeRates && rateStatus !== 'ready' && <small className="field-error">{t(language,'rateOutdated' as never)}</small>}{rateStatus === 'missing-key' && <small className="field-error">{t(language,'rateMissingKey' as never)}</small>}{rateStatus === 'error' && <small className="field-error">{t(language,'rateUnavailable' as never)}</small>}</div>{rateStatus === 'error' && <button className="button button-quiet" onClick={onRefreshRates} type="button">{language === 'ja' ? '再試行' : language === 'en' ? 'Try again' : 'Coba lagi'}</button>}</div>
      {legacyAmountsAssumedJpy && <p className="field-error">{language === 'ja' ? '為替レートが利用できなかったため、以前の金額をJPYとして扱っています。' : language === 'en' ? 'Older amounts were treated as JPY because no exchange rate was available during migration.' : 'Nominal lama dianggap JPY karena kurs tidak tersedia saat migrasi.'}</p>}
    </section><aside className="privacy-note"><span aria-hidden="true" className="privacy-mark">i</span><p>{t(language,'privacy' as never)}</p></aside>
    {pendingCurrency&&<dialog open className="dialog confirm-dialog"><div className="confirm-symbol">!</div><h2>{t(language,'confirm' as never)}</h2><p>{t(language,'confirmCurrency' as never)}</p>{preferenceError&&<small className="field-error">{preferenceError}</small>}<div className="dialog-actions"><button className="button button-quiet" disabled={savingPreference} onClick={()=>{setPendingCurrency(null);setPreferenceError('');}} type="button">{t(language,'cancel' as never)}</button><button className="button button-primary" disabled={savingPreference} onClick={async()=>{const success=await saveCurrency(pendingCurrency);if(success)setPendingCurrency(null);}} type="button">{savingPreference ? '…' : t(language,'change' as never)}</button></div></dialog>}
  </div>;
}
