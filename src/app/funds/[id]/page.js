import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import AmountDisplay from '@/components/AmountDisplay';
import ProgressBar from '@/components/ProgressBar';
import Badge from '@/components/Badge';
import DataTable from '@/components/DataTable';
import StatCard from '@/components/StatCard';
import FundActions from '../FundActions';
import FundBalanceChart from '@/components/FundBalanceChart';
import { getFundDetail } from '@/lib/queries';
import { formatDate } from '@/lib/format';

export default async function FundDetailPage({ params }) {
  const { id } = await params;
  const fund = getFundDetail(id);

  if (!fund) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        <Link href="/funds" className="back-link">
          ← Back to Funds
        </Link>
        <div className="card" style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-md)' }}>Fund Not Found</h2>
          <p className="text-secondary" style={{ marginBottom: 'var(--space-lg)' }}>
            The requested fund could not be found or may have been deleted.
          </p>
          <Link href="/funds" className="btn btn-primary">
            Return to Funds Page
          </Link>
        </div>
      </div>
    );
  }

  const columns = [
    {
      header: 'Date',
      accessor: (row) => formatDate(row.date),
    },
    {
      header: 'Description',
      key: 'description',
    },
    {
      header: 'Type',
      accessor: (row) => {
        let badgeVariant = 'badge-default';
        if (row.type === 'INCOME' || row.type === 'DISTRIBUTION') badgeVariant = 'badge-green';
        if (row.type === 'EXPENSE') badgeVariant = 'badge-red';
        if (row.type === 'TRANSFER') badgeVariant = 'badge-blue';
        if (row.type === 'LIABILITY_PAYMENT') badgeVariant = 'badge-purple';
        return <Badge variant={badgeVariant} label={row.type} />;
      },
    },
    {
      header: 'Amount',
      align: 'right',
      accessor: (row) => (
        <AmountDisplay amount={row.fund_amount} showSign={true} />
      ),
    },
  ];

  const hasTarget = fund.target_amount > 0;
  const progressPct = hasTarget ? Math.min(100, Math.max(0, (fund.balance / fund.target_amount) * 100)) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      <div>
        <Link href="/funds" className="back-link" style={{ marginBottom: 'var(--space-md)' }}>
          ← Back to Funds
        </Link>
        <PageHeader
          title={fund.name}
          action={
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <Badge
                variant={fund.is_active ? 'badge-green' : 'badge-amber'}
                label={fund.is_active ? 'Active' : 'Inactive'}
              />
              <FundActions fund={fund} mode="edit" />
            </div>
          }
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-lg)' }}>
        <StatCard
          label="Current Balance"
          value={<AmountDisplay amount={fund.balance} size="lg" />}
          variant={fund.balance >= 0 ? 'success' : 'danger'}
        />
        {hasTarget && (
          <>
            <StatCard
              label="Target Amount"
              value={<AmountDisplay amount={fund.target_amount} size="lg" />}
            />
            <StatCard
              label="Target Progress"
              value={`${progressPct.toFixed(1)}%`}
              subtitle={fund.target_date ? `Target: ${formatDate(fund.target_date)}` : undefined}
              variant={progressPct >= 100 ? 'success' : 'warning'}
            />
          </>
        )}
      </div>

      {hasTarget && (
        <div className="card" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 'var(--space-xs)' }}>
            <span className="text-secondary">Progress toward target</span>
            <span>
              <AmountDisplay amount={fund.balance} /> / <AmountDisplay amount={fund.target_amount} />
            </span>
          </div>
          <ProgressBar value={fund.balance} max={fund.target_amount} size="lg" />
        </div>
      )}

      <FundBalanceChart transactions={fund.transactions} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Transaction History</h2>
          <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
            {fund.transactions.length} transaction{fund.transactions.length === 1 ? '' : 's'}
          </span>
        </div>

        <DataTable
          columns={columns}
          data={fund.transactions}
          emptyMessage="No transactions found for this fund."
        />
      </div>
    </div>
  );
}
