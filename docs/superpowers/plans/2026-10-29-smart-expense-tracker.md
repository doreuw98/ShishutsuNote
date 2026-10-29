# Smart Expense Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a Japanese, responsive expense tracking web app for Drew's classroom presentation.

**Architecture:** A React + TypeScript single-page app will keep data in browser localStorage and render four views (home, history, analysis, settings) without a server. Pure date and finance helpers will define the yen totals, monthly budget, daily target, and category breakdown; UI components will call them through a small app state layer.

**Tech Stack:** React, TypeScript, Vite, CSS, browser localStorage; no UI framework, chart library, backend, or account system.

**Spec:** `docs/superpowers/specs/2026-10-29-smart-expense-tracker-design.md`

## Global Constraints

- UI language is Japanese; default currency is JPY; amounts are positive whole yen.
- Date grouping uses `Asia/Tokyo`.
- Monthly budgets are keyed by calendar month; unused money does not roll over.
- Daily target equals `max(monthlyBudget - monthlyExpenses, 0) / daysRemainingIncludingToday`, rounded down to a whole yen.
- App data stays in the browser and is not sent to a server.
- The interface must work at 375px, 768px, 1024px, and 1440px without horizontal scrolling.
- No login, cloud sync, bank connection, receipt OCR, currency conversion, or language switching in this release.

## Review Focus

- **Invalid amounts:** blank, zero, negative, or fractional yen must be rejected with a field-level message; cover in Task 3's manual review.
- **Tokyo day/month boundaries:** records around midnight and the first day of a month must be grouped by `Asia/Tokyo`; cover in Task 2's manual review.
- **No/over budget:** no configured monthly budget, zero budget, exact 80% threshold, and overspending must produce clear states without dividing by zero; cover in Task 4's manual review.
- **Edit/delete consistency:** changing or deleting an expense must update all totals and category shares; cover in Task 3's manual review.
- **Invalid stored data:** malformed or unavailable localStorage must not crash the page or silently overwrite recoverable data; cover in Task 2's manual review.

---

## File Structure

- Create `index.html` — Japanese document language, viewport metadata, and app mount point.
- Create `src/main.tsx` — React entry point and global stylesheet imports.
- Create `src/App.tsx` — app state, view selection, navigation, and composition of the four views.
- Create `src/domain/types.ts` — `Expense`, `Category`, `MonthlyBudgets`, and persisted state types.
- Create `src/domain/categories.ts` — fixed initial category IDs and Japanese labels.
- Create `src/domain/dates.ts` — Tokyo date keys, current month key, month range, and remaining days.
- Create `src/domain/finance.ts` — daily/monthly totals, remaining budget, daily target, and category breakdown.
- Create `src/lib/localStorage.ts` — validated load/save operations and storage error result.
- Create `src/components/AppNavigation.tsx` — responsive desktop navigation and mobile bottom navigation.
- Create `src/components/ExpenseForm.tsx` — labeled create/edit form and field validation.
- Create `src/components/ConfirmDialog.tsx` — accessible delete confirmation.
- Create `src/components/EmptyState.tsx` — actionable empty and no-search-result states.
- Create `src/pages/HomePage.tsx` — month budget progress, daily target, today/month totals, recent expenses, and add action.
- Create `src/pages/HistoryPage.tsx` — newest-first list, note search, category filter, edit, and delete actions.
- Create `src/pages/AnalysisPage.tsx` — monthly category totals and percentages with labeled horizontal bars.
- Create `src/pages/SettingsPage.tsx` — current-month budget and app data explanation.
- Create `src/styles/tokens.css` — named color, type, spacing, and focus tokens from the design.
- Create `src/styles.css` — responsive layout, forms, navigation, states, and reduced-motion behavior.
- Create `package.json` and TypeScript/Vite configuration — scripts for `dev`, `build`, `typecheck`, and `lint`.

## Tasks

### Task 1: Create the responsive React application shell

**Files:**
- Create: `index.html`
- Create: `package.json`
- Create: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `eslint.config.js`
- Create: `src/main.tsx`, `src/App.tsx`
- Create: `src/components/AppNavigation.tsx`
- Create: `src/styles/tokens.css`, `src/styles.css`

**Interfaces:**
- Produces `App` with a Japanese document shell, four-view navigation state, and page placeholders.
- Produces CSS tokens: navy `#17233B`, orange `#F26A3D`, canvas `#F2F5F9`, text `#202938`; Japanese system sans-serif stack.

- [ ] Build the Vite React TypeScript scaffold and add only required runtime and development dependencies.
- [ ] Add the Japanese document metadata, app mount point, and `App` shell.
- [ ] Implement four labeled navigation choices; use a sidebar on wide screens and bottom navigation on narrow screens.
- [ ] Add focus-visible, contrast-aware, reduced-motion, and mobile-first base styles.
- [ ] Run `npm run typecheck`, `npm run lint`, and `npm run build`; manually inspect widths 375px and 1440px.

### Task 2: Define expense data, Tokyo date helpers, calculations, and local persistence

**Files:**
- Create: `src/domain/types.ts`, `src/domain/categories.ts`, `src/domain/dates.ts`, `src/domain/finance.ts`
- Create: `src/lib/localStorage.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- `Expense`: `{ id: string; amount: number; categoryId: string; date: string; note: string; createdAt: string }`, with `date` in `YYYY-MM-DD` form. `ExpenseInput = Pick<Expense, "amount" | "categoryId" | "date" | "note">`.
- `AppSettings`: `{ monthlyBudgets: Record<string, number>; budgetWarningShownMonths: string[] }`; budget keys and warning entries use `YYYY-MM`.
- `loadAppState(): { state: AppState; error?: "malformed" | "unavailable" }`; `saveAppState(state: AppState): { ok: boolean; error?: "unavailable" }`.
- `getTokyoDateKey(date: Date): string`; `getTokyoMonthKey(date: Date): string`; `getDaysRemainingInTokyoMonth(date: Date): number` (includes today).
- `getMonthTotal(expenses, monthKey): number`; `getTodayTotal(expenses, todayKey): number`; `getRemainingBudget(budget, spent): number`; `getDailyTarget(remaining, daysRemaining): number`; `getCategoryBreakdown(expenses, monthKey): CategoryTotal[]`, where each result has `{ categoryId: string; amount: number; percent: number }`.

- [ ] Add the eight initial Japanese expense categories and typed app state.
- [ ] Implement Tokyo date/month boundaries using `Intl.DateTimeFormat` with explicit `Asia/Tokyo`; avoid parsing a date-only string as UTC.
- [ ] Implement calculation helpers, including zero-budget, no-expense, 80%-threshold, overspending, and whole-yen rounding behavior.
- [ ] Add guarded localStorage reads and writes. On invalid JSON, show a recovery notice and disable writes until the user explicitly chooses to start fresh; do not silently overwrite the stored value.
- [ ] Manually inspect calculations for the PRD example (¥60,000 budget, ¥24,000 spent, 12 days remaining => ¥3,000 daily target) and a Tokyo month boundary.

### Task 3: Implement expense create, edit, delete, and history

**Files:**
- Create: `src/components/ExpenseForm.tsx`, `src/components/ConfirmDialog.tsx`, `src/components/EmptyState.tsx`
- Create: `src/pages/HistoryPage.tsx`
- Modify: `src/App.tsx`, `src/styles.css`

**Interfaces:**
- `ExpenseInput = Pick<Expense, "amount" | "categoryId" | "date" | "note">`; `ExpenseForm` receives `initialExpense?: Expense`, `onSave(input: ExpenseInput): void`, and `onCancel(): void`.
- App actions: `addExpense(input: ExpenseInput): void`, `updateExpense(id: string, input: ExpenseInput): void`, and `deleteExpense(id: string): void`.
- History view receives the expense list and those actions; search is case-insensitive over note text, and category filter matches category ID.

- [ ] Build a labeled Japanese form with amount, category, date (default Tokyo today), and optional note.
- [ ] Reject blank, zero, negative, and fractional amounts near the amount field; preserve entered values if validation fails.
- [ ] Add create and edit flows, with consistent actions and visible save feedback.
- [ ] Add a keyboard-accessible delete confirmation; update persisted state after confirmation.
- [ ] Show newest-first history, note search, category filter, no-record state, and no-result state.
- [ ] Manually confirm that create/edit/delete actions update stored records and that deleting can be cancelled.

### Task 4: Implement home, monthly budgets, analysis, and budget notice

**Files:**
- Create: `src/pages/HomePage.tsx`, `src/pages/AnalysisPage.tsx`, `src/pages/SettingsPage.tsx`
- Modify: `src/App.tsx`, `src/components/AppNavigation.tsx`, `src/styles.css`

**Interfaces:**
- Home receives expenses, current-month budget, derived totals, recent records, and `onAddExpense`.
- Analysis receives the current month's `CategoryTotal[]`.
- Settings receives the selected month budget and `onSaveBudget(monthKey: string, amount: number): void`.
- App stores one budget per `YYYY-MM` key; a new month has no budget until the user sets one.

- [ ] Build the home view with current-month budget progress, remaining daily target, today's and month's totals, recent records, and an add action.
- [ ] Build settings for the current month's whole-yen budget. Do not carry unused budget or copy the prior month's spent/remaining amount.
- [ ] Build labeled category bars with amounts and percentages; show 0% when monthly spending is zero.
- [ ] Persist `budgetWarningShownMonths` and show one in-app warning when monthly spending first reaches 80%; do not repeat it in the same month. Do not use native notifications.
- [ ] Add clear states for no budget, zero budget, 80% reached, exact budget, and overspending; manually verify formula boundaries.

### Task 5: Finish responsive and accessibility polish

**Files:**
- Modify: `src/components/AppNavigation.tsx`, all `src/pages/*.tsx`, `src/components/*.tsx`, `src/styles.css`

- [ ] Check every flow at 375px, 768px, 1024px, and 1440px; fix overflow, clipped dialogs, and hard-to-reach controls.
- [ ] Confirm labels, keyboard order, visible focus, dialog close/cancel behavior, 44px minimum primary touch targets, and text contrast.
- [ ] Confirm reduced-motion behavior and that meaning is never conveyed by color alone.
- [ ] Run `npm run lint`, `npm run typecheck`, and `npm run build`; manually complete the presentation demo flow from budget setup through editing a record.

## Handoff Notes

- Keep the working directory in `expense-tracker-app/`; do not modify the existing Aturu app.
- No automated tests are included in this plan; perform the listed manual checks and project lint/typecheck/build checks.
- If the required Vite/React packages are unavailable offline, report the install blocker before changing stack or using an alternate package source.




