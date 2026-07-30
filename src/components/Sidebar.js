'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/transactions/new', label: 'New Transaction', icon: '➕' },
    { href: '/accounts', label: 'Accounts', icon: '🏦' },
    { href: '/funds', label: 'Funds', icon: '🎯' },
    { href: '/journal', label: 'Journal', icon: '📒' },
    { href: '/distribution', label: 'Distribution', icon: '📐' },
    { href: '/reconciliation', label: 'Reconciliation', icon: '⚖️' },
    { href: '/liabilities', label: 'Liabilities', icon: '💳' },
  ];

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      <button 
        className="btn btn-icon d-md-none" 
        style={{ position: 'fixed', top: '1rem', left: '1rem', zIndex: 60, background: 'var(--bg-card)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-subtle)' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '✕' : '☰'}
      </button>

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          FinTrack <span>💎</span>
        </div>
        <nav className="sidebar-nav">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link 
                key={link.href} 
                href={link.href} 
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
