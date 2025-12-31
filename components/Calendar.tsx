import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { DayCell, WodEntry } from '../types';
import { getWods } from '../services/storageService';

interface CalendarProps {
  onDateSelect: (date: Date) => void;
  isDarkMode?: boolean;
  isVertical?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({ onDateSelect, isDarkMode = true, isVertical = false }) => {
  const currentDate = new Date();
  const [displayMonth, setDisplayMonth] = useState(currentDate.getMonth());
  const [displayYear, setDisplayYear] = useState(currentDate.getFullYear());
  const [wods, setWods] = useState<WodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const monthName = new Date(displayYear, displayMonth).toLocaleString('es-ES', { month: 'long' }).toUpperCase();

  // Load WODs from Firestore
  useEffect(() => {
    const loadWods = async () => {
      setLoading(true);
      try {
        const data = await getWods();
        setWods(data);
      } catch (err) {
        console.error('Error loading WODs:', err);
      } finally {
        setLoading(false);
      }
    };
    loadWods();
  }, [displayMonth, displayYear]);

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

  const days = React.useMemo(() => {
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
  }, [displayMonth, displayYear, wods]);

  return (
    <div className={`w-full mx-auto transition-all duration-300 ${isVertical ? 'max-w-md' : 'max-w-lg'}`}>
      {/* Month Header with Navigation */}
      <div className={`flex items-center justify-center gap-4 ${isVertical ? 'mb-4' : 'mb-4'}`}>
        <button
          onClick={goToPrevMonth}
          className={`hover:text-neon-orange hover:scale-125 transition-all p-1 ${isDarkMode ? 'text-white/50' : 'text-gray-400'}`}
          title="Mes anterior"
        >
          <ChevronLeft size={isVertical ? 28 : 32} />
        </button>
        <h2 className={`${isVertical ? 'text-3xl' : 'text-3xl md:text-4xl'} font-display text-center tracking-widest drop-shadow-[0_0_25px_rgba(255,95,31,0.8)] relative ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          <span className="absolute inset-0 blur-xl bg-neon-orange/20 rounded-full"></span>
          <span className="relative">{monthName}</span>
          <span className="block text-sm text-neon-orange/60 mt-0.5">{displayYear}</span>
        </h2>
        <button
          onClick={goToNextMonth}
          className={`hover:text-neon-orange hover:scale-125 transition-all p-1 ${isDarkMode ? 'text-white/50' : 'text-gray-400'}`}
          title="Mes siguiente"
        >
          <ChevronRight size={isVertical ? 28 : 32} />
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-2">
          <Loader2 className="animate-spin text-neon-orange" size={20} />
        </div>
      )}

      <div className="grid grid-cols-7 gap-1 mb-1">
        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
          <div key={i} className={`text-center text-gray-500 font-bold ${isVertical ? 'text-xs' : 'text-xs'}`}>{d}</div>
        ))}
      </div>

      <div className={`grid grid-cols-7 gap-1 border-t border-l ${isDarkMode ? 'border-white/20' : 'border-gray-200'}`}>
        {days.map((day, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onDateSelect(day.date)}
            className={`
              relative aspect-square flex items-center justify-center font-sans border-b border-r transition-all duration-300
              ${isDarkMode ? 'border-white/20' : 'border-gray-200'}
              ${!day.isCurrentMonth ? 'text-gray-400 pointer-events-none' : isDarkMode ? 'text-white hover:text-neon-orange hover:bg-white/5 cursor-pointer' : 'text-gray-800 hover:text-neon-orange hover:bg-orange-50 cursor-pointer'}
              ${day.isToday ? 'border-2 border-neon-orange neon-box bg-neon-orange/10 z-10' : ''}
              ${isVertical ? 'text-base' : 'text-base md:text-lg'}
            `}
          >
            {day.date.getDate()}

            {/* WOD Indicator Dots */}
            {day.wodCount > 0 && (
              <div className="absolute bottom-1 flex gap-0.5">
                {Array.from({ length: Math.min(day.wodCount, 3) }).map((_, i) => (
                  <div key={i} className="w-1 h-1 bg-neon-orange rounded-full shadow-[0_0_5px_rgba(255,95,31,1)]"></div>
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