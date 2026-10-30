-- 1. Total pengeluaran per kategori dalam bulan tertentu
SELECT category_id, SUM(amount_jpy) AS total_jpy, COUNT(*) AS jumlah_catatan
FROM expenses
WHERE expense_date >= '2026-10-01' AND expense_date < '2026-11-01'
GROUP BY category_id
ORDER BY total_jpy DESC;

-- 2. Pengeluaran bulanan per bulan
SELECT substr(expense_date, 1, 7) AS month_key, SUM(amount_jpy) AS total_jpy
FROM expenses
GROUP BY month_key
ORDER BY month_key DESC;

-- 3. Lima transaksi terbaru
SELECT expense_date, category_id, amount_jpy, note
FROM expenses
ORDER BY expense_date DESC, created_at DESC
LIMIT 5;

-- 4. Bandingkan anggaran dengan pengeluaran per bulan
SELECT b.month_key, b.amount_jpy AS budget_jpy,
       COALESCE(SUM(e.amount_jpy), 0) AS spent_jpy,
       b.amount_jpy - COALESCE(SUM(e.amount_jpy), 0) AS remaining_jpy
FROM monthly_budgets b
LEFT JOIN expenses e ON substr(e.expense_date, 1, 7) = b.month_key
GROUP BY b.month_key, b.amount_jpy
ORDER BY b.month_key DESC;
