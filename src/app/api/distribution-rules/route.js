import { NextResponse } from 'next/server';
import { db, sqlite } from '@/db';
import * as schema from '@/db/schema';
import { v4 as uuidv4 } from 'uuid';
import '@/db/init';

export async function GET() {
  try {
    const rules = sqlite.prepare('SELECT * FROM distribution_rules').all();
    const getLines = sqlite.prepare(`
      SELECT dl.*, f.name as fundName 
      FROM distribution_lines dl 
      JOIN funds f ON dl.fund_id = f.id 
      WHERE dl.rule_id = ?
    `);

    const enrichedRules = rules.map(rule => ({
      ...rule,
      lines: getLines.all(rule.id)
    }));

    return NextResponse.json(enrichedRules);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const ruleId = uuidv4();
    
    let result = null;
    sqlite.transaction(() => {
      sqlite.prepare('INSERT INTO distribution_rules (id, name, type, total_amount, is_default) VALUES (?, ?, ?, ?, ?)').run(
        ruleId, body.name, body.type, body.totalAmount || null, body.isDefault ? 1 : 0
      );
      
      const insertLine = sqlite.prepare('INSERT INTO distribution_lines (id, rule_id, fund_id, fixed_amount, percentage, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
      for (const [index, line] of (body.lines || []).entries()) {
        insertLine.run(
          uuidv4(),
          ruleId,
          line.fundId,
          line.fixedAmount || null,
          line.percentage || null,
          line.sortOrder || index
        );
      }
      result = { id: ruleId, ...body };
    })();
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
