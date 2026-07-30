'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Badge from '@/components/Badge';
import AmountDisplay from '@/components/AmountDisplay';
import ProgressBar from '@/components/ProgressBar';
import FundActions from './FundActions';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/format';

export default function FundsTable({ funds = [] }) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState(funds);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  useEffect(() => {
    setItems(funds);
  }, [funds]);

  if (!items || items.length === 0) {
    return (
      <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
        No funds found. Click &quot;Add Fund&quot; to create one.
      </div>
    );
  }

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      handleDragEnd();
      return;
    }

    const reordered = [...items];
    const [movedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, movedItem);

    setItems(reordered);
    handleDragEnd();

    try {
      const payload = reordered.map((item, idx) => ({
        id: item.id,
        sortOrder: idx
      }));

      const res = await fetch('/api/funds/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funds: payload })
      });

      if (!res.ok) {
        throw new Error('Failed to save new order');
      }

      toast.success('Funds reordered');
      router.refresh();
    } catch (err) {
      toast.error(err.message || 'Failed to reorder funds');
      setItems(funds); // revert on error
    }
  };

  // Find index of first inactive fund to show section divider if needed
  const activeCount = items.filter(f => f.is_active).length;
  const inactiveCount = items.length - activeCount;

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}></th>
              <th>Fund Name</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Current Balance</th>
              <th style={{ textAlign: 'right' }}>Target Balance</th>
              <th style={{ width: '220px' }}>Progress</th>
              <th style={{ textAlign: 'center', width: '100px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((fund, index) => {
              const isDragged = draggedIndex === index;
              const isDragOver = dragOverIndex === index;
              const hasTarget = fund.target_amount > 0;
              const showInactiveHeader = !fund.is_active && (index === 0 || items[index - 1].is_active);

              return (
                <tr
                  key={fund.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`${isDragged ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                  style={{ opacity: fund.is_active ? 1 : 0.65 }}
                >
                  <td style={{ textAlign: 'center' }}>
                    <div className="drag-handle" title="Drag to reorder">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="5" cy="4" r="1.2" />
                        <circle cx="11" cy="4" r="1.2" />
                        <circle cx="5" cy="8" r="1.2" />
                        <circle cx="11" cy="8" r="1.2" />
                        <circle cx="5" cy="12" r="1.2" />
                        <circle cx="11" cy="12" r="1.2" />
                      </svg>
                    </div>
                  </td>
                  <td>
                    <Link
                      href={`/funds/${fund.id}`}
                      style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}
                      className="fund-card-title"
                    >
                      {fund.name}
                    </Link>
                  </td>
                  <td>
                    <Badge
                      variant={fund.is_active ? 'badge-green' : 'badge-amber'}
                      label={fund.is_active ? 'Active' : 'Inactive'}
                    />
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    <AmountDisplay amount={fund.balance} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {hasTarget ? (
                      <AmountDisplay amount={fund.target_amount} />
                    ) : (
                      <span className="text-secondary" style={{ fontSize: '0.875rem' }}>—</span>
                    )}
                  </td>
                  <td>
                    {hasTarget ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <span>{Math.round(Math.min(100, Math.max(0, (fund.balance / fund.target_amount) * 100)))}%</span>
                          {fund.target_date && <span>Target: {formatDate(fund.target_date)}</span>}
                        </div>
                        <ProgressBar value={fund.balance} max={fund.target_amount} size="sm" />
                      </div>
                    ) : (
                      <span className="text-secondary" style={{ fontSize: '0.875rem' }}>No target</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <FundActions fund={fund} mode="edit" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
