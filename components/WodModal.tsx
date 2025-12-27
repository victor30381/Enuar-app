import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Trash2, Upload, Type, Plus, Maximize2, Minimize2, Image as ImageIcon, Zap, RotateCw } from 'lucide-react';
import { WodEntry, WodSection } from '../types';
import { saveWod, getWodById, deleteWod } from '../services/storageService';
import { parseWodContent } from '../services/geminiService';

interface WodModalProps {
  date: Date;
  wodId?: string;
  onClose: () => void;
  onSave: () => void;
}

const WodModal: React.FC<WodModalProps> = ({ date, wodId, onClose, onSave }) => {
  const dateIso = date.toISOString().split('T')[0];
  const [title, setTitle] = useState('');
  // Start with empty sections list to follow "only add button" request
  const [sections, setSections] = useState<WodSection[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [rawText, setRawText] = useState('');
  const [focusedSectionIndex, setFocusedSectionIndex] = useState(0);
  const [isVerticalMode, setIsVerticalMode] = useState(false); // false = 16:9, true = 9:16

  const sectionsContainerRef = useRef<HTMLDivElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement | null>(null);

  // Create fullscreen container on mount
  useEffect(() => {
    const container = document.createElement('div');
    container.id = 'wod-fullscreen-container';
    container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999; display: none; background: black;';
    document.body.appendChild(container);
    fullscreenContainerRef.current = container;

    return () => {
      container.remove();
    };
  }, []);

  // Toggle true browser fullscreen
  const toggleFullscreen = async () => {
    const container = fullscreenContainerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      // Enter fullscreen
      try {
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';

        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if ((container as any).webkitRequestFullscreen) {
          await (container as any).webkitRequestFullscreen();
        } else if ((container as any).msRequestFullscreen) {
          await (container as any).msRequestFullscreen();
        }
        setIsFullscreen(true);
      } catch (err) {
        console.error('Error entering fullscreen:', err);
        // Fallback to CSS fullscreen
        setIsFullscreen(true);
      }
    } else {
      // Exit fullscreen
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      } catch (err) {
        console.error('Error exiting fullscreen:', err);
      }
      container.style.display = 'none';
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes (e.g., user presses Escape)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );

      if (!isCurrentlyFullscreen && fullscreenContainerRef.current) {
        fullscreenContainerRef.current.style.display = 'none';
      }

      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const loadWod = async () => {
      if (wodId) {
        const existingWod = await getWodById(wodId);
        if (existingWod) {
          setTitle(existingWod.title);
          // Ensure sections are loaded, even if empty array in storage
          if (existingWod.sections && existingWod.sections.length > 0) {
            setSections(existingWod.sections);
            setActiveSectionId(existingWod.sections[0].id);
          } else if (existingWod.content) {
            // Backward compatibility: wrap legacy content in a default section
            const newId = crypto.randomUUID();
            setSections([{
              id: newId,
              title: 'WOD',
              content: existingWod.content
            }]);
            setActiveSectionId(newId);
          } else {
            setSections([]);
            setActiveSectionId('');
          }
        }
      } else {
        setTitle(`WOD ${date.toLocaleDateString()}`);
        // Reset to default new state: No sections
        setSections([]);
        setActiveSectionId('');
      }
    };
    loadWod();
  }, [wodId, date]);

  // Ensure active section is valid
  useEffect(() => {
    if (sections.length > 0 && !sections.find(s => s.id === activeSectionId)) {
      setActiveSectionId(sections[0].id);
    }
    if (sections.length > 0 && !sections.find(s => s.id === activeSectionId)) {
      setActiveSectionId(sections[0].id);
    }
  }, [sections, activeSectionId]);

  // Keyboard Navigation for Presentation Mode
  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        setFocusedSectionIndex(prev => Math.min(prev + 1, sections.length - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        setFocusedSectionIndex(prev => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, sections.length]);

  // Auto-scroll to focused section
  useEffect(() => {
    if (isFullscreen && sectionsContainerRef.current) {
      // Small delay to ensure DOM is ready and smooth transition
      const timer = setTimeout(() => {
        const focusedElement = sectionsContainerRef.current?.children[focusedSectionIndex] as HTMLElement;
        if (focusedElement) {
          focusedElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [focusedSectionIndex, isFullscreen]);

  const handleSave = async () => {
    // Legacy content fallback: join sections
    const legacyContent = sections.map(s => `### ${s.title}\n${s.content}`).join('\n\n');

    const entry: WodEntry = {
      id: wodId || crypto.randomUUID(),
      date: dateIso,
      title: title.trim() || `WOD ${date.toLocaleDateString()}`,
      content: legacyContent,
      sections: sections
    };
    await saveWod(entry);
    onSave();
    onClose();
  };

  const handleDelete = async () => {
    if (wodId) {
      await deleteWod(wodId);
      onSave();
      onClose();
    }
  };

  const addSection = () => {
    const newSection: WodSection = {
      id: crypto.randomUUID(),
      title: '',
      content: ''
    };
    setSections([...sections, newSection]);
    setActiveSectionId(newSection.id);
  };

  const removeSection = (id: string) => {
    // Allows removing even if it's the last one, going back to empty state
    setSections(sections.filter(s => s.id !== id));
  };

  const updateSection = (id: string, field: keyof WodSection, value: string) => {
    setSections(sections.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const handleSmartImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      const content = e.target?.result as string;
      try {
        // Determine mimeType for the API
        let mimeType = file.type;
        // Fallback for some windows file types or if empty
        if (!mimeType) {
          if (file.name.endsWith('.pdf')) mimeType = 'application/pdf';
          else if (file.name.endsWith('.txt')) mimeType = 'text/plain';
          else if (file.name.endsWith('.md')) mimeType = 'text/markdown';
          else if (file.name.endsWith('.json')) mimeType = 'application/json';
        }

        const result = await parseWodContent(content, mimeType);
        if (result) {
          if (result.title) setTitle(result.title);
          if (result.sections && Array.isArray(result.sections)) {
            // Always append sections or replace? 
            // User said "lo cargue ya con las secciones divididas"
            // Strategy: If current is empty, set. If not, append.
            const newSections = result.sections.map((s: any) => ({
              id: crypto.randomUUID(),
              title: s.title || 'Sección',
              content: s.content || ''
            }));

            setSections(prev => {
              // Use a functional update to avoid stale state
              // If we have only 1 empty section (default), replace it
              if (prev.length === 0 || (prev.length === 1 && !prev[0].title && !prev[0].content)) {
                return newSections;
              }
              return [...prev, ...newSections];
            });

            if (newSections.length > 0) setActiveSectionId(newSections[0].id);
          }
        }
      } catch (err: any) {
        console.error(err);
        if (err.message?.includes('429') || err.message?.includes('Quota')) {
          alert("⏳ Límite de uso de IA alcanzado. Por favor espera 1 minuto y prueba de nuevo.");
        } else {
          alert("Error al analizar el archivo. Intenta nuevamente.");
        }
      } finally {
        setIsParsing(false);
      }
    };

    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  const handleTextImport = async () => {
    if (!rawText.trim()) return;
    setIsParsing(true);
    try {
      const result = await parseWodContent(rawText, 'text/plain');
      if (result) {
        if (result.title) setTitle(result.title);
        if (result.sections && Array.isArray(result.sections)) {
          const newSections = result.sections.map((s: any) => ({
            id: crypto.randomUUID(),
            title: s.title || 'Sección',
            content: s.content || ''
          }));

          setSections(prev => {
            if (prev.length === 0 || (prev.length === 1 && !prev[0].title && !prev[0].content)) {
              return newSections;
            }
            return [...prev, ...newSections];
          });

          if (newSections.length > 0) setActiveSectionId(newSections[0].id);
          setRawText(''); // Clear after success
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('429') || err.message?.includes('Quota')) {
        alert("⏳ Límite de uso de IA alcanzado. Por favor espera 1 minuto y prueba de nuevo.");
      } else {
        alert("Error al analizar el texto. Intenta nuevamente.");
      }
    } finally {
      setIsParsing(false);
    }
  };

  const modalContent = (
    <div
      ref={modalContainerRef}
      className={`bg-neutral-900 border border-neon-orange rounded-xl shadow-[0_0_40px_rgba(255,95,31,0.25)] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 transition-all
            ${isFullscreen ? 'fixed inset-0 z-[9999] w-screen h-screen rounded-none' : 'w-[90vw] max-w-3xl h-[85vh]'}
        `}
    >

      {/* Header - z-50 ensures it stays above rotated content in presentation mode */}
      <div className={`px-5 py-3 border-b border-neutral-800 flex justify-between items-center bg-wood-800 shrink-0 ${isFullscreen ? 'bg-black border-none z-50 relative' : ''}`}>
        <div className="flex items-center gap-2">
          {!isFullscreen && (
            <>
              <h2 className="text-xl font-display text-white uppercase tracking-wider flex items-center gap-2">
                {wodId ? 'EDITAR WOD' : 'NUEVO WOD'}
              </h2>
              <span className="text-xs bg-neutral-800 px-2 py-0.5 rounded text-gray-400 font-mono">
                {date.toLocaleDateString()}
              </span>
            </>
          )}
          {isFullscreen && (
            <div className="font-display text-neon-orange text-xl tracking-widest">
              {date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* 360 Rotation Button - Toggle 16:9 / 9:16 */}
          {isFullscreen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsVerticalMode(prev => !prev);
              }}
              className={`group flex flex-col items-center justify-center transition-colors ${isVerticalMode ? 'text-neon-orange' : 'text-white/50 hover:text-neon-orange'}`}
              title={isVerticalMode ? "Cambiar a 16:9 (Horizontal)" : "Cambiar a 9:16 (Vertical)"}
            >
              <div className={`border-2 border-dashed border-current rounded-full p-2 transition-all ${isVerticalMode ? 'shadow-[0_0_15px_rgba(255,95,31,0.5)]' : 'group-hover:shadow-[0_0_10px_rgba(255,95,31,0.5)]'}`}>
                <RotateCw size={24} />
              </div>
              <span className="text-xs font-bold mt-1">{isVerticalMode ? '9:16' : '16:9'}</span>
            </button>
          )}
          <button
            onClick={toggleFullscreen}
            className={`text-gray-500 hover:text-neon-orange transition-colors p-1 ${isFullscreen ? 'text-white/50 hover:text-white hover:scale-110' : ''}`}
            title={isFullscreen ? "Salir de Modo Presentación" : "Modo Presentación"}
          >
            {isFullscreen ? <Minimize2 size={32} /> : <Maximize2 size={20} />}
          </button>
          {!isFullscreen && (
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className={`flex-1 overflow-y-auto bg-neutral-900/95 scrollbar-thin scrollbar-thumb-neon-orange/20 relative ${isFullscreen ? 'p-10 flex flex-col items-center' : 'p-4'}`}>

        {isParsing && (
          <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center p-8 backdrop-blur-sm animate-in fade-in">
            <div className="animate-spin text-neon-orange mb-4">
              <Zap size={48} />
            </div>
            <h3 className="text-white font-display text-xl uppercase tracking-widest text-center">Analizando Archivo...</h3>
            <p className="text-gray-400 text-sm mt-2 text-center max-w-sm">La IA está leyendo tu archivo (Foto, PDF o Texto) y organizando las secciones.</p>
          </div>
        )}

        {/* --- PRESENTATION MODE --- */}
        {isFullscreen ? (
          <div
            className={`mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 transition-all ${isVerticalMode ? 'fixed z-40 overflow-y-auto bg-black p-6' : 'w-full max-w-6xl'}`}
            style={isVerticalMode ? {
              transform: 'rotate(90deg)',
              width: '85vh',
              height: '90vw',
              top: '50%',
              left: '50%',
              marginTop: '-45vw',
              marginLeft: '-42.5vh',
              transformOrigin: 'center center'
            } : undefined}
          >
            {/* Main Title */}
            <div className={`text-center border-b-2 border-neon-orange/30 ${isVerticalMode ? 'pb-4' : 'pb-8'}`}>
              <h1 className={`font-display text-white tracking-tight uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] ${isVerticalMode ? 'text-5xl' : 'text-5xl md:text-7xl'}`}>
                {title || 'SIN TÍTULO'}
              </h1>
            </div>

            {/* Sections Grid */}
            <div ref={sectionsContainerRef} className={`grid grid-cols-1 ${isVerticalMode ? 'gap-6 pb-20' : 'gap-12 pb-40'}`}>
              {sections.map((section, index) => {
                const isFocused = index === focusedSectionIndex;
                return (
                  <div
                    key={section.id}
                    onClick={() => setFocusedSectionIndex(index)}
                    className={`space-y-2 ${isVerticalMode ? 'p-4' : 'p-8'} rounded-3xl transition-all duration-500 transform-gpu cursor-pointer border ${isFocused ? 'bg-neon-orange shadow-[0_0_60px_rgba(255,95,31,0.4)] scale-105 z-10 border-neon-orange' : 'opacity-30 scale-95 border-white/5 hover:opacity-50 hover:scale-100'}`}
                  >
                    <h3 className={`font-display tracking-widest uppercase border-l-8 ${isVerticalMode ? 'text-2xl pl-4 border-l-4' : 'text-2xl md:text-4xl pl-6'} transition-colors duration-500 ${isFocused ? 'text-white border-white/80' : 'text-neon-orange border-neon-orange'}`}>
                      {section.title}
                    </h3>
                    <div className={`font-mono leading-relaxed ${isVerticalMode ? 'text-lg pl-4' : 'text-xl md:text-2xl pl-8'} transition-colors duration-500 ${isFocused ? 'text-white font-semibold' : 'text-gray-400'}`}>
                      {section.content.split('\n').map((line, i) => {
                        const trimmed = line.trim();
                        // Remove explanations in parentheses
                        const cleanLine = trimmed.replace(/\s*\([^)]*\)/g, '').trim();
                        if (!cleanLine) return null; // Skip empty lines after cleaning
                        if (cleanLine.startsWith('-')) {
                          return (
                            <div key={i} className={`flex items-start ${isVerticalMode ? 'gap-2' : 'gap-4'} mb-1`}>
                              <span className={`font-bold shrink-0 ${isVerticalMode ? 'text-lg' : 'text-2xl min-w-[20px] mt-1'} ${isFocused ? 'text-white' : 'text-neon-orange'}`}>-</span>
                              <span>{cleanLine.substring(1).trim()}</span>
                            </div>
                          );
                        }
                        return <div key={i} className="mb-1 min-h-[1rem] whitespace-pre-wrap">{cleanLine}</div>;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* --- EDITOR MODE --- */
          <>
            {/* Main Title Input */}
            <div className="mb-6">
              <label className="text-xs text-neon-orange font-bold uppercase tracking-wider mb-2 block">Nombre del Entrenamiento</label>
              <div className="flex items-center gap-2 bg-black/40 border border-neutral-700 rounded-lg px-3 py-2 focus-within:border-neon-orange focus-within:ring-1 focus-within:ring-neon-orange/50">
                <Type size={18} className="text-gray-500" />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-transparent border-none text-white w-full focus:outline-none font-display tracking-wide placeholder-gray-600 text-lg"
                  placeholder="Título general del WOD..."
                />
              </div>
            </div>

            {/* Sections List */}
            <div className="flex flex-col gap-4">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  className={`bg-white/5 border rounded-lg p-3 transition-all duration-300 ${activeSectionId === section.id ? 'border-neon-orange/50 bg-white/10' : 'border-white/10'}`}
                  onClick={() => setActiveSectionId(section.id)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2 w-full">
                      <span className="text-gray-500 font-mono text-xs">{index + 1}.</span>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                        className="bg-transparent border-none text-neon-orange font-bold w-full focus:outline-none placeholder-neon-orange/30 text-sm uppercase tracking-wide"
                        placeholder="Nombre de Sección (ej: ENTRADA EN CALOR)"
                      />
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
                      className="text-gray-600 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <textarea
                    value={section.content}
                    onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                    className="w-full h-24 bg-black/40 border border-neutral-800 rounded p-2 text-white placeholder-gray-600 focus:border-neon-orange/30 focus:ring-0 outline-none resize-none font-mono text-sm leading-relaxed scrollbar-thin scrollbar-thumb-neon-orange/10"
                    placeholder="Describe los ejercicios de esta sección..."
                  />
                </div>
              ))}

              <button
                onClick={addSection}
                className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all group"
              >
                <Plus size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-bold text-sm uppercase tracking-wider">Agregar Sección</span>
              </button>
            </div>

            {/* Text Import Section */}
            <div className="mt-8 border-t border-white/10 pt-6">
              <h3 className="text-neon-orange text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                <Zap size={14} /> Importar desde Texto
              </h3>
              <div className="bg-black/40 border border-white/10 rounded-lg p-3">
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Pega aquí el texto de tu WOD (ej: desde WhatsApp o Notas)..."
                  className="w-full bg-transparent text-gray-300 text-sm focus:outline-none resize-none h-20 placeholder-gray-600 font-mono"
                />
                <div className="flex justify-end mt-2 pt-2 border-t border-white/5">
                  <button
                    onClick={handleTextImport}
                    disabled={isParsing || !rawText.trim()}
                    className="flex items-center gap-2 px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neon-orange border border-neon-orange/30 rounded text-xs font-bold tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isParsing && <Zap size={12} className="animate-spin" />}
                    ANALIZAR Y GENERAR
                  </button>
                </div>
              </div>
            </div>

            {/* Hidden Input for Unified Import */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleSmartImport}
              accept="image/*,.pdf,.txt,.md,.json"
              className="hidden"
            />
          </>
        )}
      </div>

      {/* Footer - HIDE in Fullscreen */}
      {!isFullscreen && (
        <div className="px-4 py-3 border-t border-neutral-800 flex justify-between items-center bg-wood-900/50 gap-2 shrink-0 flex-wrap">
          {wodId ? (
            <button
              onClick={handleDelete}
              className="p-2 text-red-900/50 hover:text-red-500 hover:bg-red-900/10 rounded transition-colors"
              title="Borrar WOD Completo"
            >
              <Trash2 size={18} />
            </button>
          ) : <div></div>}

          <div className="flex gap-2">

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded hover:bg-blue-500/20 hover:text-blue-300 transition-all text-xs font-bold uppercase tracking-wide group"
              title="Sube Foto, PDF o Texto y la IA lo estructurará"
            >
              <Upload size={14} className="group-hover:scale-110 transition-transform" />
              <span>Importar con IA (Foto/PDF)</span>
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-neon-orange text-black font-bold rounded hover:bg-white hover:scale-105 transition-all shadow-[0_0_10px_rgba(255,95,31,0.3)] text-xs uppercase tracking-wide"
            >
              <Save size={14} />
              <span>Guardar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // When in fullscreen, render via portal to the dedicated fullscreen container
  if (isFullscreen && fullscreenContainerRef.current) {
    return createPortal(modalContent, fullscreenContainerRef.current);
  }

  return modalContent;
};
export default WodModal;