import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayCell } from '../types';
import { getWods } from '../services/storageService';

interface CalendarProps {
  onDateSelect: (date: Date) => void;
  isDarkMode?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({ onDateSelect, isDarkMode = true }) => {
  const currentDate = new Date();
  const [displayMonth, setDisplayMonth] = useState(currentDate.getMonth());
  const [displayYear, setDisplayYear] = useState(currentDate.getFullYear());

  const monthName = new Date(displayYear, displayMonth).toLocaleString('es-ES', { month: 'long' }).toUpperCase();

  const goToPrevMonth = () => {
    if (displayMonth === 0) {
      setDisplayMonth(11);
      setDisplayYear(displayYear - 1);
    } else {
      setDisplayMonth(displayMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (displayMonth === 11) {
      setDisplayMonth(0);
      setDisplayYear(displayYear + 1);
    } else {
      setDisplayMonth(displayMonth + 1);
    }
  };

  const days = useMemo(() => {
    const wods = getWods();
    const result: DayCell[] = [];

    // First day of month
    const firstDay = new Date(displayYear, displayMonth, 1);
    // Number of days in month
    const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();

    // Adjust for Monday start (0 is Sunday in JS)
    const startingDayOfWeek = firstDay.getDay();

    // Fill previous month padding
    for (let i = 0; i < startingDayOfWeek; i++) {
      const d = new Date(displayYear, displayMonth, 0 - (startingDayOfWeek - 1 - i));
      result.push({ date: d, isCurrentMonth: false, isToday: false, wodCount: 0 });
    }

    // Fill current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(displayYear, displayMonth, i);
      const isToday = date.toDateString() === new Date().toDateString();
      const dateIso = date.toISOString().split('T')[0];
      const wodCount = wods.filter(w => w.date === dateIso).length;

      result.push({
        date,
        isCurrentMonth: true,
        isToday,
        wodCount
      });
    }

    // Fill remaining grid to make it look square-ish
    const remaining = 35 - result.length;
    if (remaining > 0) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(displayYear, displayMonth + 1, i);
        result.push({ date: d, isCurrentMonth: false, isToday: false, wodCount: 0 });
      }
    }

    return result;
  }, [displayMonth, displayYear]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Month Header with Navigation */}
      <div className="flex items-center justify-center gap-6 mb-8">
        <button
          onClick={goToPrevMonth}
          className={`hover:text-neon-orange hover:scale-125 transition-all p-2 ${isDarkMode ? 'text-white/50' : 'text-gray-400'}`}
          title="Mes anterior"
        >
          <ChevronLeft size={40} />
        </button>
        <h2 className={`text-5xl md:text-6xl font-display text-center tracking-widest drop-shadow-[0_0_25px_rgba(255,95,31,0.8)] relative ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          <span className="absolute inset-0 blur-xl bg-neon-orange/20 rounded-full"></span>
          <span className="relative">{monthName}</span>
          <span className="block text-lg text-neon-orange/60 mt-1">{displayYear}</span>
        </h2>
        <button
          onClick={goToNextMonth}
          className={`hover:text-neon-orange hover:scale-125 transition-all p-2 ${isDarkMode ? 'text-white/50' : 'text-gray-400'}`}
          title="Mes siguiente"
        >
          <ChevronRight size={40} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
          <div key={i} className="text-center text-gray-500 text-sm font-bold">{d}</div>
        ))}
      </div>

      <div className={`grid grid-cols-7 gap-1 md:gap-2 border-t border-l ${isDarkMode ? 'border-white/20' : 'border-gray-200'}`}>
        {days.map((day, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onDateSelect(day.date)}
            className={`
              relative aspect-square flex items-center justify-center text-lg md:text-xl font-sans border-b border-r transition-all duration-300
              ${isDarkMode ? 'border-white/20' : 'border-gray-200'}
              ${!day.isCurrentMonth ? 'text-gray-400 pointer-events-none' : isDarkMode ? 'text-white hover:text-neon-orange hover:bg-white/5 cursor-pointer' : 'text-gray-800 hover:text-neon-orange hover:bg-orange-50 cursor-pointer'}
              ${day.isToday ? 'border-2 border-neon-orange neon-box bg-neon-orange/10 z-10' : ''}
            `}
          >
            {day.date.getDate()}

            {/* WOD Indicator Dots */}
            {day.wodCount > 0 && (
              <div className="absolute bottom-1.5 flex gap-0.5">
                {Array.from({ length: Math.min(day.wodCount, 3) }).map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-neon-orange rounded-full shadow-[0_0_5px_rgba(255,95,31,1)]"></div>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Calendar;