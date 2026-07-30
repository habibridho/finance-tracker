import { NextResponse } from 'next/server';
import { db, sqlite } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';
import '@/db/init';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const account = await db.select().from(schema.accounts).where(eq(schema.accounts.id, id)).get();
    if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    const balance = sqlite.prepare('SELECT COALESCE(SUM(amount), 0) as balance FROM journal_entries WHERE account_id = ?').get(id).balance;
    return NextResponse.json({ ...account, balance });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Guard: prevent direct units modification if account already has units
    if (body.units !== undefined && body.units !== null) {
      const existing = await db.select().from(schema.accounts).where(eq(schema.accounts.id, id)).get();
      if (existing && existing.units !== null && existing.units !== undefined && Number(existing.units) > 0 && Number(body.units) !== Number(existing.units)) {
        return NextResponse.json(
          { error: 'Units can only be modified through transactions once initially set' },
          { status: 400 }
        );
      }
    }

    await db.update(schema.accounts).set(body).where(eq(schema.accounts.id, id));
    const updated = await db.select().from(schema.accounts).where(eq(schema.accounts.id, id)).get();
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await db.delete(schema.accounts).where(eq(schema.accounts.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
