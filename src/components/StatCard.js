import React from 'react';

export default function StatCard({ label, value, subtitle, icon, variant = 'default' }) {
  return (
    <div className="card stat-card" data-variant={variant}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>{label}</div>
        {icon && <div style={{ fontSize: '1.25rem', opacity: 0.8 }}>{icon}</div>}
      </div>
      
      <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em', marginBottom: 'var(--space-1)' }}>
        {value}
      </div>
      
      {subtitle && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
