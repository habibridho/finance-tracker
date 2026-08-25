'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { formatRupiah, formatDate } from '@/lib/format';
import { useMemo } from 'react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

export default function FundBalanceChart({ transactions }) {
  const chartData = useMemo(() => {
    // Transactions are fetched in DESC order (newest first). 
    // We reverse them to calculate chronologically.
    const chronologicalTxns = [...transactions].reverse();
    
    let currentBalance = 0;
    const labels = [];
    const dataPoints = [];

    // Add initial point if there are transactions
    if (chronologicalTxns.length > 0) {
      labels.push('Start');
      dataPoints.push(0);
    }

    chronologicalTxns.forEach((txn) => {
      currentBalance += txn.fund_amount;
      labels.push(formatDate(txn.date));
      dataPoints.push(currentBalance);
    });

    return {
      labels,
      datasets: [
        {
          fill: true,
          label: 'Balance',
          data: dataPoints,
          borderColor: '#60a5fa', // Tailwind blue-400
          backgroundColor: 'rgba(96, 165, 250, 0.1)',
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [transactions]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
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
            return ` Balance: ${formatRupiah(context.raw)}`;
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          color: '#94a3b8',
          callback: function(value) {
             if (Math.abs(value) >= 1000000000) {
               return 'Rp ' + (value / 1000000000).toFixed(1) + 'B';
             } else if (Math.abs(value) >= 1000000) {
               return 'Rp ' + (value / 1000000).toFixed(1) + 'M';
             } else if (Math.abs(value) >= 1000) {
               return 'Rp ' + (value / 1000).toFixed(0) + 'K';
             }
             return 'Rp ' + value;
          }
        },
        grid: {
          color: '#334155',
        },
      },
      x: {
        ticks: {
          color: '#94a3b8',
          maxTicksLimit: 7,
        },
        grid: {
          color: 'transparent',
        },
      }
    }
  };

  if (!transactions || transactions.length === 0) {
    return null;
  }

  return (
    <div className="card" style={{ padding: 'var(--space-lg)' }}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Balance Trend</h3>
      <div style={{ height: '300px', width: '100%' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
