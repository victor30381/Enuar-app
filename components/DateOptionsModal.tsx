import React, { useMemo, useState } from 'react';
import { Plus, X, Dumbbell, Calendar } from 'lucide-react';
import { getWodsByDate } from '../services/storageService';

interface DateOptionsModalProps {
  date: Date;
  onClose: () => void;
  onNewWod: (date: Date) => void;
  onEditWod: (id: string) => void;
}

const DateOptionsModal: React.FC<DateOptionsModalProps> = ({ date, onClose, onNewWod, onEditWod }) => {
  const [selectedDate, setSelectedDate] = useState(date);
  const dateIso = selectedDate.toISOString().split('T')[0];
  const wods = useMemo(() => getWodsByDate(dateIso), [dateIso]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value + 'T12:00:00');
    setSelectedDate(newDate);
  };

  return (
    <div className="bg-neutral-900 border border-neon-orange w-[90vw] max-w-sm rounded-xl shadow-[0_0_40px_rgba(255,95,31,0.25)] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
      {/* Header */}
      <div className="px-5 py-3 border-b border-neutral-800 flex justify-between items-center bg-wood-800">
        <h2 className="text-lg font-display text-white uppercase tracking-wider">
          Cargar WOD
        </h2>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col gap-4 bg-neutral-900/95 max-h-[60vh] overflow-y-auto">

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
            className="w-full bg-black/40 border border-neutral-700 rounded-lg px-4 py-3 text-white font-mono text-lg focus:border-neon-orange focus:ring-1 focus:ring-neon-orange/50 outline-none transition-all [color-scheme:dark]"
          />
        </div>

        {/* Selected Date Display */}
        <div className="text-center py-2 border-y border-white/10">
          <span className="text-white font-display text-xl tracking-wider">
            {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        {/* Existing WODs for selected date */}
        {wods.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Entrenamientos en esta fecha:</span>
            {wods.map(wod => (
              <button
                key={wod.id}
                onClick={() => onEditWod(wod.id)}
                className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-neon-orange/50 transition-all text-left group"
              >
                <Dumbbell size={18} className="text-neon-orange group-hover:scale-110 transition-transform" />
                <span className="text-white font-mono text-sm truncate w-full">{wod.title}</span>
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
