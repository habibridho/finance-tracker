'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Badge from '@/components/Badge';
import AmountDisplay from '@/components/AmountDisplay';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/format';

export default function JournalTable({ transactions }) {
  const router = useRouter();
  const toast = useToast();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/transactions/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      toast.success('Transaction deleted successfully');
      router.refresh();
    } catch (err) {
      toast.error(err.message || 'Failed to delete transaction');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Details</th>
                <th style={{ textAlign: 'center', width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((row) => (
                <tr key={row.id}>
                  <td>{formatDate(row.date)}</td>
                  <td>{row.description}</td>
                  <td>
                    <Badge variant={typeColors[row.type] || 'badge-blue'} label={row.type} />
                  </td>
                  <td>
                    <AmountDisplay amount={Math.max(...row.entries.map(e => Math.abs(e.amount)))} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                      {row.source_account_name && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary, #94a3b8)', fontStyle: 'italic' }}>
                          From asset: {row.source_account_name}
                        </div>
                      )}
                      {row.entries.map((e, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: 'var(--text-secondary)' }}>
                          <span>{e.account_name || e.fund_name}</span>
                          <span style={{ color: e.amount > 0 ? 'var(--text-success)' : e.amount < 0 ? 'var(--text-danger)' : 'inherit' }}>
                            {e.amount > 0 ? '+' : ''}{e.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn btn-ghost btn-icon btn-sm journal-delete-btn"
                      title="Delete transaction"
                      onClick={() => setDeleteTarget(row)}
                      aria-label={`Delete transaction: ${row.description}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5.5 2H10.5M2 4H14M12.6667 4L12.1111 12.0712C12.0482 12.9504 11.3076 13.6364 10.4261 13.6364H5.57394C4.69237 13.6364 3.95178 12.9504 3.88889 12.0712L3.33333 4M6.44444 7.09091V10.5455M9.55556 7.09091V10.5455" 
                          stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Transaction"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.description}"? This will remove the transaction and all its journal entries. This action cannot be undone.`
            : ''
        }
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        variant="danger"
      />
    </>
  );
}
