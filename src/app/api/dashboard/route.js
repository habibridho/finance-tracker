import { NextResponse } from 'next/server';
import { db, sqlite } from '@/db';
import * as schema from '@/db/schema';
import '@/db/init';

export async function GET() {
  try {
    // Accounts and Types
    const allAccounts = await db.select().from(schema.accounts);
    const balanceStmt = sqlite.prepare('SELECT COALESCE(SUM(amount), 0) as balance FROM journal_entries WHERE account_id = ?');
    
    let totalAssets = 0;
    let totalLiquidAssets = 0;
    const byType = {};

    for (const acc of allAccounts) {
      const balance = balanceStmt.get(acc.id).balance;
      totalAssets += balance;
      if (acc.isLiquid === 1) {
        totalLiquidAssets += balance;
      }

      if (!byType[acc.type]) {
        byType[acc.type] = { type: acc.type, total: 0, targetPct: acc.targetPct || 0 };
      }
      byType[acc.type].total += balance;
    }

    const accountsByType = Object.values(byType).map(t => ({
      ...t,
      actualPct: totalAssets > 0 ? t.total / totalAssets : 0
    }));

    // Funds
    const allFunds = await db.select().from(schema.funds);
    const fundBalanceStmt = sqlite.prepare('SELECT COALESCE(SUM(amount), 0) as balance FROM journal_entries WHERE fund_id = ?');
    
    let totalFundAllocations = 0;
    const fundSummary = allFunds.map(fund => {
      const balance = fundBalanceStmt.get(fund.id).balance;
      totalFundAllocations += balance;
      return {
        id: fund.id,
        name: fund.name,
        balance,
        target: fund.targetAmount,
        targetDate: fund.targetDate
      };
    });

    const discrepancy = totalAssets - totalFundAllocations;

    // Recent Transactions
    const txns = sqlite.prepare('SELECT * FROM transactions ORDER BY date DESC, created_at DESC LIMIT 10').all();
    const getEntries = sqlite.prepare('SELECT * FROM journal_entries WHERE transaction_id = ?');
    const recentTransactions = txns.map(txn => ({
      ...txn,
      entries: getEntries.all(txn.id)
    }));

    return NextResponse.json({
      totalAssets,
      totalLiquidAssets,
      totalFundAllocations,
      discrepancy,
      accountsByType,
      fundSummary,
      recentTransactions
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
