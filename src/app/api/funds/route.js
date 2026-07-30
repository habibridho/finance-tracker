import { NextResponse } from 'next/server';
import { db, sqlite } from '@/db';
import * as schema from '@/db/schema';
import { v4 as uuidv4 } from 'uuid';
import '@/db/init';

export async function GET() {
  try {
    const allFunds = await db.select().from(schema.funds);
    const balanceStmt = sqlite.prepare('SELECT COALESCE(SUM(amount), 0) as balance FROM journal_entries WHERE fund_id = ?');
    
    const enrichedFunds = allFunds.map(fund => {
      const balance = balanceStmt.get(fund.id).balance;
      return { ...fund, balance };
    });

    return NextResponse.json(enrichedFunds);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const newId = uuidv4();
    const newFund = {
      id: newId,
      name: body.name,
      targetAmount: body.targetAmount || null,
      targetDate: body.targetDate || null,
      isActive: body.isActive !== undefined ? body.isActive : 1,
      sortOrder: body.sortOrder || 0
    };
    
    await db.insert(schema.funds).values(newFund);
    return NextResponse.json(newFund, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
