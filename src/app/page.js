import StatCard from '@/components/StatCard';
import AmountDisplay from '@/components/AmountDisplay';
import ProgressBar from '@/components/ProgressBar';
import Badge from '@/components/Badge';
import DataTable from '@/components/DataTable';
import DashboardCharts from './DashboardCharts';
import { getDashboardData } from '@/lib/queries';
import { formatDate, formatRupiah } from '@/lib/format';

export default function Dashboard() {
  const data = getDashboardData();
  const lastUpdated = new Date().toISOString();

  const transactionColumns = [
    { header: 'Date', accessor: (row) => formatDate(row.date) },
    { header: 'Description', accessor: 'description' },
    { 
      header: 'Type', 
      accessor: (row) => {
        const typeColors = {
          'INCOME': 'badge-green',
          'EXPENSE': 'badge-red',
          'TRANSFER_ACCOUNT': 'badge-blue',
          'TRANSFER_FUND': 'badge-purple',
          'ADJUSTMENT': 'badge-amber',
          'LIABILITY_PAYMENT': 'badge-orange',
          'ASSET_SALE': 'badge-cyan',
          'ASSET_BUY': 'badge-teal',
          'DIVIDEND': 'badge-emerald'
        };
        return <Badge variant={typeColors[row.type] || 'badge-blue'} label={row.type} />;
      } 
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      <div className="page-header" style={{ marginBottom: '0' }}>
        <div>
          <h1>Dashboard</h1>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
            Last updated: {formatDate(lastUpdated)}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)' }}>
        <StatCard label="Total Assets" value={formatRupiah(data.totalAssets)} variant="default" />
        <StatCard label="Liquid Assets" value={formatRupiah(data.totalLiquid)} variant="success" />
        <StatCard label="Fund Allocations" value={formatRupiah(data.totalFunds)} variant="default" />
        <StatCard 
          label="Discrepancy" 
          value={formatRupiah(data.discrepancy)} 
          variant={data.discrepancy === 0 ? 'success' : 'danger'} 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
        <div className="card" style={{ padding: 'var(--space-lg)' }}>
          <h2 style={{ marginBottom: 'var(--space-lg)', fontSize: '1.25rem' }}>Account Allocation</h2>
          <DashboardCharts accountsByType={data.accountsByType} />
        </div>

        <div className="card" style={{ padding: 'var(--space-lg)' }}>
          <h2 style={{ marginBottom: 'var(--space-lg)', fontSize: '1.25rem' }}>Fund Summary</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {data.funds.slice(0, 5).map(fund => (
              <div key={fund.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '500' }}>{fund.name}</span>
                  <AmountDisplay amount={fund.balance} />
                </div>
                {fund.target_amount > 0 && (
                  <ProgressBar value={fund.balance} max={fund.target_amount} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--space-lg)' }}>
        <h2 style={{ marginBottom: 'var(--space-lg)', fontSize: '1.25rem' }}>Recent Transactions</h2>
        {data.recentTxns.length > 0 ? (
          <DataTable columns={transactionColumns} data={data.recentTxns} />
        ) : (
          <p className="text-secondary text-center" style={{ padding: 'var(--space-xl)' }}>No recent transactions.</p>
        )}
      </div>
    </div>
  );
}
