import React from 'react';

export default function AmountDisplay({ amount, showSign = false, size = 'md' }) {
  const isPositive = amount > 0;
  const isNegative = amount < 0;
  const isZero = amount === 0;

  const formattedAmount = Math.abs(amount).toLocaleString('id-ID');
  
  let sign = '';
  if (showSign) {
    if (isPositive) sign = '+';
    if (isNegative) sign = '-';
  }

  let colorClass = 'amount-zero';
  if (isPositive) colorClass = 'amount-positive';
  if (isNegative) colorClass = 'amount-negative';

  return (
    <span className={`${colorClass} amount-${size}`}>
      {sign}Rp {formattedAmount}
    </span>
  );
}
