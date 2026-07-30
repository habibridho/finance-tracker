'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import FormField from '@/components/FormField';
import { useToast } from '@/components/Toast';

export default function DistributionActions({ rule = null, mode = 'add' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [funds, setFunds] = useState([]);
  
  const [formData, setFormData] = useState(rule || {
    name: '',
    type: 'FIXED',
    is_default: false,
    lines: []
  });
  
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (isOpen && funds.length === 0) {
      fetch('/api/funds').then(r => r.json()).then(setFunds);
    }
  }, [isOpen, funds.length]);

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { fund_id: '', amount: 0, percentage: 0 }]
    });
  };

  const removeLine = (index) => {
    const newLines = [...formData.lines];
    newLines.splice(index, 1);
    setFormData({ ...formData, lines: newLines });
  };

  const updateLine = (index, field, value) => {
    const newLines = [...formData.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setFormData({ ...formData, lines: newLines });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        is_default: Boolean(formData.is_default),
        lines: formData.lines.map((l, idx) => ({
          fund_id: l.fund_id,
          amount: Number(l.amount) || 0,
          percentage: Number(l.percentage) || 0,
          sort_order: idx
        }))
      };

      const res = await fetch(mode === 'add' ? '/api/distribution-rules' : `/api/distribution-rules/${rule.id}`, {
        method: mode === 'add' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save rule');
      
      toast.success(mode === 'add' ? 'Rule created' : 'Rule updated');
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/distribution-rules/${rule.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete rule');
      toast.success('Rule deleted');
      setIsDeleting(false);
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const FormContent = () => (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <FormField label="Rule Name">
        <input className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
      </FormField>

      <FormField label="Type">
        <select className="form-select" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
          <option value="FIXED">Fixed Amount</option>
          <option value="PERCENTAGE">Percentage</option>
        </select>
      </FormField>

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input type="checkbox" checked={formData.is_default} onChange={e => setFormData({...formData, is_default: e.target.checked})} />
        Set as Default Income Rule
      </label>

      <div style={{ marginTop: 'var(--space-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
          <h4 style={{ fontWeight: '500' }}>Allocations</h4>
          <button type="button" className="btn btn-sm btn-secondary" onClick={addLine}>Add Line</button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {formData.lines.map((line, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
              <select className="form-select" required style={{ flex: 2 }} value={line.fund_id} onChange={e => updateLine(idx, 'fund_id', e.target.value)}>
                <option value="">Select Fund...</option>
                {funds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              
              {formData.type === 'FIXED' ? (
                <input type="number" required placeholder="Amount" className="form-input" style={{ flex: 1 }} value={line.amount} onChange={e => updateLine(idx, 'amount', e.target.value)} />
              ) : (
                <input type="number" required step="0.01" placeholder="Decimal (e.g. 0.1)" className="form-input" style={{ flex: 1 }} value={line.percentage} onChange={e => updateLine(idx, 'percentage', e.target.value)} />
              )}
              
              <button type="button" className="btn btn-sm btn-danger btn-icon" onClick={() => removeLine(idx)}>×</button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end', marginTop: 'var(--space-lg)' }}>
        <button type="button" className="btn btn-ghost" onClick={() => setIsOpen(false)}>Cancel</button>
        <button type="submit" className="btn btn-primary">{mode === 'add' ? 'Create Rule' : 'Save Changes'}</button>
      </div>
    </form>
  );

  if (mode === 'edit') {
    return (
      <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
        <button className="btn btn-sm btn-ghost" onClick={() => setIsOpen(true)}>Edit</button>
        <button className="btn btn-sm btn-ghost text-red-500" onClick={() => setIsDeleting(true)}>Delete</button>

        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit Distribution Rule">
          <FormContent />
        </Modal>

        <Modal isOpen={isDeleting} onClose={() => setIsDeleting(false)} title="Delete Rule">
          <p>Are you sure you want to delete {rule.name}? This cannot be undone.</p>
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
      <button className="btn btn-primary" onClick={() => setIsOpen(true)}>Add Rule</button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="New Distribution Rule">
        <FormContent />
      </Modal>
    </>
  );
}
