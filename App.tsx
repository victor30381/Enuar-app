import React, { useState, useEffect } from 'react';
import { Menu, RotateCw, X, Sun, Moon, Upload, LogOut, Loader2 } from 'lucide-react';
import Calendar from './components/Calendar';
import WodModal from './components/WodModal';
import DateOptionsModal from './components/DateOptionsModal';
import { AuthProvider, useAuth } from './components/AuthProvider';
import LoginScreen from './components/LoginScreen';
import { migrateLocalStorageToFirestore } from './services/storageService';

type ModalType = 'none' | 'options' | 'editor';

function AppContent() {
  const { user, loading, signOut } = useAuth();
  const [rotation, setRotation] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentModal, setCurrentModal] = useState<ModalType>('none');
  const [selectedWodId, setSelectedWodId] = useState<string | undefined>(undefined);
  const [dataVersion, setDataVersion] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);

  // Run migration on first login
  useEffect(() => {
    if (user && !loading) {
      const runMigration = async () => {
        setIsMigrating(true);
        try {
          const count = await migrateLocalStorageToFirestore();
          if (count > 0) {
            console.log(`Migrated ${count} WODs from localStorage to Firestore`);
            setDataVersion(prev => prev + 1);
          }
        } catch (err) {
          console.error('Migration error:', err);
        } finally {
          setIsMigrating(false);
        }
      };
      runMigration();
    }
  }, [user, loading]);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setCurrentModal('options');
  };

  const handleCloseModal = () => {
    setSelectedDate(null);
    setCurrentModal('none');
    setSelectedWodId(undefined);
  };

  const handleNewWod = (date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
    setSelectedWodId(undefined);
    setCurrentModal('editor');
  };

  const handleEditWod = (id: string) => {
    setSelectedWodId(id);
    setCurrentModal('editor');
  };

  const handleSaveWod = () => {
    setDataVersion(prev => prev + 1);
  };

  const handleSignOut = async () => {
    setIsMenuOpen(false);
    await signOut();
  };

  // Show loading spinner
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-wood-900 flex items-center justify-center">
        <div className="absolute inset-0 bg-wood-pattern bg-cover opacity-20 pointer-events-none mix-blend-overlay"></div>
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="animate-spin text-neon-orange" />
          <span className="text-white font-bold">Cargando...</span>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <LoginScreen />;
  }

  // Show migration progress
  if (isMigrating) {
    return (
      <div className="min-h-screen w-full bg-wood-900 flex items-center justify-center">
        <div className="absolute inset-0 bg-wood-pattern bg-cover opacity-20 pointer-events-none mix-blend-overlay"></div>
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="animate-spin text-neon-orange" />
          <span className="text-white font-bold">Migrando datos...</span>
          <span className="text-gray-400 text-sm">Esto solo sucede una vez</span>
        </div>
      </div>
    );
  }

  // Determine container dimensions based on rotation to ensure fit
  const isVertical = rotation === 90 || rotation === 270;

  return (
    <div className={`relative h-screen w-full flex items-center justify-center overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-wood-900' : 'bg-gradient-to-br from-orange-50 via-white to-amber-50'}`}>
      {/* Background Texture Overlay */}
      {isDarkMode ? (
        <>
          <div className="absolute inset-0 bg-wood-pattern bg-cover opacity-20 pointer-events-none mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none"></div>
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-orange-100/50 via-transparent to-amber-100/50 pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-96 h-96 bg-neon-orange/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-300/20 rounded-full blur-3xl pointer-events-none"></div>
        </>
      )}

      {/* Controls - Fixed to screen */}
      <div className="fixed top-6 right-6 z-50 flex gap-4 items-start">
        <button
          onClick={handleRotate}
          className={`group flex flex-col items-center justify-center bg-transparent transition-colors ${isDarkMode ? 'text-white hover:text-neon-orange' : 'text-gray-700 hover:text-neon-orange'}`}
        >
          <div className="border-2 border-dashed border-current rounded-full p-2 group-hover:neon-box transition-all">
            <RotateCw size={24} />
          </div>
          <span className="text-xs font-bold mt-1">360°</span>
        </button>

        {/* Hamburger Menu */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`transition-colors ${isDarkMode ? 'text-white hover:text-neon-orange' : 'text-gray-700 hover:text-neon-orange'}`}
          >
            {isMenuOpen ? <X size={40} /> : <Menu size={40} />}
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className={`absolute top-14 right-0 border rounded-xl shadow-[0_0_30px_rgba(255,95,31,0.2)] backdrop-blur-md min-w-[220px] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${isDarkMode ? 'bg-neutral-900/95 border-neon-orange/30' : 'bg-white/95 border-orange-200'}`}>
              <div className="py-2">
                {/* User Email */}
                <div className={`px-5 py-2 text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {user.email}
                </div>

                {/* Separator */}
                <div className={`border-t my-1 ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}></div>

                {/* Dark/Light Mode Toggle */}
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-neon-orange/10 hover:text-neon-orange transition-colors ${isDarkMode ? 'text-white' : 'text-gray-700'}`}
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                  <span className="font-bold text-sm uppercase tracking-wide">
                    {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
                  </span>
                </button>

                {/* Separator */}
                <div className={`border-t my-1 ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}></div>

                {/* Load WODs */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setSelectedDate(new Date());
                    setCurrentModal('options');
                  }}
                  className={`w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-neon-orange/10 hover:text-neon-orange transition-colors ${isDarkMode ? 'text-white' : 'text-gray-700'}`}
                >
                  <Upload size={20} />
                  <span className="font-bold text-sm uppercase tracking-wide">Cargar WOD</span>
                </button>

                {/* Separator */}
                <div className={`border-t my-1 ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}></div>

                {/* Logout */}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left text-gray-400 hover:bg-red-900/10 hover:text-red-400 transition-colors"
                >
                  <LogOut size={20} />
                  <span className="font-bold text-sm uppercase tracking-wide">Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Rotatable Container */}
      <div
        className={`transition-all duration-500 ease-in-out shadow-2xl border ${isDarkMode ? 'bg-black/20 backdrop-blur-sm border-white/5' : 'bg-white/40 backdrop-blur-md border-orange-200/50'}`}
        style={{
          transform: `rotate(${rotation}deg)`,
          width: isVertical ? '100vh' : '100vw',
          height: isVertical ? '100vw' : '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem'
        }}
      >
        {/* Header / Logo */}
        <div className="absolute top-10 left-10 md:left-20 text-left z-20">
          <img
            src="logo.png"
            alt="ENUAR W.O.D"
            className={`w-36 md:w-48 drop-shadow-2xl ${isDarkMode ? 'shadow-black' : ''}`}
          />
          <div className={`font-bold tracking-[0.5em] text-sm md:text-lg ml-1 text-center opacity-80 mt-2 ${isDarkMode ? 'text-white' : 'text-gray-600'}`}>
            W.O.D
          </div>
        </div>

        {/* Content */}
        <div className="w-full max-w-4xl z-10 mt-20 md:mt-0">
          {/* Key prop ensures calendar refreshes when dataVersion changes */}
          <Calendar key={dataVersion} onDateSelect={handleDateSelect} isDarkMode={isDarkMode} isVertical={isVertical} />
        </div>



      </div>

      {/* Modal Overlay - Fixed to viewport */}
      {selectedDate && currentModal !== 'none' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleCloseModal}
          ></div>

          {/* Rotated Container for Modal */}
          <div
            style={{ transform: `rotate(${rotation}deg)` }}
            className="relative z-10 transition-transform duration-500"
          >
            {currentModal === 'options' && (
              <DateOptionsModal
                date={selectedDate}
                onClose={handleCloseModal}
                onNewWod={handleNewWod}
                onEditWod={handleEditWod}
              />
            )}
            {currentModal === 'editor' && (
              <WodModal
                date={selectedDate}
                wodId={selectedWodId}
                onClose={handleCloseModal}
                onSave={handleSaveWod}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;