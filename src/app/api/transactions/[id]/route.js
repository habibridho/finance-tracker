import { NextResponse } from 'next/server';
import { db, sqlite } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';
import '@/db/init';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const txn = await db.select().from(schema.transactions).where(eq(schema.transactions.id, id)).get();
    if (!txn) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    const entries = sqlite.prepare('SELECT * FROM journal_entries WHERE transaction_id = ?').all(id);
    return NextResponse.json({ ...txn, entries });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const txn = sqlite.prepare('SELECT * FROM transactions WHERE id = ?').get(id);

    sqlite.transaction(() => {
      if (txn && txn.units && txn.source_account_id) {
        if (txn.type === 'ASSET_BUY') {
          sqlite.prepare('UPDATE accounts SET units = COALESCE(units, 0) - ? WHERE id = ?').run(txn.units, txn.source_account_id);
        } else if (txn.type === 'ASSET_SALE') {
          sqlite.prepare('UPDATE accounts SET units = COALESCE(units, 0) + ? WHERE id = ?').run(txn.units, txn.source_account_id);
        }
      }
      sqlite.prepare('DELETE FROM journal_entries WHERE transaction_id = ?').run(id);
      sqlite.prepare('DELETE FROM transactions WHERE id = ?').run(id);
    })();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
