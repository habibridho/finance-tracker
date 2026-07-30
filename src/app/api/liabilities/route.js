import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { v4 as uuidv4 } from 'uuid';
import '@/db/init';

import { sqlite } from '@/db';

export async function GET() {
  try {
    const allLiabilities = sqlite.prepare(`
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
    return NextResponse.json(allLiabilities);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const newId = uuidv4();
    const newLiability = {
      id: newId,
      name: body.name,
      originalAmount: body.originalAmount,
      initialBalance: body.initialBalance !== undefined ? body.initialBalance : body.originalAmount,
      interestRate: body.interestRate || null,
      monthlyPayment: body.monthlyPayment || null,
      startDate: body.startDate || null,
      endDate: body.endDate || null
    };
    
    await db.insert(schema.liabilities).values(newLiability);
    return NextResponse.json(newLiability, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
