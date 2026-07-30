import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import AmountDisplay from '@/components/AmountDisplay';
import Badge from '@/components/Badge';
import DataTable from '@/components/DataTable';
import StatCard from '@/components/StatCard';
import AccountActions from '../AccountActions';
import { getAccountDetail } from '@/lib/queries';
import { formatDate, formatRupiah } from '@/lib/format';
import { getIDXPrice, getAntamPrice, getForexPrice } from '@/lib/marketData';

const typeColors = {
  'Tabungan': 'blue',
  'Saham': 'purple',
  'Sukuk': 'amber',
  'Reksadana': 'green',
  'P2P': 'red',
  'Emas': 'amber',
  'Valas': 'blue',
  'Properti': 'purple',
  'Mobil': 'purple',
  'Deposito': 'blue'
};

export default async function AccountDetailPage({ params }) {
  const { id } = await params;
  const account = getAccountDetail(id);

  if (!account) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        <Link href="/accounts" className="back-link">
          ← Back to Accounts
        </Link>
        <div className="card" style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-md)' }}>Account Not Found</h2>
          <p className="text-secondary" style={{ marginBottom: 'var(--space-lg)' }}>
            The requested account could not be found or may have been deleted.
          </p>
          <Link href="/accounts" className="btn btn-primary">
            Return to Accounts Page
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
        let badgeVariant = 'default';
        if (row.type === 'INCOME' || row.type === 'DISTRIBUTION') badgeVariant = 'green';
        if (row.type === 'EXPENSE') badgeVariant = 'red';
        if (row.type === 'TRANSFER') badgeVariant = 'blue';
        if (row.type === 'LIABILITY_PAYMENT') badgeVariant = 'purple';
        return <Badge variant={badgeVariant}>{row.type}</Badge>;
      },
    },
    {
      header: 'Amount',
      align: 'right',
      accessor: (row) => (
        <AmountDisplay amount={row.account_amount} showSign={true} />
      ),
    },
  ];

  let currentPrice = null;
  const isAssetType = ['Saham', 'Reksadana', 'Emas', 'Valas'].includes(account.type);
  const hasUnits = account.units !== null && account.units !== undefined && Number(account.units) > 0;

  if (account.type === 'Saham' && hasUnits) {
    currentPrice = await getIDXPrice(account.name);
  } else if (account.type === 'Emas' && hasUnits) {
    currentPrice = await getAntamPrice();
  } else if (account.type === 'Valas' && hasUnits) {
    currentPrice = await getForexPrice(account.name);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      <div>
        <Link href="/accounts" className="back-link" style={{ marginBottom: 'var(--space-md)' }}>
          ← Back to Accounts
        </Link>
        <PageHeader
          title={account.name}
          action={
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <Badge variant={typeColors[account.type] || 'blue'}>
                {account.type}
              </Badge>
              <Badge variant={account.is_liquid ? 'green' : 'amber'}>
                {account.is_liquid ? 'Liquid' : 'Illiquid'}
              </Badge>
              <AccountActions account={account} mode="edit" redirectOnDelete={true} />
            </div>
          }
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-lg)' }}>
        <StatCard
          label="Current Book Balance"
          value={<AmountDisplay amount={account.balance} size="lg" />}
          variant={account.balance >= 0 ? 'success' : 'danger'}
        />
        {hasUnits && isAssetType && (
          <StatCard
            label="Units Held"
            value={account.units.toLocaleString('id-ID')}
            variant="default"
          />
        )}
        {(account.type === 'Saham' || account.type === 'Emas' || account.type === 'Valas') && hasUnits && currentPrice !== null && (() => {
          const todayVal = currentPrice * account.units;
          const diff = todayVal - account.balance;
          const isGain = diff >= 0;
          const unitLabel = account.type === 'Emas' ? 'gr' : account.type === 'Valas' ? account.name.toUpperCase() : 'share';
          return (
            <StatCard
              label="Today's Value"
              value={<AmountDisplay amount={todayVal} size="lg" />}
              variant={isGain ? 'success' : 'danger'}
              subtitle={
                <span style={{ color: isGain ? 'var(--text-success)' : 'var(--text-danger)', fontWeight: 500 }}>
                  {isGain ? '▲ +' : '▼ '}{formatRupiah(diff)} (@ {formatRupiah(currentPrice)}/{unitLabel})
                </span>
              }
            />
          );
        })()}
        <StatCard
          label="Total Inflow"
          value={<AmountDisplay amount={account.totalIn} size="lg" />}
          variant="success"
        />
        <StatCard
          label="Total Outflow"
          value={<AmountDisplay amount={account.totalOut} size="lg" />}
          variant="danger"
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Transaction History</h2>
          <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
            {account.transactions.length} transaction{account.transactions.length === 1 ? '' : 's'}
          </span>
        </div>

        <DataTable
          columns={columns}
          data={account.transactions}
          emptyMessage="No transactions found for this account."
        />
      </div>
    </div>
  );
}
