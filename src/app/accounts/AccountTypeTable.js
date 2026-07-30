'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Badge from '@/components/Badge';
import AmountDisplay from '@/components/AmountDisplay';
import AccountActions from './AccountActions';
import { formatRupiah } from '@/lib/format';

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

export default function AccountTypeTable({ groups }) {
  const [expandedType, setExpandedType] = useState(null);

  const toggle = (type) => {
    setExpandedType(prev => prev === type ? null : type);
  };

  if (!groups || groups.length === 0) {
    return (
      <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
        No accounts available
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Type / Account</th>
              <th>Accounts / Liquid</th>
              <th>Target %</th>
              <th>Balance</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              const isExpanded = expandedType === group.type;
              const totalTargetPct = group.accounts.reduce((sum, a) => sum + (a.target_pct || 0), 0);
              const hasGroupTodayValue = group.accounts.some(a => a.todayValue !== undefined);

              const renderTodaySubtitle = (todayVal, bookVal) => {
                if (todayVal === undefined || todayVal === null) return null;
                const isHigher = todayVal > bookVal;
                const isLower = todayVal < bookVal;
                const color = isHigher ? 'var(--text-success)' : isLower ? 'var(--text-danger)' : 'var(--text-muted)';
                const icon = isHigher ? '▲ ' : isLower ? '▼ ' : '';

                return (
                  <div style={{ fontSize: '0.75rem', color, marginTop: '2px', fontWeight: 500 }}>
                    {icon}Today: {formatRupiah(todayVal)}
                  </div>
                );
              };

              return (
                <React.Fragment key={group.type}>
                  {/* Type summary row */}
                  <tr
                    className="type-row"
                    onClick={() => toggle(group.type)}
                  >
                    <td>
                      <span className="type-row-toggle">
                        <span className={`account-type-chevron ${isExpanded ? 'open' : ''}`}>▸</span>
                        <Badge variant={typeColors[group.type] || 'blue'}>
                          {group.type}
                        </Badge>
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      {group.count} account{group.count !== 1 ? 's' : ''}
                    </td>
                    <td>
                      {totalTargetPct > 0 ? `${(totalTargetPct * 100).toFixed(0)}%` : '-'}
                    </td>
                    <td>
                      <AmountDisplay amount={group.totalBalance} />
                      {hasGroupTodayValue && renderTodaySubtitle(group.totalTodayValue, group.totalBalance)}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                      —
                    </td>
                  </tr>

                  {/* Expanded child account rows */}
                  {isExpanded && group.accounts.map((account) => (
                    <tr key={account.id} className="account-child-row">
                      <td style={{ paddingLeft: 'var(--space-8)' }}>
                        <Link href={`/accounts/${account.id}`} className="fund-card-title">
                          {account.name}
                        </Link>
                      </td>
                      <td>
                        <Badge variant={account.is_liquid ? 'green' : 'amber'}>
                          {account.is_liquid ? 'Yes' : 'No'}
                        </Badge>
                      </td>
                      <td>
                        {account.target_pct > 0 ? `${(account.target_pct * 100).toFixed(0)}%` : '-'}
                      </td>
                      <td>
                        <AmountDisplay amount={account.balance} />
                        {renderTodaySubtitle(account.todayValue, account.balance)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <AccountActions account={account} mode="edit" />
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
