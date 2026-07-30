import { sqlite } from '@/db';
import { initDatabase } from '@/db/init';

// Ensure DB is initialized
initDatabase();

export function getAccountsWithBalances() {
  return sqlite.prepare(`
    SELECT a.*, COALESCE(SUM(je.amount), 0) as balance
    FROM accounts a
    LEFT JOIN journal_entries je ON je.account_id = a.id
    GROUP BY a.id
    ORDER BY a.sort_order, a.name
  `).all();
}

export function getFundsWithBalances() {
  return sqlite.prepare(`
    SELECT f.*, COALESCE(SUM(je.amount), 0) as balance
    FROM funds f
    LEFT JOIN journal_entries je ON je.fund_id = f.id
    GROUP BY f.id
    ORDER BY f.sort_order, f.name
  `).all();
}

export function getRecentTransactions(limit = 10) {
  const txns = sqlite.prepare(`
    SELECT * FROM transactions ORDER BY date DESC, created_at DESC LIMIT ?
  `).all(limit);
  
  for (const txn of txns) {
    txn.entries = sqlite.prepare(`
      SELECT je.*, a.name as account_name, f.name as fund_name
      FROM journal_entries je
      LEFT JOIN accounts a ON a.id = je.account_id
      LEFT JOIN funds f ON f.id = je.fund_id
      WHERE je.transaction_id = ?
    `).all(txn.id);
  }
  return txns;
}

export function getDashboardData() {
  const accounts = getAccountsWithBalances();
  const funds = getFundsWithBalances();
  const recentTxns = getRecentTransactions(10);
  
  const totalAssets = accounts.reduce((s, a) => s + a.balance, 0);
  const totalLiquid = accounts.filter(a => a.is_liquid).reduce((s, a) => s + a.balance, 0);
  const totalFunds = funds.reduce((s, f) => s + f.balance, 0);
  const discrepancy = totalLiquid - totalFunds;
  
  // Group by type
  const targetPcts = {
    'Tabungan': 0.10, 'Saham': 0.30, 'Deposito': 0.05, 'Sukuk': 0.20,
    'Reksadana': 0.09, 'P2P': 0.25, 'Emas': 0.01
  };
  const byType = {};
  accounts.filter(a => a.is_liquid).forEach(a => {
    if (!byType[a.type]) byType[a.type] = 0;
    byType[a.type] += a.balance;
  });
  const accountsByType = Object.entries(byType).map(([type, total]) => ({
    type, total,
    targetPct: targetPcts[type] || 0,
    actualPct: totalLiquid > 0 ? total / totalLiquid : 0
  }));
  
  return { totalAssets, totalLiquid, totalFunds, discrepancy, accountsByType, funds, recentTxns };
}

export function getDistributionRules() {
  const rules = sqlite.prepare('SELECT * FROM distribution_rules ORDER BY is_default DESC, name').all();
  for (const rule of rules) {
    rule.lines = sqlite.prepare(`
      SELECT dl.*, f.name as fund_name
      FROM distribution_lines dl
      JOIN funds f ON f.id = dl.fund_id
      WHERE dl.rule_id = ?
      ORDER BY dl.sort_order
    `).all(rule.id);
  }
  return rules;
}

export function getLiabilities() {
  const liabilities = sqlite.prepare(`
    SELECT l.*,
           l.initial_balance - COALESCE(
             (SELECT SUM(ABS(je.amount))
              FROM transactions t
              JOIN journal_entries je ON je.transaction_id = t.id AND je.account_id IS NOT NULL
              WHERE t.liability_id = l.id AND t.type = 'LIABILITY_PAYMENT'),
             0
           ) as computed_balance
    FROM liabilities l
    ORDER BY l.name
  `).all();
  for (const liability of liabilities) {
    liability.payments = sqlite.prepare(`
      SELECT t.*, 
             COALESCE(
               (SELECT ABS(je.amount) FROM journal_entries je WHERE je.transaction_id = t.id AND je.account_id IS NOT NULL LIMIT 1),
               0
             ) as payment_amount
      FROM transactions t
      WHERE t.liability_id = ?
      ORDER BY t.date DESC, t.created_at DESC
    `).all(liability.id);
  }
  return liabilities;
}

export function getFundDetail(id) {
  const fund = sqlite.prepare(`
    SELECT f.*, COALESCE(SUM(je.amount), 0) as balance
    FROM funds f
    LEFT JOIN journal_entries je ON je.fund_id = f.id
    WHERE f.id = ?
    GROUP BY f.id
  `).get(id);

  if (!fund) return null;

  const transactions = sqlite.prepare(`
    SELECT t.*, je.amount as fund_amount
    FROM transactions t
    JOIN journal_entries je ON je.transaction_id = t.id AND je.fund_id = ?
    ORDER BY t.date DESC, t.created_at DESC
  `).all(id);

  return { ...fund, transactions };
}

export function getAccountDetail(id) {
  const account = sqlite.prepare(`
    SELECT a.*, COALESCE(SUM(je.amount), 0) as balance
    FROM accounts a
    LEFT JOIN journal_entries je ON je.account_id = a.id
    WHERE a.id = ?
    GROUP BY a.id
  `).get(id);

  if (!account) return null;

  const transactions = sqlite.prepare(`
    SELECT t.*, je.amount as account_amount
    FROM transactions t
    JOIN journal_entries je ON je.transaction_id = t.id AND je.account_id = ?
    ORDER BY t.date DESC, t.created_at DESC
  `).all(id);

  const totals = sqlite.prepare(`
    SELECT 
      COALESCE(SUM(CASE WHEN je.amount > 0 THEN je.amount ELSE 0 END), 0) as total_in,
      COALESCE(SUM(CASE WHEN je.amount < 0 THEN ABS(je.amount) ELSE 0 END), 0) as total_out
    FROM journal_entries je
    WHERE je.account_id = ?
  `).get(id);

  return { 
    ...account, 
    transactions, 
    totalIn: totals.total_in, 
    totalOut: totals.total_out 
  };
}


