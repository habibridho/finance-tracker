import { NextResponse } from 'next/server';
import { db, sqlite } from '@/db';
import * as schema from '@/db/schema';
import { v4 as uuidv4 } from 'uuid';
import '@/db/init'; // Ensure DB is initialized

export async function GET() {
  try {
    const allAccounts = await db.select().from(schema.accounts);
    const balanceStmt = sqlite.prepare('SELECT COALESCE(SUM(amount), 0) as balance FROM journal_entries WHERE account_id = ?');
    
    let totalBalance = 0;
    const enrichedAccounts = allAccounts.map(account => {
      const balance = balanceStmt.get(account.id).balance;
      totalBalance += balance;
      return { ...account, balance };
    });

    const byType = {};
    for (const acc of enrichedAccounts) {
      if (!byType[acc.type]) {
        byType[acc.type] = { type: acc.type, total: 0 };
      }
      byType[acc.type].total += acc.balance;
    }

    const typeSummary = Object.values(byType).map(t => ({
      ...t,
      actualPct: totalBalance > 0 ? t.total / totalBalance : 0
    }));

    return NextResponse.json({ accounts: enrichedAccounts, typeSummary });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const newId = uuidv4();
    const newAccount = {
      id: newId,
      name: body.name,
      type: body.type,
      isLiquid: body.isLiquid !== undefined ? body.isLiquid : 1,
      targetPct: body.targetPct || null,
      units: body.units || null,
      awardValue: body.awardValue || null,
      sortOrder: body.sortOrder || 0
    };
    
    await db.insert(schema.accounts).values(newAccount);
    return NextResponse.json(newAccount, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
