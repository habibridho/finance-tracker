import PageHeader from '@/components/PageHeader';
import AmountDisplay from '@/components/AmountDisplay';
import ProgressBar from '@/components/ProgressBar';
import LiabilityActions from './LiabilityActions';
import { getLiabilities } from '@/lib/queries';
import { formatDate } from '@/lib/format';

export default function LiabilitiesPage() {
  const liabilities = getLiabilities();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      <PageHeader 
        title="Liabilities" 
        action={<LiabilityActions mode="add" />} 
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--space-lg)' }}>
        {liabilities.map(liability => {
          const remaining = liability.computed_balance ?? liability.initial_balance ?? liability.current_balance ?? 0;
          const original = liability.original_amount ?? 0;
          const initial = liability.initial_balance ?? liability.current_balance ?? original;
          const progress = original > 0 ? (original - remaining) : 0;

          return (
            <div key={liability.id} className="card" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '1.25rem' }}>{liability.name}</h3>
                <LiabilityActions liability={liability} mode="edit" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
                <div>
                  <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Current Balance</p>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-danger)' }}>
                    <AmountDisplay amount={remaining} />
                  </div>
                </div>
                <div>
                  <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Original Balance</p>
                  <div style={{ fontSize: '1.125rem' }}>
                    <AmountDisplay amount={original} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span className="text-secondary">Paid off</span>
                  <span>{((progress / original) * 100).toFixed(1)}%</span>
                </div>
                <ProgressBar value={progress} max={original} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                {liability.interest_rate > 0 && (
                  <div>
                    <span className="text-secondary">Interest: </span>
                    {(liability.interest_rate * 100).toFixed(2)}%
                  </div>
                )}
                {liability.monthly_payment > 0 && (
                  <div>
                    <span className="text-secondary">Monthly: </span>
                    <AmountDisplay amount={liability.monthly_payment} />
                  </div>
                )}
                {liability.start_date && (
                  <div>
                    <span className="text-secondary">Start: </span>
                    {formatDate(liability.start_date)}
                  </div>
                )}
                {liability.end_date && (
                  <div>
                    <span className="text-secondary">End: </span>
                    {formatDate(liability.end_date)}
                  </div>
                )}
              </div>

              {liability.payments && liability.payments.length > 0 && (
                <div style={{ marginTop: 'var(--space-sm)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                  <p className="text-secondary" style={{ fontWeight: '600', marginBottom: 'var(--space-xs)' }}>Payment History</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                    {liability.payments.map((p) => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{formatDate(p.date)} - {p.description}</span>
                        <span style={{ color: 'var(--accent-emerald)', fontWeight: '500' }}>
                          -<AmountDisplay amount={p.payment_amount} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {liabilities.length === 0 && (
        <div className="empty-state">
          <p>No liabilities found. Add one to start tracking your debts.</p>
        </div>
      )}
    </div>
  );
}
