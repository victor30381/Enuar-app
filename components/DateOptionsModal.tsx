import React, { useState, useEffect } from 'react';
import { Plus, X, Dumbbell, Calendar, Loader2 } from 'lucide-react';
import { getWodsByDate } from '../services/storageService';
import { WodEntry } from '../types';

interface DateOptionsModalProps {
  date: Date;
  onClose: () => void;
  onNewWod: (date: Date) => void;
  onEditWod: (id: string) => void;
  isDarkMode: boolean;
  isVertical: boolean;
}

const DateOptionsModal: React.FC<DateOptionsModalProps> = ({ date, onClose, onNewWod, onEditWod, isDarkMode, isVertical }) => {
  const [selectedDate, setSelectedDate] = useState(date);
  const [wods, setWods] = useState<WodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const dateIso = selectedDate.toISOString().split('T')[0];

  // Load WODs for selected date
  useEffect(() => {
    const loadWods = async () => {
      setLoading(true);
      try {
        const data = await getWodsByDate(dateIso);
        setWods(data);
      } catch (err) {
        console.error('Error loading WODs:', err);
      } finally {
        setLoading(false);
      }
    };
    loadWods();
  }, [dateIso]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value + 'T12:00:00');
    setSelectedDate(newDate);
  };

  return (
    <div className={`border rounded-xl shadow-[0_0_40px_rgba(255,95,31,0.25)] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 transition-colors
      ${isVertical ? 'w-[60vh] h-auto' : 'w-[90vw] max-w-sm'}
      ${isDarkMode ? 'bg-neutral-900 border-neon-orange' : 'bg-white border-orange-300'}
    `}>
      {/* Header */}
      <div className={`px-5 py-3 border-b flex justify-between items-center transition-colors
        ${isDarkMode ? 'bg-wood-800 border-neutral-800' : 'bg-orange-50 border-orange-100'}
      `}>
        <h2 className={`text-lg font-display uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Cargar WOD
        </h2>
        <button onClick={onClose} className={`transition-colors ${isDarkMode ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-800'}`}>
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      <div className={`p-6 flex flex-col gap-4 max-h-[60vh] overflow-y-auto transition-colors ${isDarkMode ? 'bg-neutral-900/95' : 'bg-white'}`}>

        {/* Date Picker */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-neon-orange font-bold uppercase tracking-wider flex items-center gap-2">
            <Calendar size={14} />
            Seleccionar Fecha
          </label>
          <input
            type="date"
            value={dateIso}
            onChange={handleDateChange}
            className={`w-full border rounded-lg px-4 py-3 font-mono text-lg focus:border-neon-orange focus:ring-1 focus:ring-neon-orange/50 outline-none transition-all
              ${isDarkMode
                ? 'bg-black/40 border-neutral-700 text-white [color-scheme:dark]'
                : 'bg-gray-50 border-gray-200 text-gray-800 [color-scheme:light]'
              }
            `}
          />
        </div>

        {/* Selected Date Display */}
        <div className={`text-center py-2 border-y ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
          <span className={`font-display text-xl tracking-wider ${isDarkMode ? 'text-white' : 'text-orange-900'}`}>
            {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center py-2">
            <Loader2 className="animate-spin text-neon-orange" size={24} />
          </div>
        )}

        {/* Existing WODs for selected date */}
        {!loading && wods.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Entrenamientos en esta fecha:</span>
            {wods.map(wod => (
              <button
                key={wod.id}
                onClick={() => onEditWod(wod.id)}
                className={`flex items-center gap-3 p-3 border rounded-lg transition-all text-left group
                  ${isDarkMode
                    ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-neon-orange/50'
                    : 'bg-gray-50 border-gray-200 hover:bg-orange-50 hover:border-orange-300'
                  }
                `}
              >
                <Dumbbell size={18} className="text-neon-orange group-hover:scale-110 transition-transform" />
                <span className={`font-mono text-sm truncate w-full ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{wod.title}</span>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => onNewWod(selectedDate)}
          className="group flex items-center justify-center gap-3 w-full p-4 bg-neon-orange/10 border border-neon-orange/50 rounded-lg hover:bg-neon-orange hover:text-black hover:border-neon-orange hover:shadow-[0_0_15px_rgba(255,95,31,0.5)] transition-all duration-300 mt-2"
        >
          <div className="p-2 bg-neon-orange/20 rounded-full group-hover:bg-black/20 transition-colors">
            <Plus size={24} className="group-hover:scale-110 transition-transform" />
          </div>
          <span className="font-display text-xl tracking-wider uppercase">Cargar Nuevo WOD</span>
        </button>
      </div>
    </div>
  );
};

export default DateOptionsModal;
