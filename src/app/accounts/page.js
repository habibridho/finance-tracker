import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import AccountActions from './AccountActions';
import AccountTypeTable from './AccountTypeTable';
import { getAccountsWithBalances } from '@/lib/queries';
import { formatRupiah } from '@/lib/format';
import { getIDXPrice, getAntamPrice, getForexPrice } from '@/lib/marketData';

export default async function AccountsPage() {
  const accounts = getAccountsWithBalances();
  
  let hasStockWithUnits = false;
  let totalMarketValue = 0;
  let liquidMarketValue = 0;
  
  const hasEmas = accounts.some(a => a.type === 'Emas' && a.units && a.units > 0);
  let antamPrice = null;
  if (hasEmas) {
    antamPrice = await getAntamPrice();
  }

  for (const acc of accounts) {
    let accVal = acc.balance;
    if (acc.type === 'Saham' && acc.units && acc.units > 0) {
      hasStockWithUnits = true;
      const price = await getIDXPrice(acc.name);
      if (price !== null) {
        accVal = price * acc.units;
        acc.currentPrice = price;
        acc.todayValue = accVal;
      }
    } else if (acc.type === 'Emas' && acc.units && acc.units > 0) {
      hasStockWithUnits = true;
      if (antamPrice !== null) {
        accVal = antamPrice * acc.units;
        acc.currentPrice = antamPrice;
        acc.todayValue = accVal;
      }
    } else if (acc.type === 'Valas' && acc.units && acc.units > 0) {
      hasStockWithUnits = true;
      const price = await getForexPrice(acc.name);
      if (price !== null) {
        accVal = price * acc.units;
        acc.currentPrice = price;
        acc.todayValue = accVal;
      }
    }
    totalMarketValue += accVal;
    if (acc.is_liquid) {
      liquidMarketValue += accVal;
    }
  }

  const totalAssets = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const liquidAssets = accounts.filter(a => a.is_liquid).reduce((sum, acc) => sum + acc.balance, 0);
  const illiquidAssets = totalAssets - liquidAssets;

  // Group accounts by type
  const groupedByType = {};
  for (const acc of accounts) {
    if (!groupedByType[acc.type]) {
      groupedByType[acc.type] = { type: acc.type, totalBalance: 0, totalTodayValue: 0, count: 0, accounts: [] };
    }
    groupedByType[acc.type].totalBalance += acc.balance;
    groupedByType[acc.type].totalTodayValue += (acc.todayValue !== undefined ? acc.todayValue : acc.balance);
    groupedByType[acc.type].count += 1;
    groupedByType[acc.type].accounts.push(acc);
  }
  const typeGroups = Object.values(groupedByType);

  const renderSummarySubtitle = (marketVal, bookVal) => {
    if (!hasStockWithUnits) return undefined;
    const isHigher = marketVal > bookVal;
    const isLower = marketVal < bookVal;
    const color = isHigher ? 'var(--text-success)' : isLower ? 'var(--text-danger)' : 'var(--text-muted)';
    const icon = isHigher ? '▲ ' : isLower ? '▼ ' : '';

    return (
      <span style={{ color, fontWeight: 500 }}>
        {icon}Today's Value: {formatRupiah(marketVal)}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      <PageHeader 
        title="Accounts" 
        action={<AccountActions mode="add" />} 
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)' }}>
        <StatCard 
          label="Total Assets" 
          value={formatRupiah(totalAssets)} 
          variant="default" 
          subtitle={renderSummarySubtitle(totalMarketValue, totalAssets)}
        />
        <StatCard 
          label="Liquid Assets" 
          value={formatRupiah(liquidAssets)} 
          variant="success" 
          subtitle={renderSummarySubtitle(liquidMarketValue, liquidAssets)}
        />
        <StatCard label="Illiquid Assets" value={formatRupiah(illiquidAssets)} variant="default" />
      </div>

      <AccountTypeTable groups={typeGroups} />
    </div>
  );
}

