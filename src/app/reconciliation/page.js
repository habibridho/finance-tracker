import PageHeader from '@/components/PageHeader';
import AmountDisplay from '@/components/AmountDisplay';
import { getAccountsWithBalances, getFundsWithBalances } from '@/lib/queries';

export default function ReconciliationPage() {
  const accounts = getAccountsWithBalances().filter(a => a.is_liquid);
  const funds = getFundsWithBalances();

  const totalAccounts = accounts.reduce((s, a) => s + a.balance, 0);
  const totalFunds = funds.reduce((s, f) => s + f.balance, 0);
  const discrepancy = totalAccounts - totalFunds;
  
  const isBalanced = discrepancy === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      <PageHeader title="Reconciliation" />

      <div className="card" style={{ 
        padding: 'var(--space-xl)', 
        textAlign: 'center',
        background: isBalanced ? 'var(--bg-success)' : 'var(--bg-danger)',
        color: isBalanced ? 'var(--text-success)' : 'var(--text-danger)',
        border: `1px solid ${isBalanced ? 'var(--border-success)' : 'var(--border-danger)'}`
      }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          {isBalanced ? 'Balanced! ✓' : 'Discrepancy Detected'}
        </h2>
        {!isBalanced && (
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            Diff: <AmountDisplay amount={discrepancy} />
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
        
        {/* Left Column: Accounts */}
        <div className="card" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-md)', paddingBottom: 'var(--space-sm)', borderBottom: '1px solid var(--border-color)' }}>By Account (Liquid Only)</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
            {accounts.map(acc => (
              <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{acc.name}</span>
                <AmountDisplay amount={acc.balance} />
              </div>
            ))}
          </div>
          
          <div style={{ 
            display: 'flex', justifyContent: 'space-between', 
            marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', 
            borderTop: '2px solid var(--border-color)',
            fontSize: '1.125rem', fontWeight: 'bold',
            color: isBalanced ? 'var(--text-success)' : 'var(--text-danger)'
          }}>
            <span>Total Liquid Assets</span>
            <AmountDisplay amount={totalAccounts} />
          </div>
        </div>

        {/* Right Column: Funds */}
        <div className="card" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-md)', paddingBottom: 'var(--space-sm)', borderBottom: '1px solid var(--border-color)' }}>By Fund</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
            {funds.map(fund => (
              <div key={fund.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{fund.name}</span>
                <AmountDisplay amount={fund.balance} />
              </div>
            ))}
          </div>
          
          <div style={{ 
            display: 'flex', justifyContent: 'space-between', 
            marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', 
            borderTop: '2px solid var(--border-color)',
            fontSize: '1.125rem', fontWeight: 'bold',
            color: isBalanced ? 'var(--text-success)' : 'var(--text-danger)'
          }}>
            <span>Total Fund Allocations</span>
            <AmountDisplay amount={totalFunds} />
          </div>
        </div>

      </div>
    </div>
  );
}
