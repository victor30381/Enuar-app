import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Trash2, Upload, Type, Plus, Maximize2, Minimize2, Image as ImageIcon, Zap, RotateCw, Copy, Clipboard, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { WodEntry, WodSection } from '../types';
import { saveWod, getWodById, deleteWod } from '../services/storageService';


interface WodModalProps {
  date: Date;
  wodId?: string;
  onClose: () => void;
  onSave: () => void;
  isDarkMode: boolean;
  isVertical: boolean;
}

const WodModal: React.FC<WodModalProps> = ({ date, wodId, onClose, onSave, isDarkMode, isVertical }) => {
  const dateIso = date.toISOString().split('T')[0];
  const [title, setTitle] = useState('');
  // Start with empty sections list to follow "only add button" request
  const [sections, setSections] = useState<WodSection[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);


  const [focusedSectionIndex, setFocusedSectionIndex] = useState(0);
  const [isVerticalMode, setIsVerticalMode] = useState(isVertical);
  const [viewAllMode, setViewAllMode] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const sectionsContainerRef = useRef<HTMLDivElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);


  const fullscreenContainerRef = useRef<HTMLDivElement | null>(null);

  // Create fullscreen container on mount
  useEffect(() => {
    const container = document.createElement('div');
    container.id = 'wod-fullscreen-container';
    container.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999; display: none; background: ${isDarkMode ? 'black' : 'white'};`;
    document.body.appendChild(container);
    fullscreenContainerRef.current = container;

    return () => {
      container.remove();
    };
  }, [isDarkMode]);

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





  const handleCopyWod = () => {
    const wodData = {
      title,
      sections
    };
    localStorage.setItem('copiedWodData', JSON.stringify(wodData));
    alert('✅ WOD copiado al portapapeles');
  };

  const handlePasteWod = () => {
    const savedData = localStorage.getItem('copiedWodData');
    if (!savedData) {
      alert('⚠️ No hay WOD copiado para pegar.');
      return;
    }

    try {
      const parsedData = JSON.parse(savedData);
      if (parsedData.title) setTitle(parsedData.title);
      if (parsedData.sections && Array.isArray(parsedData.sections)) {
        const newSections = parsedData.sections.map((s: any) => ({
          ...s,
          id: crypto.randomUUID() // Generate new IDs to avoid conflicts
        }));

        setSections(prev => {
          if (prev.length === 0 || (prev.length === 1 && !prev[0].title && !prev[0].content)) {
            return newSections;
          }
          return [...prev, ...newSections];
        });

        if (newSections.length > 0) setActiveSectionId(newSections[0].id);
      }
      alert('✅ WOD pegado correctamente');
    } catch (err) {
      console.error('Error pasting WOD:', err);
      alert('❌ Error al pegar el WOD.');
    }
  };

  const handleCopySection = (section: WodSection) => {
    localStorage.setItem('copiedSectionData', JSON.stringify(section));
    alert('✅ Sección copiada al portapapeles');
  };

  const handlePasteSection = () => {
    const savedData = localStorage.getItem('copiedSectionData');
    if (!savedData) {
      alert('⚠️ No hay sección copiada para pegar.');
      return;
    }

    try {
      const parsedSection = JSON.parse(savedData);
      const newSection: WodSection = {
        ...parsedSection,
        id: crypto.randomUUID(), // Ensure unique ID
        title: parsedSection.title || 'Sección Pegada'
      };

      setSections(prev => [...prev, newSection]);
      setActiveSectionId(newSection.id);
      alert('✅ Sección pegada correctamente');
    } catch (err) {
      console.error('Error pasting section:', err);
      alert('❌ Error al pegar la sección.');
    }
  };

  const modalContent = (
    <div
      ref={modalContainerRef}
      className={`border rounded-xl shadow-[0_0_40px_rgba(255,95,31,0.25)] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 transition-all
            ${isFullscreen ? 'fixed inset-0 z-[9999] w-screen h-screen rounded-none' : isVertical ? 'w-[90vh] max-w-[90vh] h-[90vw]' : 'w-[90vw] max-w-3xl h-[85vh]'}
            ${isDarkMode ? 'bg-neutral-900 border-neon-orange' : 'bg-white border-orange-300'}
        `}
    >

      {/* Header - z-50 ensures it stays above rotated content in presentation mode */}
      <div
        onMouseLeave={() => { if (isFullscreen) setShowControls(false); }}
        className={`px-5 py-3 border-b flex justify-between items-center shrink-0 transition-all duration-300 ease-in-out
        ${isFullscreen ? `border-none z-50 fixed top-0 left-0 w-full ${isDarkMode ? 'bg-black' : 'bg-white'}` : `relative ${isDarkMode ? 'bg-wood-800 border-neutral-800' : 'bg-orange-50 border-orange-100'}`}
        ${isFullscreen && !showControls ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}
      `}>
        <div className="flex items-center gap-2">
          {!isFullscreen && (
            <>
              <h2 className={`text-xl font-display uppercase tracking-wider flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
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
          {/* View All Toggle - Only in Fullscreen */}
          {isFullscreen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setViewAllMode(prev => !prev);
              }}
              className={`group flex flex-col items-center justify-center transition-colors ${viewAllMode ? 'text-neon-orange' : isDarkMode ? 'text-white/50 hover:text-neon-orange' : 'text-gray-400 hover:text-neon-orange'}`}
              title={viewAllMode ? "Ver por Secciones" : "Ver Todo"}
            >
              <div className={`border-2 border-dashed border-current rounded-full p-2 transition-all ${viewAllMode ? 'shadow-[0_0_15px_rgba(255,95,31,0.5)]' : 'group-hover:shadow-[0_0_10px_rgba(255,95,31,0.5)]'}`}>
                {viewAllMode ? <Eye size={24} /> : <EyeOff size={24} />}
              </div>
              <span className="text-xs font-bold mt-1">{viewAllMode ? 'TODO' : 'FOCO'}</span>
            </button>
          )}

          {/* 360 Rotation Button - Toggle 16:9 / 9:16 */}
          {isFullscreen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsVerticalMode(prev => {
                  const newValue = !prev;
                  localStorage.setItem('wodIsVerticalMode', JSON.stringify(newValue));
                  return newValue;
                });
              }}
              className={`group flex flex-col items-center justify-center transition-colors ${isVerticalMode ? 'text-neon-orange' : isDarkMode ? 'text-white/50 hover:text-neon-orange' : 'text-gray-400 hover:text-neon-orange'}`}
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
            className={`text-gray-500 hover:text-neon-orange transition-colors p-1 ${isFullscreen ? (isDarkMode ? 'text-white/50 hover:text-white hover:scale-110' : 'text-gray-400 hover:text-gray-800 hover:scale-110') : ''}`}
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

      {/* Trigger Tab for Vertical Mode Controls */}
      {isFullscreen && !showControls && (
        <div
          className="fixed top-0 left-1/2 -translate-x-1/2 z-[10000] bg-black/50 hover:bg-neon-orange text-neon-orange hover:text-black px-8 py-1 rounded-b-xl cursor-pointer transition-all backdrop-blur-sm border-b border-x border-neon-orange/30 shadow-[0_4px_20px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-top-2"
          onMouseEnter={() => setShowControls(true)}
          onClick={() => setShowControls(true)}
          title="Mostrar controles"
        >
          <ChevronDown size={28} />
        </div>
      )}

      {/* Body */}
      <div className={`flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neon-orange/20 relative ${isFullscreen ? 'p-10 flex flex-col items-center' : 'p-4'} ${isDarkMode ? 'bg-neutral-900/95' : 'bg-white'}`}>



        {/* --- PRESENTATION MODE --- */}
        {isFullscreen ? (
          <div
            className={`mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 transition-all 
              ${isVerticalMode ? `fixed z-40 overflow-y-auto p-6 ${isDarkMode ? 'bg-black' : 'bg-white'}` : 'w-full max-w-6xl'}
              ${!isVerticalMode && viewAllMode ? 'h-full flex flex-col justify-center' : 'space-y-8'}
            `}
            style={(isVerticalMode && !viewAllMode) ? {
              transform: 'rotate(90deg)',
              width: '100vh',
              height: '100vw',
              top: '50%',
              left: '50%',
              marginTop: '-50vw',
              marginLeft: '-50vh',
              transformOrigin: 'center center'
            } : isVerticalMode ? {
              transform: 'rotate(90deg)',
              width: '100vh',
              height: '100vw',
              top: '50%',
              left: '50%',
              marginTop: '-50vw',
              marginLeft: '-50vh',
              transformOrigin: 'center center'
            } : undefined}
          >
            {/* Main Title */}
            <div className={`text-center border-b-2 border-neon-orange/30 ${isVerticalMode ? 'pb-4' : (!isVerticalMode && viewAllMode) ? 'mb-4 pb-2' : 'pb-8'}`}>
              <h1 className={`font-display tracking-tight uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] 
                ${isVerticalMode ? 'text-7xl' : (!isVerticalMode && viewAllMode) ? 'text-5xl md:text-6xl' : 'text-5xl md:text-7xl'}
                ${isDarkMode ? 'text-white' : 'text-black'}
              `}>
                {title || 'SIN TÍTULO'}
              </h1>
            </div>

            {/* Sections Grid */}
            <div ref={sectionsContainerRef} className={`grid 
              ${isVerticalMode ? 'grid-cols-1 gap-6 pb-20' :
                (!isVerticalMode && viewAllMode) ? 'grid-cols-2 gap-6 pb-0 overflow-y-auto pr-2' :
                  'grid-cols-1 gap-12 pb-40'}
            `}>
              {sections.map((section, index) => {
                const isFocused = index === focusedSectionIndex;
                // If viewAllMode is ON, everything is treated as focused/visible
                const isItemVisible = viewAllMode || isFocused;

                return (
                  <div
                    key={section.id}
                    onClick={() => setFocusedSectionIndex(index)}
                    className={`space-y-2 rounded-3xl transition-all duration-500 transform-gpu cursor-pointer border 
                      ${isVerticalMode ? 'p-4' : (!isVerticalMode && viewAllMode) ? 'p-5' : 'p-8'}
                      ${isItemVisible
                        ? 'bg-neon-orange shadow-[0_0_60px_rgba(255,95,31,0.4)] scale-105 z-10 border-neon-orange'
                        : `opacity-30 scale-95 hover:opacity-50 hover:scale-100 ${isDarkMode ? 'border-white/5' : 'border-black/5'}`
                      }
                    `}
                  >
                    <h3 className={`font-display tracking-widest uppercase border-l-8 
                      ${isVerticalMode ? 'text-4xl pl-6 border-l-8' : (!isVerticalMode && viewAllMode) ? 'text-2xl md:text-3xl pl-4 border-l-4' : 'text-2xl md:text-4xl pl-6'} 
                      transition-colors duration-500 
                      ${isItemVisible
                        ? 'text-white border-white/80'
                        : isDarkMode ? 'text-neon-orange border-neon-orange' : 'text-orange-600 border-orange-400'}
                    `}>
                      {section.title}
                    </h3>
                    <div className={`font-mono leading-relaxed 
                      ${isVerticalMode ? 'text-2xl pl-6' : (!isVerticalMode && viewAllMode) ? 'text-lg md:text-xl pl-4' : 'text-xl md:text-2xl pl-8'} 
                      transition-colors duration-500 
                      ${isItemVisible
                        ? 'text-white font-semibold'
                        : isDarkMode ? 'text-gray-400' : 'text-gray-600'}
                    `}>
                      {section.content.split('\n').map((line, i) => {
                        const trimmed = line.trim();
                        // Remove explanations in parentheses
                        const cleanLine = trimmed.replace(/\s*\([^)]*\)/g, '').trim();
                        if (!cleanLine) return null; // Skip empty lines after cleaning
                        if (cleanLine.startsWith('-')) {
                          return (
                            <div key={i} className={`flex items-start ${isVerticalMode ? 'gap-3' : 'gap-4'} mb-1`}>
                              <span className={`font-bold shrink-0 ${isVerticalMode ? 'text-2xl min-w-[20px]' : 'text-2xl min-w-[20px] mt-1'} ${isFocused ? 'text-white' : 'text-neon-orange'}`}>-</span>
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
              <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 focus-within:border-neon-orange focus-within:ring-1 focus-within:ring-neon-orange/50 transition-colors
                ${isDarkMode ? 'bg-black/40 border-neutral-700' : 'bg-gray-50 border-gray-200'}
              `}>
                <Type size={18} className="text-gray-500" />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`bg-transparent border-none w-full focus:outline-none font-display tracking-wide text-lg
                    ${isDarkMode ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}
                  `}
                  placeholder="Título general del WOD..."
                />
              </div>
            </div>

            {/* Sections List */}
            <div className="flex flex-col gap-4">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  className={`border rounded-lg p-3 transition-all duration-300 
                    ${activeSectionId === section.id
                      ? `border-neon-orange/50 ${isDarkMode ? 'bg-white/10' : 'bg-orange-50'}`
                      : `${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`
                    }
                  `}
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
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopySection(section); }}
                        className="text-gray-600 hover:text-neon-orange transition-colors p-1"
                        title="Copiar Sección"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
                        className="text-gray-600 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={section.content}
                    onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                    className={`w-full h-24 border rounded p-2 focus:border-neon-orange/30 focus:ring-0 outline-none resize-none font-mono text-sm leading-relaxed scrollbar-thin scrollbar-thumb-neon-orange/10
                      ${isDarkMode
                        ? 'bg-black/40 border-neutral-800 text-white placeholder-gray-600'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                      }
                    `}
                    placeholder="Describe los ejercicios de esta sección..."
                  />
                </div>
              ))}

              <div className="flex gap-2">
                <button
                  onClick={addSection}
                  className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all group flex-1"
                >
                  <Plus size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-sm uppercase tracking-wider">Agregar Sección</span>
                </button>

                <button
                  onClick={handlePasteSection}
                  className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-neon-orange/20 rounded-lg text-neon-orange/70 hover:text-neon-orange hover:border-neon-orange/50 hover:bg-neon-orange/5 transition-all group flex-1"
                  title="Pegar Sección Copiada"
                >
                  <Clipboard size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-sm uppercase tracking-wider">Pegar Sección</span>
                </button>
              </div>
            </div>




          </>
        )}
      </div>

      {/* Footer - HIDE in Fullscreen */}
      {!isFullscreen && (
        <div className={`px-4 py-3 border-t flex justify-between items-center gap-2 shrink-0 flex-wrap transition-colors
          ${isDarkMode ? 'bg-wood-900/50 border-neutral-800' : 'bg-orange-50 border-orange-100'}
        `}>
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
              onClick={handleCopyWod}
              className="p-2 text-neon-orange hover:bg-neon-orange/10 rounded transition-colors"
              title="Copiar WOD"
            >
              <Copy size={18} />
            </button>
            <button
              onClick={handlePasteWod}
              className="p-2 text-neon-orange hover:bg-neon-orange/10 rounded transition-colors"
              title="Pegar WOD"
            >
              <Clipboard size={18} />
            </button>
            <div className="w-px bg-neutral-800 mx-1"></div>



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