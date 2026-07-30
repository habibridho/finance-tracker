import React from 'react';

export default function FormField({ label, error, required, children, hint }) {
  return (
    <div className="form-field">
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      
      {children}
      
      {hint && !error && (
        <div className="form-hint">{hint}</div>
      )}
      
      {error && (
        <div className="form-error">{error}</div>
      )}
    </div>
  );
}
