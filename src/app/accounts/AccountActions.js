'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import FormField from '@/components/FormField';
import { useToast } from '@/components/Toast';

export default function AccountActions({ account = null, mode = 'add', redirectOnDelete = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState(account || {
    name: '',
    type: 'Tabungan',
    is_liquid: true,
    target_pct: 0,
    units: 0,
    award_value: 0
  });
  const router = useRouter();
  const toast = useToast();

  const isAssetType = ['Saham', 'Reksadana', 'Emas', 'Valas'].includes(formData.type);
  const hasExistingUnits = account && account.units !== null && account.units !== undefined && Number(account.units) > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(mode === 'add' ? '/api/accounts' : `/api/accounts/${account.id}`, {
        method: mode === 'add' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          is_liquid: Boolean(formData.is_liquid),
          target_pct: Number(formData.target_pct),
          units: formData.units !== '' && formData.units !== null && formData.units !== undefined ? Number(formData.units) : null,
          award_value: Number(formData.award_value)
        })
      });

      if (!res.ok) throw new Error('Failed to save account');
      
      toast.success(mode === 'add' ? 'Account created' : 'Account updated');
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete account');
      
      toast.success('Account deleted');
      setIsDeleting(false);
      if (redirectOnDelete) {
        router.push('/accounts');
      } else {
        router.refresh();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (mode === 'edit') {
    return (
      <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
        <button className="btn btn-sm btn-secondary" onClick={() => setIsOpen(true)}>Edit</button>
        <button className="btn btn-sm btn-danger" onClick={() => setIsDeleting(true)}>Delete</button>

        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit Account">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <FormField label="Name">
              <input className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </FormField>
            
            <FormField label="Type">
              <select className="form-select" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="Tabungan">Tabungan</option>
                <option value="Saham">Saham</option>
                <option value="Sukuk">Sukuk</option>
                <option value="Reksadana">Reksadana</option>
                <option value="P2P">P2P</option>
                <option value="Emas">Emas</option>
                <option value="Valas">Valas</option>
                <option value="Deposito">Deposito</option>
              </select>
            </FormField>

            {isAssetType && (
              <FormField 
                label="Units / Shares" 
                hint={hasExistingUnits ? "Units can only be modified through transactions" : "Initial unit count (only editable when no balance/units yet)"}
              >
                <input 
                  type="number" 
                  step="any" 
                  className="form-input" 
                  value={formData.units ?? ''} 
                  onChange={e => setFormData({...formData, units: e.target.value})} 
                  disabled={hasExistingUnits}
                  placeholder="0"
                />
              </FormField>
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={formData.is_liquid} onChange={e => setFormData({...formData, is_liquid: e.target.checked})} />
              Is Liquid
            </label>

            <FormField label="Target % (e.g. 0.1 for 10%)">
              <input type="number" step="0.01" className="form-input" value={formData.target_pct ?? ''} onChange={e => setFormData({...formData, target_pct: e.target.value})} />
            </FormField>

            <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end', marginTop: 'var(--space-md)' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setIsOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </Modal>

        <Modal isOpen={isDeleting} onClose={() => setIsDeleting(false)} title="Delete Account">
          <p>Are you sure you want to delete {account.name}? This cannot be undone.</p>
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
      <button className="btn btn-primary" onClick={() => setIsOpen(true)}>Add Account</button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="New Account">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <FormField label="Name">
            <input className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </FormField>
          
          <FormField label="Type">
            <select className="form-select" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
              <option value="Tabungan">Tabungan</option>
              <option value="Saham">Saham</option>
              <option value="Sukuk">Sukuk</option>
              <option value="Reksadana">Reksadana</option>
              <option value="P2P">P2P</option>
              <option value="Emas">Emas</option>
              <option value="Valas">Valas</option>
              <option value="Deposito">Deposito</option>
            </select>
          </FormField>

          {isAssetType && (
            <FormField label="Units / Shares" hint="Initial unit count">
              <input 
                type="number" 
                step="any" 
                className="form-input" 
                value={formData.units ?? ''} 
                onChange={e => setFormData({...formData, units: e.target.value})} 
                placeholder="0"
              />
            </FormField>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={formData.is_liquid} onChange={e => setFormData({...formData, is_liquid: e.target.checked})} />
            Is Liquid
          </label>

          <FormField label="Target % (e.g. 0.1 for 10%)">
            <input type="number" step="0.01" className="form-input" value={formData.target_pct ?? ''} onChange={e => setFormData({...formData, target_pct: e.target.value})} />
          </FormField>

          <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end', marginTop: 'var(--space-md)' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Account</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
