'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import FormField from '@/components/FormField';
import DatePicker from '@/components/DatePicker';
import { useToast } from '@/components/Toast';
import { formatRupiah } from '@/lib/format';

export default function NewTransactionPage() {
  const router = useRouter();
  const toast = useToast();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [type, setType] = useState('EXPENSE');
  
  const [amount, setAmount] = useState('');
  const [saleAmount, setSaleAmount] = useState('');
  const [costBasis, setCostBasis] = useState('');
  const [units, setUnits] = useState('');
  const [fee, setFee] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [fundId, setFundId] = useState('');
  const [toFundId, setToFundId] = useState('');
  
  const [ruleId, setRuleId] = useState('');
  const [allocationLines, setAllocationLines] = useState([]);
  const [liabilityId, setLiabilityId] = useState('');

  const [accounts, setAccounts] = useState([]);
  const [funds, setFunds] = useState([]);
  const [rules, setRules] = useState([]);
  const [liabilities, setLiabilities] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/accounts').then(r => r.json()),
      fetch('/api/funds').then(r => r.json()),
      fetch('/api/distribution-rules').then(r => r.json()),
      fetch('/api/liabilities').then(r => r.json())
    ]).then(([accData, fundData, ruleData, liabilityData]) => {
      const accountsList = accData.accounts || [];
      setAccounts(accountsList);
      setFunds(fundData);
      setRules(ruleData);
      const liabilitiesList = Array.isArray(liabilityData) ? liabilityData : [];
      setLiabilities(liabilitiesList);
      
      if (accountsList.length > 0) {
        setAccountId(accountsList[0].id);
        if (accountsList.length > 1) {
          setToAccountId(accountsList[1].id);
        } else {
          setToAccountId(accountsList[0].id);
        }
      }
      if (fundData.length > 0) setFundId(fundData[0].id);
      if (liabilitiesList.length > 0) setLiabilityId(liabilitiesList[0].id);
    });
  }, []);

  const handleLiabilityChange = (selectedId) => {
    setLiabilityId(selectedId);
    const liability = liabilities.find(l => l.id === selectedId);
    if (liability) {
      if (liability.monthly_payment || liability.monthlyPayment) {
        setAmount(liability.monthly_payment || liability.monthlyPayment);
      }
      if (!description) {
        setDescription(`Pembayaran ${liability.name}`);
      }
    }
  };

  useEffect(() => {
    if ((type === 'INCOME' || type === 'ASSET_SALE' || type === 'DIVIDEND') && ruleId && rules.length > 0) {
      const rule = rules.find(r => r.id == ruleId);
      if (rule && rule.lines) {
        const baseAmount = type === 'ASSET_SALE'
          ? (Number(saleAmount) || 0) - (Number(costBasis) || 0)
          : (Number(amount) || 0);

        const lines = rule.lines.map(line => {
          let lineAmt = 0;
          if (rule.type === 'FIXED') lineAmt = line.fixed_amount;
          else if (rule.type === 'PERCENTAGE') lineAmt = baseAmount * line.percentage;
          
          return {
            fund_id: line.fund_id,
            fund_name: line.fund_name,
            amount: Math.round(lineAmt)
          };
        });
        setAllocationLines(lines);
      }
    } else {
      setAllocationLines([]);
    }
  }, [ruleId, amount, saleAmount, costBasis, type, rules]);

  const handleAllocationChange = (index, newAmount) => {
    const newLines = [...allocationLines];
    newLines[index].amount = Number(newAmount);
    setAllocationLines(newLines);
  };

  const targetDistributableAmount = type === 'ASSET_SALE'
    ? (Number(saleAmount) || 0) - (Number(costBasis) || 0)
    : (Number(amount) || 0);
  const totalAllocated = allocationLines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const unallocated = targetDistributableAmount - totalAllocated;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let entries = [];
    const numAmount = Number(amount);

    if (type === 'EXPENSE' || type === 'LIABILITY_PAYMENT') {
      entries.push({ accountId: accountId, amount: -numAmount });
      entries.push({ fundId: fundId, amount: -numAmount });
    } else if (type === 'INCOME') {
      entries.push({ accountId: accountId, amount: numAmount });
      if (allocationLines.length > 0) {
        allocationLines.forEach(line => {
          if (line.amount !== 0) {
            entries.push({ fundId: line.fund_id, amount: line.amount });
          }
        });
      } else if (fundId) {
        entries.push({ fundId: fundId, amount: numAmount });
      }
    } else if (type === 'ASSET_SALE') {
      const numSaleAmount = Number(saleAmount);
      const numCostBasis = Number(costBasis);
      const gainLoss = numSaleAmount - numCostBasis;

      entries.push({ accountId: accountId, amount: -numCostBasis });
      entries.push({ accountId: toAccountId, amount: numSaleAmount });

      if (gainLoss !== 0) {
        if (allocationLines.length > 0) {
          allocationLines.forEach(line => {
            if (line.amount !== 0) {
              entries.push({ fundId: line.fund_id, amount: line.amount });
            }
          });
        } else if (fundId) {
          entries.push({ fundId: fundId, amount: gainLoss });
        }
      }
    } else if (type === 'ASSET_BUY') {
      const numAmount = Number(amount);
      const numFee = Number(fee) || 0;
      const assetValue = numAmount - numFee;

      entries.push({ accountId: accountId, amount: -numAmount });
      entries.push({ accountId: toAccountId, amount: assetValue });

      if (numFee > 0 && fundId) {
        entries.push({ fundId: fundId, amount: -numFee });
      }
    } else if (type === 'DIVIDEND') {
      entries.push({ accountId: accountId, amount: numAmount });
      if (allocationLines.length > 0) {
        allocationLines.forEach(line => {
          if (line.amount !== 0) {
            entries.push({ fundId: line.fund_id, amount: line.amount });
          }
        });
      } else if (fundId) {
        entries.push({ fundId: fundId, amount: numAmount });
      }
    } else if (type === 'TRANSFER_ACCOUNT') {
      entries.push({ accountId: accountId, amount: -numAmount });
      entries.push({ accountId: toAccountId, amount: numAmount });
    } else if (type === 'TRANSFER_FUND') {
      entries.push({ fundId: fundId, amount: -numAmount });
      entries.push({ fundId: toFundId, amount: numAmount });
    } else if (type === 'ADJUSTMENT') {
      if (accountId) entries.push({ accountId: accountId, amount: numAmount });
      if (fundId) entries.push({ fundId: fundId, amount: numAmount });
    }

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          description,
          type,
          entries,
          liabilityId: type === 'LIABILITY_PAYMENT' ? liabilityId : undefined,
          sourceAccountId: type === 'DIVIDEND' ? toAccountId : (type === 'ASSET_BUY' ? toAccountId : (type === 'ASSET_SALE' ? accountId : undefined)),
          units: (type === 'ASSET_BUY' || type === 'ASSET_SALE') && units ? Number(units) : undefined
        })
      });

      if (!res.ok) throw new Error('Failed to create transaction');
      
      toast.success('Transaction saved');
      router.push('/journal');
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const currentAssetAccount = accounts.find(a => a.id === accountId);
  const currentGainLoss = (Number(saleAmount) || 0) - (Number(costBasis) || 0);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      <PageHeader title="New Transaction" />

      <form onSubmit={handleSubmit} className="card" style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        
        {/* SECTION 1: Transaction Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-md)' }}>
          <FormField label="Date">
            <DatePicker value={date} onChange={setDate} required />
          </FormField>
          
          <FormField label="Description">
            <input type="text" required className="form-input" value={description} onChange={e => setDescription(e.target.value)} />
          </FormField>
        </div>

        <FormField label="Transaction Type">
          <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
            <option value="LIABILITY_PAYMENT">Liability Payment</option>
            <option value="TRANSFER_ACCOUNT">Transfer Between Accounts</option>
            <option value="TRANSFER_FUND">Transfer Between Funds</option>
            <option value="ADJUSTMENT">Adjustment</option>
            <option value="ASSET_SALE">Asset Sale</option>
            <option value="ASSET_BUY">Asset Buy</option>
            <option value="DIVIDEND">Dividend</option>
          </select>
        </FormField>

        {/* SECTION 2: Amounts and Accounts/Funds */}
        <div style={{ padding: 'var(--space-lg)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {type === 'LIABILITY_PAYMENT' && (
            <FormField label="Liability to Pay Off">
              <select className="form-select" value={liabilityId} onChange={e => handleLiabilityChange(e.target.value)}>
                <option value="">Select Liability...</option>
                {liabilities.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.name} (Remaining: {formatRupiah(l.computed_balance ?? l.computedBalance ?? l.initial_balance ?? l.current_balance ?? 0)})
                  </option>
                ))}
              </select>
            </FormField>
          )}

          {type === 'ASSET_SALE' ? (
            <>
              <FormField label="Asset Account (Being Sold)">
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <select className="form-select" style={{ flex: 1 }} value={accountId} onChange={e => setAccountId(e.target.value)}>
                    <option value="">Select Asset Account...</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} (Current: {formatRupiah(a.balance ?? 0)})
                      </option>
                    ))}
                  </select>
                  {currentAssetAccount && currentAssetAccount.balance !== undefined && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}
                      onClick={() => setCostBasis(currentAssetAccount.balance)}
                    >
                      Fill Full Balance
                    </button>
                  )}
                </div>
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)' }}>
                <FormField label="Cost Basis (Book Value Sold)">
                  <input type="number" required className="form-input" value={costBasis} onChange={e => setCostBasis(e.target.value)} placeholder="0" />
                </FormField>

                <FormField label="Sale Amount (Proceeds)">
                  <input type="number" required className="form-input" value={saleAmount} onChange={e => setSaleAmount(e.target.value)} placeholder="0" />
                </FormField>

                <FormField label="Units Sold (Optional)">
                  <input type="number" step="any" className="form-input" value={units} onChange={e => setUnits(e.target.value)} placeholder="0" />
                </FormField>
              </div>

              <FormField label="Destination Cash Account (Receiving Proceeds)">
                <select className="form-select" value={toAccountId} onChange={e => setToAccountId(e.target.value)}>
                  <option value="">Select Destination Account...</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </FormField>

              <div style={{
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-tertiary, rgba(255,255,255,0.05))',
                border: '1px solid var(--border-color)',
                marginTop: 'var(--space-xs)'
              }}>
                <span style={{ fontWeight: '500' }}>
                  {currentGainLoss > 0 ? 'Profit / Capital Gain' : currentGainLoss < 0 ? 'Loss / Capital Loss' : 'Net Gain / Loss'}
                </span>
                <span style={{
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  color: currentGainLoss > 0 ? 'var(--text-success)' : currentGainLoss < 0 ? 'var(--text-danger)' : 'inherit'
                }}>
                  {currentGainLoss > 0 ? '+' : ''}{formatRupiah(currentGainLoss)}
                </span>
              </div>
            </>
          ) : type === 'ASSET_BUY' ? (
            <>
              <FormField label="Source Cash Account (Funded From)">
                <select className="form-select" value={accountId} onChange={e => setAccountId(e.target.value)}>
                  <option value="">Select Cash Account...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Balance: {formatRupiah(a.balance ?? 0)})
                    </option>
                  ))}
                </select>
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)' }}>
                <FormField label="Total Purchase Amount (Inc. Fee)">
                  <input type="number" required className="form-input" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
                </FormField>

                <FormField label="Fee Amount (Optional)">
                  <input type="number" className="form-input" value={fee} onChange={e => setFee(e.target.value)} placeholder="0" />
                </FormField>

                <FormField label="Units Purchased (Optional)">
                  <input type="number" step="any" className="form-input" value={units} onChange={e => setUnits(e.target.value)} placeholder="0" />
                </FormField>
              </div>

              <FormField label="Destination Asset Account (Purchased Asset)">
                <select className="form-select" value={toAccountId} onChange={e => setToAccountId(e.target.value)}>
                  <option value="">Select Asset Account...</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </FormField>

              {Number(fee) > 0 && (
                <FormField label="Fund to Deduct Fee From" hint="Only the fee amount will be deducted from this fund">
                  <select className="form-select" value={fundId} onChange={e => setFundId(e.target.value)}>
                    <option value="">Select Fund...</option>
                    {funds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </FormField>
              )}

              <div style={{
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-tertiary, rgba(255,255,255,0.05))',
                border: '1px solid var(--border-color)',
                marginTop: 'var(--space-xs)'
              }}>
                <span style={{ fontWeight: '500' }}>
                  Net Asset Value (Book Value Added)
                </span>
                <span style={{
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  color: 'var(--text-success)'
                }}>
                  {formatRupiah((Number(amount) || 0) - (Number(fee) || 0))}
                </span>
              </div>
            </>
          ) : type === 'DIVIDEND' ? (
            <>
              <FormField label="Amount">
                <input type="number" required className="form-input" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
              </FormField>

              <FormField label="Cash Account (Receiving Dividend)">
                <select className="form-select" value={accountId} onChange={e => setAccountId(e.target.value)}>
                  <option value="">Select Cash Account...</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </FormField>

              <FormField label="Source Asset Account (Paying Dividend)">
                <select className="form-select" value={toAccountId} onChange={e => setToAccountId(e.target.value)}>
                  <option value="">Select Asset Account...</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </FormField>
            </>
          ) : (
            <>
              <FormField label="Amount">
                <input type="number" required className="form-input" value={amount} onChange={e => setAmount(e.target.value)} />
              </FormField>

              {(type === 'EXPENSE' || type === 'INCOME' || type === 'TRANSFER_ACCOUNT' || type === 'ADJUSTMENT' || type === 'LIABILITY_PAYMENT') && (
                <FormField label={type === 'TRANSFER_ACCOUNT' ? "From Account" : "Account"}>
                  <select className="form-select" value={accountId} onChange={e => setAccountId(e.target.value)}>
                    <option value="">Select Account...</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </FormField>
              )}

              {type === 'TRANSFER_ACCOUNT' && (
                <FormField label="To Account">
                  <select className="form-select" value={toAccountId} onChange={e => setToAccountId(e.target.value)}>
                    <option value="">Select Account...</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </FormField>
              )}

              {(type === 'EXPENSE' || type === 'TRANSFER_FUND' || type === 'LIABILITY_PAYMENT' || (type === 'ADJUSTMENT' && !accountId)) && (
                <FormField label={type === 'TRANSFER_FUND' ? "From Fund" : "Fund"}>
                  <select className="form-select" value={fundId} onChange={e => setFundId(e.target.value)}>
                    <option value="">Select Fund...</option>
                    {funds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </FormField>
              )}

              {type === 'TRANSFER_FUND' && (
                <FormField label="To Fund">
                  <select className="form-select" value={toFundId} onChange={e => setToFundId(e.target.value)}>
                    <option value="">Select Fund...</option>
                    {funds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </FormField>
              )}
            </>
          )}
        </div>

        {/* SECTION 3: Income & Asset Sale Fund Allocation */}
        {(type === 'INCOME' || type === 'ASSET_SALE' || type === 'DIVIDEND') && (
          <div style={{ padding: 'var(--space-lg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <h3 style={{ fontSize: '1.125rem' }}>
              {type === 'ASSET_SALE' ? 'Gain / Loss Fund Allocation' : 'Fund Allocation'}
            </h3>
            
            <FormField label="Distribution Rule (Optional)">
              <select className="form-select" value={ruleId} onChange={e => setRuleId(e.target.value)}>
                <option value="">Manual / Single Fund</option>
                {rules.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </FormField>

            {!ruleId && (
              <FormField label="Fund">
                <select className="form-select" value={fundId} onChange={e => setFundId(e.target.value)}>
                  <option value="">Select Fund...</option>
                  {funds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </FormField>
            )}

            {ruleId && allocationLines.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
                {allocationLines.map((line, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <span style={{ flex: 1 }}>{line.fund_name}</span>
                    <input 
                      type="number" 
                      className="form-input" 
                      style={{ width: '200px' }} 
                      value={line.amount} 
                      onChange={e => handleAllocationChange(idx, e.target.value)} 
                    />
                  </div>
                ))}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-md) 0', borderTop: '1px solid var(--border-color)', marginTop: 'var(--space-sm)', fontWeight: 'bold' }}>
                  <span>Total Allocated</span>
                  <span style={{ color: unallocated !== 0 ? 'var(--text-danger)' : 'var(--text-success)' }}>
                    {formatRupiah(totalAllocated)}
                  </span>
                </div>
                
                {unallocated !== 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-danger)', fontSize: '0.875rem' }}>
                    <span>Unallocated Remaining</span>
                    <span>{formatRupiah(unallocated)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
          <button type="button" className="btn btn-ghost" onClick={() => router.back()}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={(type === 'INCOME' || type === 'ASSET_SALE' || type === 'DIVIDEND') && ruleId && unallocated !== 0}>
            Save Transaction
          </button>
        </div>
      </form>
    </div>
  );
}
