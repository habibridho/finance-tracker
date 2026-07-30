import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { ToastProvider } from '@/components/Toast';
import { initDatabase } from '@/db/init';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

// Initialize database on server start
// Assuming initDatabase handles checking if it's already initialized
if (typeof initDatabase === 'function') {
  initDatabase();
}

export const metadata = {
  title: 'FinTrack — Personal Finance Tracker',
  description: 'Track investments and asset allocations',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <ToastProvider>
          <div className="app-layout">
            <Sidebar />
            <main className="main-content">{children}</main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
