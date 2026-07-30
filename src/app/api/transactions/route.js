import { NextResponse } from 'next/server';
import { db, sqlite } from '@/db';
import * as schema from '@/db/schema';
import { v4 as uuidv4 } from 'uuid';
import '@/db/init';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const accountId = searchParams.get('accountId');
    const fundId = searchParams.get('fundId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = 'SELECT * FROM transactions WHERE 1=1';
    const params = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (from) {
      query += ' AND date >= ?';
      params.push(from);
    }
    if (to) {
      query += ' AND date <= ?';
      params.push(to);
    }
    
    if (accountId || fundId) {
      query += ' AND id IN (SELECT transaction_id FROM journal_entries WHERE 1=1';
      if (accountId) {
        query += ' AND account_id = ?';
        params.push(accountId);
      }
      if (fundId) {
        query += ' AND fund_id = ?';
        params.push(fundId);
      }
      query += ')';
    }

    query += ' ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const txns = sqlite.prepare(query).all(...params);
    
    const getEntries = sqlite.prepare('SELECT * FROM journal_entries WHERE transaction_id = ?');
    
    const transactionsWithEntries = txns.map(txn => ({
      ...txn,
      entries: getEntries.all(txn.id)
    }));

    return NextResponse.json(transactionsWithEntries);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const txnId = uuidv4();
    
    let result = null;
    sqlite.transaction(() => {
      sqlite.prepare('INSERT INTO transactions (id, date, description, type, liability_id, source_account_id, units) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        txnId, body.date, body.description, body.type, body.liabilityId || null, body.sourceAccountId || null, body.units || null
      );
      
      const insertEntry = sqlite.prepare('INSERT INTO journal_entries (id, transaction_id, account_id, fund_id, amount) VALUES (?, ?, ?, ?, ?)');
      for (const entry of body.entries) {
        insertEntry.run(
          uuidv4(),
          txnId,
          entry.accountId || null,
          entry.fundId || null,
          entry.amount
        );
      }

      if (body.units && body.sourceAccountId) {
        if (body.type === 'ASSET_BUY') {
          sqlite.prepare('UPDATE accounts SET units = COALESCE(units, 0) + ? WHERE id = ?').run(
            body.units, body.sourceAccountId
          );
        } else if (body.type === 'ASSET_SALE') {
          sqlite.prepare('UPDATE accounts SET units = COALESCE(units, 0) - ? WHERE id = ?').run(
            body.units, body.sourceAccountId
          );
        }
      }

      result = { id: txnId, ...body };
    })();
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
