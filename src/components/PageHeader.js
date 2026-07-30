import React from 'react';

export default function PageHeader({ title, subtitle, action, children }) {
  const content = action || children;
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {content && (
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          {content}
        </div>
      )}
    </div>
  );
}
