import PageHeader from '@/components/PageHeader';
import Badge from '@/components/Badge';
import AmountDisplay from '@/components/AmountDisplay';
import DistributionActions from './DistributionActions';
import { getDistributionRules } from '@/lib/queries';

export default function DistributionPage() {
  const rules = getDistributionRules();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      <PageHeader 
        title="Distribution Rules" 
        action={<DistributionActions mode="add" />} 
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 'var(--space-lg)' }}>
        {rules.map(rule => (
          <div key={rule.id} className="card" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {rule.name}
                  {rule.is_default === 1 && <Badge variant="badge-green" label="Default" />}
                </h3>
                <Badge 
                  variant={rule.type === 'FIXED' ? 'badge-blue' : 'badge-purple'} 
                  label={rule.type} 
                />
              </div>
              <DistributionActions rule={rule} mode="edit" />
            </div>

            <div style={{ marginTop: 'var(--space-md)' }}>
              <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>Allocations</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {rule.lines.map((line, idx) => (
                  <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span>{line.fund_name}</span>
                    <span style={{ fontWeight: '500' }}>
                      {rule.type === 'FIXED' 
                        ? <AmountDisplay amount={line.fixed_amount} /> 
                        : `${(line.percentage * 100).toFixed(1)}%`}
                    </span>
                  </li>
                ))}
              </ul>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 'bold', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <span>Total</span>
                <span>
                  {rule.type === 'FIXED'
                    ? <AmountDisplay amount={rule.lines.reduce((s, l) => s + l.fixed_amount, 0)} />
                    : `${(rule.lines.reduce((s, l) => s + l.percentage, 0) * 100).toFixed(1)}%`}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
