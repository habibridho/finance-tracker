'use client';

import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { formatRupiah } from '@/lib/format';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function DashboardCharts({ accountsByType }) {
  const typeColors = {
    'Tabungan': '#60a5fa',
    'Saham': '#a78bfa',
    'Sukuk': '#fbbf24',
    'Reksadana': '#4ade80',
    'P2P': '#f87171',
    'Emas': '#fb923c',
    'Valas': '#2dd4bf',
    'Deposito': '#818cf8',
    'Properti': '#c084fc',
    'Mobil': '#c084fc'
  };

  const data = {
    labels: accountsByType.map(a => a.type),
    datasets: [
      {
        data: accountsByType.map(a => a.total),
        backgroundColor: accountsByType.map(a => typeColors[a.type] || '#94a3b8'),
        borderColor: '#1e293b', // Match dark background
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#f8fafc',
          padding: 20,
          font: {
            family: "'Inter', sans-serif",
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function(context) {
            const value = context.raw;
            return ` ${context.label}: ${formatRupiah(value)}`;
          }
        }
      }
    },
    cutout: '70%',
  };

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <Doughnut data={data} options={options} />
    </div>
  );
}
