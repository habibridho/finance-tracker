'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import FormField from '@/components/FormField';
import { useToast } from '@/components/Toast';

export default function FundActions({ fund = null, mode = 'add' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState(fund || {
    name: '',
    target_amount: 0,
    target_date: '',
    is_active: true
  });
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(mode === 'add' ? '/api/funds' : `/api/funds/${fund.id}`, {
        method: mode === 'add' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          target_amount: Number(formData.target_amount),
          is_active: Boolean(formData.is_active),
          target_date: formData.target_date || null
        })
      });

      if (!res.ok) throw new Error('Failed to save fund');
      
      toast.success(mode === 'add' ? 'Fund created' : 'Fund updated');
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/funds/${fund.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete fund');
      
      toast.success('Fund deleted');
      setIsDeleting(false);
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (mode === 'edit') {
    return (
      <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
        <button className="btn btn-sm btn-ghost" onClick={() => setIsOpen(true)}>Edit</button>
        <button className="btn btn-sm btn-ghost text-red-500" onClick={() => setIsDeleting(true)}>Delete</button>

        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit Fund">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <FormField label="Name">
              <input className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </FormField>

            <FormField label="Target Amount">
              <input type="number" className="form-input" value={formData.target_amount ?? ''} onChange={e => setFormData({...formData, target_amount: e.target.value})} />
            </FormField>

            <FormField label="Target Date">
              <input type="text" className="form-input" placeholder="YYYY-MM-DD" pattern="\d{4}-\d{2}-\d{2}" title="Date format: YYYY-MM-DD" value={formData.target_date || ''} onChange={e => setFormData({...formData, target_date: e.target.value})} />
            </FormField>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
              Is Active
            </label>

            <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end', marginTop: 'var(--space-md)' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setIsOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </Modal>

        <Modal isOpen={isDeleting} onClose={() => setIsDeleting(false)} title="Delete Fund">
          <p>Are you sure you want to delete {fund.name}? This cannot be undone.</p>
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
      <button className="btn btn-primary" onClick={() => setIsOpen(true)}>Add Fund</button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="New Fund">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <FormField label="Name">
            <input className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </FormField>

          <FormField label="Target Amount">
            <input type="number" className="form-input" value={formData.target_amount ?? ''} onChange={e => setFormData({...formData, target_amount: e.target.value})} />
          </FormField>

          <FormField label="Target Date">
            <input type="text" className="form-input" placeholder="YYYY-MM-DD" pattern="\d{4}-\d{2}-\d{2}" title="Date format: YYYY-MM-DD" value={formData.target_date || ''} onChange={e => setFormData({...formData, target_date: e.target.value})} />
          </FormField>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
            Is Active
          </label>

          <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end', marginTop: 'var(--space-md)' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Fund</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
