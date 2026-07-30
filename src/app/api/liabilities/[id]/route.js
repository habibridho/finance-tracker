import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';
import '@/db/init';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const liability = await db.select().from(schema.liabilities).where(eq(schema.liabilities.id, id)).get();
    if (!liability) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(liability);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    await db.update(schema.liabilities).set(body).where(eq(schema.liabilities.id, id));
    const updated = await db.select().from(schema.liabilities).where(eq(schema.liabilities.id, id)).get();
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await db.delete(schema.liabilities).where(eq(schema.liabilities.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
