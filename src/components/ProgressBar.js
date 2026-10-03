import React from 'react';

export default function ProgressBar({ value, max = 100, showLabel = false, size = 'md' }) {
  const ratio = max > 0 ? (Number(value) || 0) / max : 0;
  const percentage = Math.min(100, Math.max(0, ratio * 100));
  
  let fillBg = 'var(--accent-emerald)';
  if (percentage < 25) {
    fillBg = 'var(--accent-rose)';
  } else if (percentage < 75) {
    fillBg = 'var(--accent-amber)';
  }

  return (
    <div className="progress-bar-container">
      {showLabel && (
        <div className="progress-bar-header">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`progress-bar progress-bar-${size}`}>
        <div 
          className="progress-fill" 
          style={{ 
            width: `${percentage}%`,
            backgroundColor: fillBg,
            backgroundImage: `linear-gradient(90deg, color-mix(in srgb, ${fillBg} 60%, transparent), ${fillBg})`
          }} 
        />
      </div>
    </div>
  );
}
