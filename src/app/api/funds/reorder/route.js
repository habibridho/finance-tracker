import { NextResponse } from 'next/server';
import { sqlite } from '@/db';
import '@/db/init';

export async function PUT(request) {
  try {
    const { funds } = await request.json();
    if (!Array.isArray(funds)) {
      return NextResponse.json({ error: 'Invalid payload, expected array of funds' }, { status: 400 });
    }

    const stmt = sqlite.prepare('UPDATE funds SET sort_order = ? WHERE id = ?');
    const updateMany = sqlite.transaction((items) => {
      for (const item of items) {
        stmt.run(item.sortOrder, item.id);
      }
    });

    updateMany(funds);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
