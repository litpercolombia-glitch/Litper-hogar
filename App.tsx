
import React, { useState, useEffect, useRef } from 'react';
import Visualizer from './components/Visualizer';
import { BED_COLORS } from './constants';
import { BedColor, VisualizerState } from './types';

const App: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Lifted state for persistence
  const [visualizerState, setVisualizerState] = useState<VisualizerState>({
    image: null,
    generatedImage: null,
    isShowingOriginal: false,
    marketingText: null,
    selectedColor: BED_COLORS[0]
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Function to handle "Continuar compra" - closes modal but saves state for 30s
  const handleCloseAndSave = () => {
    setIsOpen(false);
    
    // Clear any existing timer
    if (timerRef.current) clearTimeout(timerRef.current);
    
    // Set a timer to reset state after 30 seconds
    timerRef.current = setTimeout(() => {
      setVisualizerState({
        image: null,
        generatedImage: null,
        isShowingOriginal: false,
        marketingText: null,
        selectedColor: BED_COLORS[0]
      });
      console.log('Session expired, state reset.');
    }, 30000); 
  };

  // If user re-opens the app, clear the timer so state doesn't disappear while they are looking at it
  useEffect(() => {
    if (isOpen && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [isOpen]);

  // If closed, show the Floating Action Bubble
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-2 group">
        <div className="bg-gradient-to-r from-gray-900 to-black px-4 py-2 rounded-xl shadow-2xl mb-2 animate-bounce origin-bottom-right border border-yellow-500/30">
            <p className="text-[10px] font-bold text-yellow-400 tracking-widest uppercase">✨ ¡Pruébalo en tu cama!</p>
        </div>
        <button 
          onClick={() => setIsOpen(true)}
          className="relative bg-black text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center w-20 h-20 ring-2 ring-yellow-600 overflow-hidden group-hover:ring-4 group-hover:ring-yellow-500"
          title="Litper Oficial"
        >
          {/* Luxurious Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800"></div>
          
          {/* Text Only Logo - LITPER OFICIAL */}
          <div className="relative z-10 flex flex-col items-center justify-center leading-none p-1">
             <span className="font-serif font-black text-sm text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-700 tracking-widest mb-0.5" 
                   style={{ 
                     fontFamily: '"Times New Roman", Times, serif', 
                     textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                   }}>
                LITPER
             </span>
             <span className="text-[8px] text-white font-sans font-bold tracking-[0.15em] opacity-90">
                OFICIAL
             </span>
          </div>
          
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -translate-x-full group-hover:translate-x-full"></div>
        </button>
      </div>
    );
  }

  // If open, show the Main Widget Modal
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-md bg-black/40 p-0 sm:p-4">
      <div className="bg-white w-full h-[95vh] sm:h-[85vh] sm:w-[420px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up relative ring-1 ring-white/50">
        
        {/* Header - Updated with Dark Theme */}
        <header className="bg-gray-900 text-white p-5 flex justify-between items-center shrink-0 shadow-lg z-20">
          <div>
            <h1 className="font-bold text-xl tracking-tight text-white flex items-center">
              <span>Litper Hogar</span>
              <span className="ml-2 text-xs bg-indigo-500 px-2 py-0.5 rounded text-white font-medium">Oficial</span>
            </h1>
          </div>
          <button 
            onClick={handleCloseAndSave}
            className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-500 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden relative bg-white">
          <Visualizer 
            onClose={handleCloseAndSave} 
            state={visualizerState}
            setState={setVisualizerState}
          />
        </main>

      </div>
    </div>
  );
};

export default App;
