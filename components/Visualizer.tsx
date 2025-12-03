
import React, { useState, useRef } from 'react';
import { BED_COLORS, DEFAULT_ROOM_TEMPLATE, ROOM_TEMPLATES } from '../constants';
import { BedColor, VisualizerState } from '../types';
import { editImageWithGemini, generateMarketingCopy } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface VisualizerProps {
  onClose: () => void;
  state: VisualizerState;
  setState: React.Dispatch<React.SetStateAction<VisualizerState>>;
}

const Visualizer: React.FC<VisualizerProps> = ({ onClose, state, setState }) => {
  const { image, generatedImage, isShowingOriginal, marketingText, selectedColor } = state;
  const [loading, setLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [roomDescription, setRoomDescription] = useState("");
  const [showColorHint, setShowColorHint] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const updateState = (updates: Partial<VisualizerState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateState({
          image: reader.result as string,
          generatedImage: null, // Reset generated on new upload
          marketingText: null,
          isShowingOriginal: false
        });
        setShowTemplates(false);
        setRoomDescription("");
        setShowColorHint(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTemplateSelect = (template: typeof ROOM_TEMPLATES[0]) => {
    let imgToUse = template.base64;
    
    // Fallback if the constant is empty
    if (!imgToUse) {
       imgToUse = DEFAULT_ROOM_TEMPLATE;
    }

    updateState({
        image: imgToUse,
        generatedImage: null,
        marketingText: null
    });
    // We set the description to the template's description so the AI keeps the style
    setRoomDescription(template.description);
    setShowTemplates(false);
    
    // Show visual hint to select color
    setShowColorHint(true);
    setTimeout(() => setShowColorHint(false), 5000); // Hide hint after 5s
  };

  const handleGenerate = async () => {
    const sourceImage = image || DEFAULT_ROOM_TEMPLATE;
    if (!sourceImage) {
        alert("Por favor sube una imagen o selecciona un diseño.");
        return;
    }
    
    setLoading(true);
    updateState({ marketingText: null, isShowingOriginal: false });
    setShowColorHint(false);
    
    try {
      // If roomDescription is set (template mode), we pass it to the AI
      const descriptionToUse = roomDescription || undefined;

      // Parallel execution for speed
      const imagePromise = editImageWithGemini(sourceImage, selectedColor.promptTerm, descriptionToUse);
      // Generate marketing copy based on the result
      const textPromise = generateMarketingCopy(sourceImage, selectedColor.name);

      const [imgResult, textResult] = await Promise.all([imagePromise, textPromise]);
      
      updateState({
        generatedImage: imgResult,
        marketingText: textResult,
        image: sourceImage // Ensure image is set if it was null before
      });
    } catch (error) {
      alert("Error al generar. Inténtalo de nuevo.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `litper-hogar-${selectedColor.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
        const scrollAmount = 150;
        scrollContainerRef.current.scrollBy({ 
            left: direction === 'left' ? -scrollAmount : scrollAmount, 
            behavior: 'smooth' 
        });
    }
  };

  // Determine which image to display
  const displayImage = (generatedImage && !isShowingOriginal) ? generatedImage : image;

  return (
    <div className="flex flex-col h-full bg-white text-gray-900">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto pb-40 scrollbar-hide">
        
        {/* Section 1: Image Upload/Display */}
        <div className="relative w-full bg-gray-100 flex items-center justify-center overflow-hidden group min-h-[350px]">
          {displayImage ? (
            <div className="relative w-full h-full flex items-center justify-center bg-gray-200 overflow-hidden">
                <img 
                src={displayImage} 
                alt="Room Visualization" 
                className={`w-full h-auto max-h-[60vh] object-contain shadow-md transition-all duration-500 ease-in-out ${loading ? 'scale-105 blur-sm' : ''}`}
                />
                
                {/* LOADING OVERLAY - ELEGANT SCANNING EFFECT */}
                {loading && (
                    <div className="absolute inset-0 z-40 bg-black/30 backdrop-blur-[2px] flex flex-col items-center justify-center transition-all duration-500">
                        {/* Scanning Laser Line */}
                        <div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_15px_rgba(129,140,248,0.9)] animate-scan"></div>
                        
                        {/* Status Pill */}
                        <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl flex items-center space-x-3 animate-pulse border border-white/50">
                            <div className="flex space-x-1">
                                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                            <span className="text-indigo-900 font-bold text-xs tracking-widest uppercase">Diseñando tu cama...</span>
                        </div>
                    </div>
                )}

                {/* Visual Hint for Template Users (Only when NOT loading and NOT generated) */}
                {showColorHint && !generatedImage && !loading && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 animate-bounce w-full text-center px-4">
                        <div className="bg-indigo-600 text-white text-xs px-4 py-2 rounded-full shadow-lg font-bold inline-flex items-center space-x-2">
                            <span>👇</span>
                            <span>Ahora elige un color abajo</span>
                        </div>
                    </div>
                )}
            </div>
          ) : (
             // Default Upload UI
            <div className="text-center p-10 animate-fade-in flex flex-col items-center">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-gray-100 rotate-3 transform transition-transform group-hover:rotate-0">
                <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <h3 className="text-gray-900 font-bold text-lg mb-2">Visualizador 3D</h3>
              <p className="text-gray-500 text-xs mb-6 max-w-[200px] leading-relaxed">Sube una foto de tu cama y prueba nuestros protectores al instante.</p>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5 mb-4 w-48"
              >
                Subir Foto
              </button>
            </div>
          )}
          
          {/* Visual Cue: Active View Badge */}
          {generatedImage && !loading && (
            <div className="absolute top-4 left-4 z-20 flex space-x-2">
               <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-wide text-white shadow-lg backdrop-blur-md transition-colors border border-white/20 ${isShowingOriginal ? 'bg-black/70' : 'bg-indigo-600'}`}>
                 {isShowingOriginal ? 'FOTO ORIGINAL' : 'DISEÑO LITPER'}
               </span>
            </div>
          )}

          {/* Action Buttons Overlay */}
          {generatedImage && !loading && (
            <div className="absolute top-4 right-4 flex flex-col space-y-2 z-20">
                {/* Toggle Button */}
                <button 
                onClick={() => updateState({ isShowingOriginal: !isShowingOriginal })}
                className="bg-white text-indigo-900 text-xs px-4 py-2 rounded-full hover:bg-indigo-50 transition-all font-bold shadow-xl flex items-center justify-center space-x-2 border border-indigo-100"
                >
                  {isShowingOriginal ? (
                    <>
                      <span>✨</span>
                      <span>Ver Resultado</span>
                    </>
                  ) : (
                    <>
                      <span>👁️</span>
                      <span>Ver Original</span>
                    </>
                  )}
                </button>

                {/* Download Button */}
                <button 
                  onClick={handleDownload}
                  className="bg-black/60 hover:bg-black/80 text-white text-xs px-4 py-2 rounded-full backdrop-blur-md transition-all font-bold shadow-xl flex items-center justify-center space-x-2 border border-white/20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                  <span>Descargar</span>
                </button>
            </div>
          )}
          
          {/* Change Photo Button (Bottom Right) */}
          {image && !loading && !showTemplates && (
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="absolute bottom-4 right-4 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full backdrop-blur-sm transition-all z-20 shadow-lg border border-white"
               title="Cambiar foto"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
             </button>
          )}

          {/* Change Design Button (Bottom Left) - Only if using Template */}
          {image && !loading && !showTemplates && roomDescription && (
            <button 
                onClick={() => {
                    setShowTemplates(true);
                    updateState({ generatedImage: null, marketingText: null });
                }}
                className="absolute bottom-4 left-4 bg-white/90 hover:bg-white text-indigo-900 text-[10px] font-bold px-3 py-2 rounded-lg backdrop-blur-sm transition-all z-20 shadow-lg border border-white flex items-center"
            >
                <span className="mr-1">🎨</span> Cambiar Diseño
            </button>
          )}

          {/* Hidden Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="image/*"
          />
        </div>

        {/* Section 2: Product Selector */}
        <div className="p-6 bg-white rounded-t-3xl -mt-6 relative z-10 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] border-t border-gray-100">
          
          {/* No Image Option - Positioned ABOVE catalog as requested */}
          {!loading && (
             <div className="mb-6">
                 {!showTemplates ? (
                     <button 
                        onClick={() => setShowTemplates(true)}
                        className="w-full text-center border border-dashed border-gray-300 rounded-xl p-3 text-xs text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-center justify-center space-x-2"
                     >
                        <span>🖼️</span>
                        <span>¿No tienes foto? Elige uno de nuestros diseños</span>
                     </button>
                 ) : (
                     <div className="animate-fade-in bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Elige un estilo de habitación</h3>
                            <button onClick={() => setShowTemplates(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {ROOM_TEMPLATES.map((tpl) => (
                                <button 
                                    key={tpl.id}
                                    onClick={() => handleTemplateSelect(tpl)}
                                    className={`relative rounded-lg overflow-hidden h-20 group border-2 transition-all ${roomDescription === tpl.description ? 'border-indigo-600 ring-1 ring-indigo-200' : 'border-gray-200 hover:border-indigo-300'}`}
                                >
                                    <img src={tpl.base64} alt={tpl.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-all">
                                        <span className="text-white text-[10px] font-bold text-center px-1">{tpl.name}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                     </div>
                 )}
             </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Catálogo de Colores</h3>
            {selectedColor && <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">{selectedColor.name}</span>}
          </div>
          
          <div className="relative group/scroll">
            {/* Scroll Left Button */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20 pointer-events-auto bg-gradient-to-r from-white via-white/80 to-transparent pr-8 py-4 h-full flex items-center">
                 <button 
                     onClick={() => scroll('left')}
                     className="bg-white hover:bg-gray-50 p-2 rounded-full shadow-md border border-gray-100 transition-colors cursor-pointer active:scale-95"
                 >
                     <svg className="w-5 h-5 text-indigo-600 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                 </button>
            </div>

            <div 
              ref={scrollContainerRef}
              className="flex space-x-4 overflow-x-auto pb-6 pt-2 px-10 scrollbar-hide justify-start relative z-10"
            >
              {BED_COLORS.map((color) => (
                <div 
                  key={color.id} 
                  className="flex flex-col items-center flex-shrink-0 cursor-pointer group space-y-2 w-16"
                  onClick={() => {
                      updateState({ selectedColor: color });
                      setShowColorHint(false);
                  }}
                >
                  {/* Rounded Thumbnail with Diamond Texture to mimic product image */}
                  <div 
                    className={`w-14 h-14 rounded-2xl shadow-md transition-all duration-300 diamond-texture transform group-hover:scale-110 group-hover:shadow-xl border relative ${selectedColor.id === color.id ? 'ring-4 ring-offset-2 ring-indigo-600 scale-105 border-transparent' : 'border-gray-200'}`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                  </div>
                  <span className={`text-[10px] font-bold text-center leading-tight ${selectedColor.id === color.id ? 'text-indigo-700' : 'text-gray-500'}`}>
                    {color.name}
                  </span>
                </div>
              ))}
              {/* Spacer to ensure last item is visible */}
              <div className="w-4 flex-shrink-0"></div>
            </div>
            
            {/* Scroll Right Button */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20 pointer-events-auto bg-gradient-to-l from-white via-white/80 to-transparent pl-8 py-4 h-full flex items-center">
               <button 
                 onClick={() => scroll('right')}
                 className="animate-bounce-right bg-white hover:bg-gray-50 p-2 rounded-full shadow-md border border-gray-100 transition-colors cursor-pointer active:scale-95"
               >
                   <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
               </button>
            </div>
          </div>

            {/* Section 3: Action Button */}
            <div className="mt-2">
            <button
                onClick={handleGenerate}
                disabled={!image || loading}
                className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-xl transition-all transform active:scale-95 flex items-center justify-center space-x-3
                ${!image ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-black hover:shadow-2xl ring-1 ring-black/50'}
                `}
            >
                {loading ? (
                <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generando Diseño...</span>
                </>
                ) : (
                <>
                    <span>VER EN MI CAMA</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </>
                )}
            </button>
            </div>
        </div>

        {/* Section 4: AI Analysis & Marketing */}
        {marketingText && !isShowingOriginal && (
          <div className="px-6 pb-6 animate-slide-up">
            <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 shadow-inner">
                <h4 className="flex items-center text-indigo-900 font-extrabold mb-3 text-sm uppercase tracking-wide">
                    <span className="mr-2 text-lg">💡</span> Opinión del Experto
                </h4>
                {/* Properly styled markdown list */}
                <div className="prose prose-sm prose-indigo text-indigo-900/90 leading-snug text-sm font-medium [&>ul]:list-disc [&>ul]:pl-5 [&>ul>li]:mb-1">
                   <ReactMarkdown>{marketingText}</ReactMarkdown>
                </div>
            </div>
          </div>
        )}

        {/* Section 5: 5 Razones (Llamativas) */}
        {!marketingText && (
            <div className="px-6 pb-6 pt-2">
              <h4 className="text-gray-900 font-extrabold text-sm uppercase mb-4 tracking-widest border-b border-gray-100 pb-2">
                  5 Razones para elegirnos
              </h4>
              <div className="space-y-3">
                  {[
                  { emoji: '🛡️', title: 'Blindaje Total', desc: 'Antifluido e invisible.' },
                  { emoji: '💎', title: 'Textura Diamante', desc: 'Acolchado de lujo que respira.' },
                  { emoji: '⏳', title: 'Edición Limitada', desc: 'Colores exclusivos que vuelan.' },
                  { emoji: '🚚', title: 'Envío GRATIS', desc: 'Solo por tiempo limitado.' },
                  { emoji: '✅', title: 'Ajuste Perfecto', desc: 'No se mueve ni hace ruido.' }
                  ].map((item, idx) => (
                  <div 
                      key={idx} 
                      className="flex items-center p-3 bg-white rounded-xl shadow-sm border border-gray-100 animate-bounce-in hover-float"
                      style={{ animationDelay: `${idx * 100}ms` }}
                  >
                      <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-xl mr-3 shadow-sm">
                          {item.emoji}
                      </div>
                      <div>
                          <p className="text-sm font-black text-gray-800 leading-tight">{item.title}</p>
                          <p className="text-xs text-gray-500 font-medium">{item.desc}</p>
                      </div>
                  </div>
                  ))}
              </div>

              {/* Testimonials Section */}
              <div className="mt-8 animate-bounce-in" style={{ animationDelay: '600ms' }}>
                 <h4 className="text-gray-900 font-extrabold text-sm uppercase mb-4 tracking-widest border-b border-gray-100 pb-2">
                    Clientes Felices
                 </h4>
                 <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2">
                    {[
                      { name: "Maria G.", stars: 5, text: "La textura es increíble, se ve súper elegante y no suena nada." },
                      { name: "Carlos R.", stars: 5, text: "Ajusta perfecto, no se sale como otros. Muy recomendado." },
                      { name: "Ana P.", stars: 5, text: "Me encanta que sea antifluido de verdad. Salvó mi colchón." }
                    ].map((t, i) => (
                      <div key={i} className="flex-shrink-0 w-64 bg-gray-50 p-4 rounded-xl border border-gray-100">
                         <div className="flex text-yellow-400 mb-2">
                           {"★".repeat(t.stars)}
                         </div>
                         <p className="text-xs text-gray-600 italic mb-2">"{t.text}"</p>
                         <p className="text-xs font-bold text-gray-900 text-right">- {t.name}</p>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
        )}
      </div>

      {/* Footer CTA and Link */}
      <div className="absolute bottom-0 w-full bg-white border-t border-gray-100 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-30 flex flex-col items-center">
        {/* Promo Link */}
        <div className="text-center mb-3 w-full animate-bounce-in" style={{ animationDelay: '500ms' }}>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">SI DESEAS APROVECHAR LA PROMOCION DALE CLICK AQUI:</p>
          <a 
            href="https://litper.store/products/protector-de-colchon-acolchado-antifluidos-lleva-gratis-2-fundas-de-almohadas-1" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-indigo-600 font-black text-lg hover:underline block hover:text-indigo-800 transition-colors"
          >
            ProtectoresPremium.com
          </a>
        </div>

        <button 
          className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition-colors flex justify-between items-center px-6 shadow-xl hover:shadow-2xl transform active:scale-[0.99]"
          onClick={onClose}
        >
          <span className="text-lg">Continuar compra</span>
          <span className="bg-white/20 text-xs px-2 py-1 rounded text-white font-bold animate-pulse">ENVÍO GRATIS</span>
        </button>
      </div>
    </div>
  );
};

export default Visualizer;
