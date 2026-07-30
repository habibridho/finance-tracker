'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function JournalFilters({ currentParams }) {
  const router = useRouter();
  
  const [month, setMonth] = useState(currentParams.month || '');
  const [type, setType] = useState(currentParams.type || '');
  const [accountId, setAccountId] = useState(currentParams.account || '');
  const [fundId, setFundId] = useState(currentParams.fund || '');
  
  const [accounts, setAccounts] = useState([]);
  const [funds, setFunds] = useState([]);

  useEffect(() => {
    fetch('/api/accounts').then(r => r.json()).then(data => setAccounts(data.accounts || []));
    fetch('/api/funds').then(r => r.json()).then(setFunds);
  }, []);

  const handleApply = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (month) params.set('month', month);
    if (type) params.set('type', type);
    if (accountId) params.set('account', accountId);
    if (fundId) params.set('fund', fundId);
    
    router.push(`/journal?${params.toString()}`);
  };

  const handleClear = () => {
    setMonth('');
    setType('');
    setAccountId('');
    setFundId('');
    router.push('/journal');
  };

  return (
    <form onSubmit={handleApply} className="card" style={{ padding: 'var(--space-md)', display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <label className="text-secondary" style={{ fontSize: '0.875rem' }}>Month</label>
        <input type="month" className="form-input" value={month} onChange={e => setMonth(e.target.value)} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <label className="text-secondary" style={{ fontSize: '0.875rem' }}>Type</label>
        <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
          <option value="">All Types</option>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
          <option value="TRANSFER_ACCOUNT">Transfer (Account)</option>
          <option value="TRANSFER_FUND">Transfer (Fund)</option>
          <option value="ADJUSTMENT">Adjustment</option>
          <option value="LIABILITY_PAYMENT">Liability Payment</option>
          <option value="ASSET_SALE">Asset Sale</option>
          <option value="ASSET_BUY">Asset Buy</option>
          <option value="DIVIDEND">Dividend</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <label className="text-secondary" style={{ fontSize: '0.875rem' }}>Account</label>
        <select className="form-select" value={accountId} onChange={e => setAccountId(e.target.value)}>
          <option value="">All Accounts</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <label className="text-secondary" style={{ fontSize: '0.875rem' }}>Fund</label>
        <select className="form-select" value={fundId} onChange={e => setFundId(e.target.value)}>
          <option value="">All Funds</option>
          {funds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginLeft: 'auto' }}>
        <button type="button" className="btn btn-ghost" onClick={handleClear}>Clear</button>
        <button type="submit" className="btn btn-primary">Apply Filters</button>
      </div>
    </form>
  );
}
