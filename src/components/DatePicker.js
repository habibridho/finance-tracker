'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export default function DatePicker({ value, onChange, required, placeholder = 'Select date...' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    return value ? new Date(value + 'T00:00:00') : new Date();
  });
  const containerRef = useRef(null);

  // Sync viewDate when value changes externally
  useEffect(() => {
    if (value) {
      const parsed = new Date(value + 'T00:00:00');
      if (!isNaN(parsed.getTime())) {
        setViewDate(parsed);
      }
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handler);
    }
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  const generateCalendarDays = useCallback(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    // Shift so Monday = 0
    const startOffset = (firstDay.getDay() + 6) % 7;
    const days = [];

    for (let i = -startOffset; i < 42 - startOffset; i++) {
      days.push(new Date(year, month, 1 + i));
    }
    return days;
  }, [viewDate]);

  const handleSelect = (d) => {
    onChange(formatDate(d));
    setIsOpen(false);
  };

  const handleTodayClick = () => {
    const today = new Date();
    onChange(formatDate(today));
    setViewDate(today);
    setIsOpen(false);
  };

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
  };

  const today = new Date();
  const selectedDate = value ? new Date(value + 'T00:00:00') : null;
  const calendarDays = generateCalendarDays();
  const currentMonth = viewDate.getMonth();

  return (
    <div className="date-picker" ref={containerRef}>
      <div
        className="form-input date-picker-input"
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleInputKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {value || <span style={{ color: 'var(--text-muted)' }}>{placeholder}</span>}
      </div>

      {/* Hidden input for form validation */}
      {required && (
        <input
          type="hidden"
          value={value || ''}
          required
        />
      )}

      {isOpen && (
        <div className="date-picker-dropdown" role="dialog" aria-label="Choose date">
          {/* Header: month/year navigation */}
          <div className="date-picker-header">
            <button
              type="button"
              className="date-picker-nav"
              onClick={prevMonth}
              aria-label="Previous month"
            >
              ‹
            </button>
            <span>{MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
            <button
              type="button"
              className="date-picker-nav"
              onClick={nextMonth}
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          {/* Weekday headers */}
          <div className="date-picker-weekdays">
            {WEEKDAYS.map((day) => (
              <div key={day} className="date-picker-weekday">{day}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="date-picker-grid">
            {calendarDays.map((d, i) => {
              const isOtherMonth = d.getMonth() !== currentMonth;
              const isToday = isSameDay(d, today);
              const isSelected = selectedDate && isSameDay(d, selectedDate);

              let className = 'date-picker-day';
              if (isOtherMonth) className += ' other-month';
              if (isToday) className += ' today';
              if (isSelected) className += ' selected';

              return (
                <button
                  key={i}
                  type="button"
                  className={className}
                  onClick={() => handleSelect(d)}
                  aria-label={formatDate(d)}
                  aria-selected={isSelected || undefined}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          {/* Footer: Today shortcut */}
          <div className="date-picker-footer">
            <button
              type="button"
              className="date-picker-today-btn"
              onClick={handleTodayClick}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
