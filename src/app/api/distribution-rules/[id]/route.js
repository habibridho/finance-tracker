import { NextResponse } from 'next/server';
import { db, sqlite } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import '@/db/init';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const rule = sqlite.prepare('SELECT * FROM distribution_rules WHERE id = ?').get(id);
    if (!rule) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    const lines = sqlite.prepare(`
      SELECT dl.*, f.name as fundName 
      FROM distribution_lines dl 
      JOIN funds f ON dl.fund_id = f.id 
      WHERE dl.rule_id = ?
    `).all(id);
    
    return NextResponse.json({ ...rule, lines });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    sqlite.transaction(() => {
      sqlite.prepare('UPDATE distribution_rules SET name = ?, type = ?, total_amount = ?, is_default = ? WHERE id = ?').run(
        body.name, body.type, body.totalAmount || null, body.isDefault ? 1 : 0, id
      );
      
      if (body.lines) {
        sqlite.prepare('DELETE FROM distribution_lines WHERE rule_id = ?').run(id);
        const insertLine = sqlite.prepare('INSERT INTO distribution_lines (id, rule_id, fund_id, fixed_amount, percentage, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
        for (const [index, line] of body.lines.entries()) {
          insertLine.run(
            uuidv4(),
            id,
            line.fundId,
            line.fixedAmount || null,
            line.percentage || null,
            line.sortOrder || index
          );
        }
      }
    })();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    sqlite.prepare('DELETE FROM distribution_rules WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
