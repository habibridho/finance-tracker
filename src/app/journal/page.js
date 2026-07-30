import PageHeader from '@/components/PageHeader';
import JournalFilters from './JournalFilters';
import JournalTable from './JournalTable';
import { sqlite } from '@/db';
import Link from 'next/link';

export default async function JournalPage({ searchParams }) {
  const { month, type, account, fund } = await searchParams;
  
  let query = 'SELECT * FROM transactions WHERE 1=1';
  let params = [];
  
  if (month) {
    query += " AND strftime('%Y-%m', date) = ?";
    params.push(month);
  }
  
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  
  if (account || fund) {
    query += ` AND (id IN (
      SELECT transaction_id FROM journal_entries 
      WHERE 1=1 
      ${account ? 'AND account_id = ?' : ''}
      ${fund ? 'AND fund_id = ?' : ''}
    )${account && !fund ? ' OR source_account_id = ?' : ''})`;
    if (account) params.push(account);
    if (fund) params.push(fund);
    if (account && !fund) params.push(account);
  }
  
  query += ' ORDER BY date DESC, created_at DESC LIMIT 100';
  
  const txns = sqlite.prepare(query).all(...params);
  
  for (const txn of txns) {
    txn.entries = sqlite.prepare(`
      SELECT je.*, a.name as account_name, f.name as fund_name
      FROM journal_entries je
      LEFT JOIN accounts a ON a.id = je.account_id
      LEFT JOIN funds f ON f.id = je.fund_id
      WHERE je.transaction_id = ?
    `).all(txn.id);

    if (txn.source_account_id) {
      const sourceAcc = sqlite.prepare('SELECT name FROM accounts WHERE id = ?').get(txn.source_account_id);
      txn.source_account_name = sourceAcc?.name || null;
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      <PageHeader 
        title="Journal" 
        action={<Link href="/transactions/new" className="btn btn-primary">New Transaction</Link>} 
      />

      <JournalFilters currentParams={{ month, type, account, fund }} />

      {txns.length > 0 ? (
        <JournalTable transactions={txns} />
      ) : (
        <div className="card">
          <p className="text-secondary text-center" style={{ padding: 'var(--space-xl)' }}>No transactions found for the given filters.</p>
        </div>
      )}
    </div>
  );
}
