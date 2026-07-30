import PageHeader from '@/components/PageHeader';
import FundActions from './FundActions';
import FundsTable from './FundsTable';
import { getFundsWithBalances } from '@/lib/queries';

export default function FundsPage() {
  const allFunds = getFundsWithBalances();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      <PageHeader 
        title="Funds" 
        action={<FundActions mode="add" />} 
      />

      <FundsTable funds={allFunds} />
    </div>
  );
}
