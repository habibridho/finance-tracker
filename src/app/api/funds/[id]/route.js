import { NextResponse } from 'next/server';
import { db, sqlite } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';
import '@/db/init';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const fund = await db.select().from(schema.funds).where(eq(schema.funds.id, id)).get();
    if (!fund) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    const balance = sqlite.prepare('SELECT COALESCE(SUM(amount), 0) as balance FROM journal_entries WHERE fund_id = ?').get(id).balance;
    return NextResponse.json({ ...fund, balance });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    await db.update(schema.funds).set(body).where(eq(schema.funds.id, id));
    const updated = await db.select().from(schema.funds).where(eq(schema.funds.id, id)).get();
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await db.delete(schema.funds).where(eq(schema.funds.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
