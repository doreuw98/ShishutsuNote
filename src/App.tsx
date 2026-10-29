import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppNavigation } from './components/AppNavigation';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ExpenseForm } from './components/ExpenseForm';
import { AnalysisPage } from './pages/AnalysisPage';
import { HistoryPage } from './pages/HistoryPage';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { formatDateLabel, formatMonthLabel, getDaysRemainingInTokyoMonth, getTokyoDateKey, getTokyoMonthKey } from './domain/dates';
import { getCategoryBreakdown, getDailyTarget, getMonthTotal, getRemainingBudget, getTodayTotal } from './domain/finance';
import type { AppSettings, AppState, Expense, ExpenseInput, ExchangeRates, LoadStatus, ViewId } from './domain/types';
import { clearSavedAppState, EMPTY_APP_STATE, loadAppState, saveAppState } from './lib/localStorage';
import { t } from './i18n/messages';
import { convertToJpy, getLatestExchangeRates, isRateFresh, loadCachedExchangeRates, RATE_MAX_AGE_MS } from './lib/exchangeRates';

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function App() {
  const [initialLoad] = useState(() => loadAppState());
  const [appState, setAppState] = useState<AppState>(initialLoad.state);
  const [storageStatus, setStorageStatus] = useState<LoadStatus>(initialLoad.status);
  const [activeView, setActiveView] = useState<ViewId>('home');
  const [isExpenseFormOpen, setExpenseFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [toast, setToast] = useState('');
  const [now, setNow] = useState(() => new Date());
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(() => loadCachedExchangeRates());
  const [rateStatus, setRateStatus] = useState<'loading' | 'ready' | 'missing-key' | 'error'>('loading');
  const [ratesChecked, setRatesChecked] = useState(false);
  const migrationStarted = useRef(false);
  const language = appState.settings.language;
  const currency = appState.settings.currency;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const refreshRates = useCallback(async () => {
    const result = await getLatestExchangeRates();
    setExchangeRates(result.rates);
    setRateStatus(result.state);
    setRatesChecked(true);
  }, []);

  useEffect(() => {
    const startupTimer = window.setTimeout(() => { void refreshRates(); }, 0);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refreshRates();
    }, RATE_MAX_AGE_MS);
    const onVisibilityChange = () => { if (document.visibilityState === 'visible') void refreshRates(); };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => { window.clearTimeout(startupTimer); window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisibilityChange); };
  }, [refreshRates]);

  useEffect(() => {
    if (!ratesChecked || appState.settings.amountsMigratedToJpy || migrationStarted.current) return;
    migrationStarted.current = true;
    const oldCurrency = appState.settings.currency;
    const canConvert = oldCurrency === 'JPY' || Boolean(exchangeRates);
    const migratedState: AppState = canConvert
      ? {
          ...appState,
          expenses: oldCurrency === 'JPY' ? appState.expenses : appState.expenses.map((expense) => ({ ...expense, amount: convertToJpy(expense.amount, oldCurrency, exchangeRates) ?? expense.amount })),
          settings: {
            ...appState.settings,
            currency: oldCurrency,
            monthlyBudgets: oldCurrency === 'JPY' ? appState.settings.monthlyBudgets : Object.fromEntries(Object.entries(appState.settings.monthlyBudgets).map(([key, amount]) => [key, convertToJpy(amount, oldCurrency, exchangeRates) ?? amount])),
            amountsMigratedToJpy: true,
          },
        }
      : {
          ...appState,
          settings: { ...appState.settings, currency: 'JPY', amountsMigratedToJpy: true, legacyAmountsAssumedJpy: true },
        };
    setAppState(migratedState);
    const saved = saveAppState(migratedState);
    setStorageStatus(saved ? 'ready' : 'unavailable');
  }, [appState, exchangeRates, language, ratesChecked]);

  const todayKey = getTokyoDateKey(now);
  const monthKey = getTokyoMonthKey(now);
  const monthTotal = useMemo(() => getMonthTotal(appState.expenses, monthKey), [appState.expenses, monthKey]);
  const todayTotal = useMemo(() => getTodayTotal(appState.expenses, todayKey), [appState.expenses, todayKey]);
  const monthlyBudget = appState.settings.monthlyBudgets[monthKey];
  const remainingBudget = getRemainingBudget(monthlyBudget, monthTotal);
  const dailyTarget = getDailyTarget(remainingBudget, getDaysRemainingInTokyoMonth(now));
  const categoryTotals = useMemo(() => getCategoryBreakdown(appState.expenses, monthKey), [appState.expenses, monthKey]);
  const displayCurrency = currency;
  const isMigrating = !appState.settings.amountsMigratedToJpy;
  const canEditAmounts = !isMigrating && (currency === 'JPY' || Boolean(exchangeRates));

  const commitState = useCallback((nextState: AppState, successMessage: string): boolean => {
    if (storageStatus === 'malformed' || isMigrating) return false;
    const currentMonth = getTokyoMonthKey(new Date());
    const budget = nextState.settings.monthlyBudgets[currentMonth];
    const spent = getMonthTotal(nextState.expenses, currentMonth);
    const warningAlreadyShown = nextState.settings.budgetWarningShownMonths.includes(currentMonth);
    const shouldWarn = budget !== undefined && budget > 0 && spent >= budget * 0.8 && !warningAlreadyShown;
    const stateToSave = shouldWarn
      ? {
          ...nextState,
          settings: {
            ...nextState.settings,
            budgetWarningShownMonths: [...nextState.settings.budgetWarningShownMonths, currentMonth],
          },
        }
      : nextState;
    setAppState(stateToSave);
    const saved = saveAppState(stateToSave);
    setStorageStatus(saved ? 'ready' : 'unavailable');
    setToast(shouldWarn
      ? language === 'ja' ? '今月の支出が予算の80%に達しました。' : language === 'en' ? 'You have reached 80% of this month’s budget.' : 'Pengeluaran bulan ini mencapai 80% anggaran.'
      : saved ? successMessage : language === 'ja' ? '変更は反映しましたが、このブラウザーには保存できませんでした。' : language === 'en' ? 'Changes are shown but could not be saved in this browser.' : 'Perubahan ditampilkan tetapi tidak dapat disimpan di browser ini.');
    return saved;
  }, [storageStatus, language, isMigrating]);

  const addExpense = useCallback((input: ExpenseInput) => {
    const expense: Expense = { ...input, id: createId(), createdAt: new Date().toISOString() };
    commitState({ ...appState, expenses: [expense, ...appState.expenses] }, language === 'ja' ? '支出を保存しました。' : language === 'en' ? 'Expense saved.' : 'Pengeluaran tersimpan.');
    setExpenseFormOpen(false);
    setEditingExpense(undefined);
  }, [appState, commitState, language]);

  const updateExpense = useCallback((input: ExpenseInput) => {
    if (!editingExpense) return;
    const expenses = appState.expenses.map((expense) => (
      expense.id === editingExpense.id ? { ...expense, ...input } : expense
    ));
    commitState({ ...appState, expenses }, language === 'ja' ? '変更を保存しました。' : language === 'en' ? 'Changes saved.' : 'Perubahan tersimpan.');
    setExpenseFormOpen(false);
    setEditingExpense(undefined);
  }, [appState, commitState, editingExpense, language]);

  const removeExpense = useCallback(() => {
    if (!expenseToDelete) return;
    const expenses = appState.expenses.filter((expense) => expense.id !== expenseToDelete.id);
    commitState({ ...appState, expenses }, language === 'ja' ? '支出を削除しました。' : language === 'en' ? 'Expense deleted.' : 'Pengeluaran dihapus.');
    setExpenseToDelete(null);
  }, [appState, commitState, expenseToDelete, language]);

  const saveBudget = useCallback((key: string, amount: number): boolean => {
    const nextState: AppState = {
      ...appState,
      settings: {
        ...appState.settings,
        monthlyBudgets: { ...appState.settings.monthlyBudgets, [key]: amount },
      },
    };
    const saved = commitState(nextState, language === 'ja' ? '月間予算を保存しました。' : language === 'en' ? 'Monthly budget saved.' : 'Anggaran bulanan tersimpan.');
    return saved;
  }, [appState, commitState, language]);

  const unshownBudgetWarning = monthlyBudget !== undefined
    && monthlyBudget > 0
    && monthTotal >= monthlyBudget * 0.8
    && !appState.settings.budgetWarningShownMonths.includes(monthKey);

  function beginAddExpense() {
    if (storageStatus === 'malformed' || !canEditAmounts) return;
    setEditingExpense(undefined);
    setExpenseFormOpen(true);
  }

  function beginEditExpense(expense: Expense) {
    if (storageStatus === 'malformed' || !canEditAmounts) return;
    setEditingExpense(expense);
    setExpenseFormOpen(true);
  }

  function requestDelete(expense: Expense) {
    if (storageStatus === 'malformed' || !canEditAmounts) return;
    setExpenseToDelete(expense);
  }

  function saveExpense(input: ExpenseInput) {
    if (editingExpense) updateExpense(input);
    else addExpense(input);
  }

  function startFreshAfterStorageError() {
    const cleared = clearSavedAppState();
    setAppState(EMPTY_APP_STATE);
    setStorageStatus(cleared ? 'ready' : 'unavailable');
    setToast(cleared ? language === 'ja' ? '保存データを消去しました。新しい記録を始められます。' : language === 'en' ? 'Saved data cleared. You can start fresh.' : 'Data tersimpan dihapus. Kamu bisa mulai mencatat.' : language === 'ja' ? '保存データを消去できませんでした。' : language === 'en' ? 'Could not clear saved data.' : 'Data tersimpan tidak dapat dihapus.');
  }

  const header = { home: t(language, 'homeTitle' as never), history: t(language, 'historyTitle' as never), analysis: t(language, 'analysisTitle' as never), settings: t(language, 'settingsTitle' as never) }[activeView];
  const subtitle = language === 'ja' ? { home:'支出と予算のバランスを確認しましょう。', history:'これまでの支出を見返して、必要なら修正できます。', analysis:'今月のお金の使い方を内訳から確認します。', settings:'月ごとの予算とデータの保存方法を管理します。' } : language === 'en' ? { home:'Review your spending and budget at a glance.', history:'Review and edit your past expenses.', analysis:'Explore this month’s spending by category.', settings:'Manage your monthly budget and saved data.' } : { home:'Pantau keseimbangan pengeluaran dan anggaran.', history:'Lihat dan ubah catatan pengeluaran sebelumnya.', analysis:'Lihat rincian penggunaan uang bulan ini.', settings:'Atur anggaran bulanan dan penyimpanan data.' };
  async function savePreferences(preferences: Pick<AppSettings, 'language' | 'currency'>): Promise<boolean> {
    const nextPreferences = preferences.language !== appState.settings.language
      ? { ...preferences, currency: appState.settings.currency }
      : preferences;
    if (nextPreferences.currency !== appState.settings.currency && nextPreferences.currency !== 'JPY' && (!exchangeRates || !isRateFresh(exchangeRates))) {
      const result = await getLatestExchangeRates();
      setExchangeRates(result.rates);
      setRateStatus(result.state);
      if (!result.rates) {
        setToast(t(language, 'currencyConversionError' as never));
        return false;
      }
    }
    return commitState({ ...appState, settings: { ...appState.settings, ...nextPreferences } }, t(nextPreferences.language, 'saved' as never));
  }

  return (
    <div className="app-shell">
      <AppNavigation activeView={activeView} language={language} onNavigate={setActiveView} />
      <div className="main-frame">
        <header className="topbar">
          <div className="topbar-copy">
            <p className="eyebrow">{formatDateLabel(todayKey, language)}　{formatMonthLabel(monthKey, language)}</p>
            <h1>{header}</h1>
            <p>{subtitle[activeView]}</p>
          </div>
          <button className="button button-primary topbar-add" disabled={storageStatus === 'malformed' || !canEditAmounts} onClick={beginAddExpense} type="button">
            <span aria-hidden="true">＋</span> {t(language, 'add' as never)}
          </button>
        </header>

        {storageStatus === 'malformed' && (
          <div className="storage-banner storage-banner-danger" role="alert">
            <div><strong>{t(language, 'malformed' as never)}</strong></div>
            <button className="button button-danger" onClick={startFreshAfterStorageError} type="button">{t(language, 'clear' as never)}</button>
          </div>
        )}
        {storageStatus === 'unavailable' && (
          <div className="storage-banner" role="status">
            <div><strong>{language === 'ja' ? 'ブラウザーに保存できません。' : language === 'en' ? 'Browser storage is unavailable.' : 'Penyimpanan browser tidak tersedia.'}</strong><span>{language === 'ja' ? 'このタブを閉じると、今回の記録は失われる可能性があります。' : language === 'en' ? 'Recent changes may be lost when this tab closes.' : 'Perubahan terbaru mungkin hilang saat tab ditutup.'}</span></div>
          </div>
        )}
        {ratesChecked && currency !== 'JPY' && !exchangeRates && (
          <div className="storage-banner" role="status">
            <div><strong>{t(language, rateStatus === 'missing-key' ? 'rateMissingKey' as never : 'rateUnavailable' as never)}</strong><span>{language === 'ja' ? '設定画面で為替レートの接続状態を確認してください。' : language === 'en' ? 'Check the exchange-rate setup on the Settings page.' : 'Periksa pengaturan kurs di halaman Pengaturan.'}</span></div>
            <button className="button button-quiet" onClick={() => setActiveView('settings')} type="button">{t(language, 'settings' as never)}</button>
          </div>
        )}
        {unshownBudgetWarning && activeView === 'home' && (
          <div className="budget-warning-banner" role="status">
            <strong>{t(language, 'warning' as never)}</strong>
            <span>{language === 'ja' ? '残りの予算を確認しながら使いましょう。' : language === 'en' ? 'Keep an eye on your remaining budget.' : 'Perhatikan sisa anggaranmu.'}</span>
          </div>
        )}

        <main>
          {activeView === 'home' && (
            <HomePage
              categoryTotals={categoryTotals}
              expenses={appState.expenses}
              monthKey={monthKey}
              monthTotal={monthTotal}
              monthlyBudget={monthlyBudget}
              dailyTarget={dailyTarget}
              remainingBudget={remainingBudget}
              todayKey={todayKey}
              todayTotal={todayTotal}
              onAdd={beginAddExpense}
              onDelete={requestDelete}
              onEdit={beginEditExpense}
              onOpenSettings={() => setActiveView('settings')}
              language={language}
              currency={displayCurrency}
              exchangeRates={exchangeRates}
            />
          )}
          {activeView === 'history' && (
            <HistoryPage expenses={appState.expenses} language={language} currency={displayCurrency} exchangeRates={exchangeRates} onAdd={beginAddExpense} onDelete={requestDelete} onEdit={beginEditExpense} />
          )}
          {activeView === 'analysis' && <AnalysisPage categoryTotals={categoryTotals} language={language} currency={displayCurrency} exchangeRates={exchangeRates} monthKey={monthKey} monthTotal={monthTotal} />}
          {activeView === 'settings' && <SettingsPage editable={storageStatus !== 'malformed' && !isMigrating} key={`${monthKey}-${displayCurrency}`} monthKey={monthKey} monthlyBudget={monthlyBudget} language={language} currency={displayCurrency} exchangeRates={exchangeRates} rateStatus={rateStatus} legacyAmountsAssumedJpy={Boolean(appState.settings.legacyAmountsAssumedJpy)} onRefreshRates={refreshRates} hasSavedData={appState.expenses.length > 0 || Object.keys(appState.settings.monthlyBudgets).length > 0} onSaveBudget={saveBudget} onSavePreferences={savePreferences} />}
        </main>
      </div>

      {toast && <div aria-live="polite" className="toast-message" role="status">{toast}</div>}
      <ExpenseForm
        key={editingExpense?.id ?? 'new-expense'}
        initialExpense={editingExpense}
        onCancel={() => { setExpenseFormOpen(false); setEditingExpense(undefined); }}
        onSave={saveExpense}
        open={isExpenseFormOpen}
        language={language}
        currency={displayCurrency}
        exchangeRates={exchangeRates}
      />
      <ConfirmDialog
        confirmLabel={language === 'ja' ? '削除する' : language === 'en' ? 'Delete' : 'Hapus'}
        description={language === 'ja' ? `${expenseToDelete?.note || 'この支出'}を記録から削除します。この操作は取り消せません。` : language === 'en' ? `${expenseToDelete?.note || 'This expense'} will be removed from your records. This cannot be undone.` : `${expenseToDelete?.note || 'Pengeluaran ini'} akan dihapus dari catatan. Tindakan ini tidak dapat dibatalkan.`}
        onCancel={() => setExpenseToDelete(null)}
        onConfirm={removeExpense}
        open={Boolean(expenseToDelete)}
        title={language === 'ja' ? '支出を削除しますか？' : language === 'en' ? 'Delete this expense?' : 'Hapus pengeluaran ini?'}
      />
    </div>
  );
}
