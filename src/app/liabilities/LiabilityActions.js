'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import FormField from '@/components/FormField';
import { useToast } from '@/components/Toast';

export default function LiabilityActions({ liability = null, mode = 'add' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState(() => {
    if (liability) {
      return {
        name: liability.name || '',
        original_amount: liability.original_amount ?? liability.originalAmount ?? '',
        initial_balance: liability.initial_balance ?? liability.initialBalance ?? liability.current_balance ?? liability.currentBalance ?? '',
        interest_rate: liability.interest_rate ?? liability.interestRate ?? '',
        monthly_payment: liability.monthly_payment ?? liability.monthlyPayment ?? '',
        start_date: liability.start_date || liability.startDate || '',
        end_date: liability.end_date || liability.endDate || ''
      };
    }
    return {
      name: '',
      original_amount: '',
      initial_balance: '',
      interest_rate: '',
      monthly_payment: '',
      start_date: '',
      end_date: ''
    };
  });
  
  const router = useRouter();
  const toast = useToast();

  const handleChange = (field) => (e) => {
    const val = e.target.value;
    setFormData(prev => {
      const next = { ...prev, [field]: val };
      if (field === 'original_amount' && mode === 'add' && !prev.initial_balance) {
        next.initial_balance = val;
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        originalAmount: Number(formData.original_amount) || 0,
        initialBalance: formData.initial_balance !== '' ? Number(formData.initial_balance) : (Number(formData.original_amount) || 0),
        interestRate: formData.interest_rate !== '' ? Number(formData.interest_rate) : null,
        monthlyPayment: formData.monthly_payment !== '' ? Number(formData.monthly_payment) : null,
        startDate: formData.start_date || null,
        endDate: formData.end_date || null
      };

      const res = await fetch(mode === 'add' ? '/api/liabilities' : `/api/liabilities/${liability.id}`, {
        method: mode === 'add' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save liability');
      }
      
      toast.success(mode === 'add' ? 'Liability created' : 'Liability updated');
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/liabilities/${liability.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete liability');
      toast.success('Liability deleted');
      setIsDeleting(false);
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const formJsx = (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <FormField label="Name">
        <input className="form-input" required value={formData.name} onChange={handleChange('name')} />
      </FormField>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
        <FormField label="Original Amount">
          <input type="number" required className="form-input" value={formData.original_amount} onChange={handleChange('original_amount')} />
        </FormField>
        <FormField label="Initial Balance">
          <input type="number" required className="form-input" value={formData.initial_balance} onChange={handleChange('initial_balance')} />
        </FormField>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
        <FormField label="Interest Rate (e.g. 0.05 for 5%)">
          <input type="number" step="0.001" className="form-input" value={formData.interest_rate} onChange={handleChange('interest_rate')} />
        </FormField>
        <FormField label="Monthly Payment">
          <input type="number" className="form-input" value={formData.monthly_payment} onChange={handleChange('monthly_payment')} />
        </FormField>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
        <FormField label="Start Date">
          <input 
            type="text" 
            className="form-input" 
            placeholder="YYYY-MM-DD"
            pattern="\d{4}-\d{2}-\d{2}"
            title="Date format: YYYY-MM-DD (e.g. 2024-11-01)"
            value={formData.start_date} 
            onChange={handleChange('start_date')} 
          />
        </FormField>
        <FormField label="End Date">
          <input 
            type="text" 
            className="form-input" 
            placeholder="YYYY-MM-DD"
            pattern="\d{4}-\d{2}-\d{2}"
            title="Date format: YYYY-MM-DD (e.g. 2030-12-31)"
            value={formData.end_date} 
            onChange={handleChange('end_date')} 
          />
        </FormField>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end', marginTop: 'var(--space-md)' }}>
        <button type="button" className="btn btn-ghost" onClick={() => setIsOpen(false)}>Cancel</button>
        <button type="submit" className="btn btn-primary">{mode === 'add' ? 'Create Liability' : 'Save Changes'}</button>
      </div>
    </form>
  );

  if (mode === 'edit') {
    return (
      <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
        <button className="btn btn-sm btn-ghost" onClick={() => setIsOpen(true)}>Edit</button>
        <button className="btn btn-sm btn-ghost" style={{ color: 'var(--accent-rose)' }} onClick={() => setIsDeleting(true)}>Delete</button>

        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit Liability">
          {formJsx}
        </Modal>

        <Modal isOpen={isDeleting} onClose={() => setIsDeleting(false)} title="Delete Liability">
          <p>Are you sure you want to delete {liability.name}? This cannot be undone.</p>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end', marginTop: 'var(--space-lg)' }}>
            <button className="btn btn-ghost" onClick={() => setIsDeleting(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Confirm Delete</button>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <>
      <button className="btn btn-primary" onClick={() => setIsOpen(true)}>Add Liability</button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="New Liability">
        {formJsx}
      </Modal>
    </>
  );
}
