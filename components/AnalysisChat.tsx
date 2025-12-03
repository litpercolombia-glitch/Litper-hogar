import React, { useState, useRef } from 'react';
import { analyzeImageWithGemini, sendChatMessage } from '../services/geminiService';
import { ChatMessage } from '../types';

const AnalysisChat: React.FC = () => {
  // Analysis State
  const [analysisImage, setAnalysisImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: '¡Hola! Soy tu asistente LITPER. ¿Tienes preguntas sobre envíos, materiales o colores?' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Handlers for Analysis
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAnalysisImage(reader.result as string);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!analysisImage) return;
    setAnalyzing(true);
    try {
      const result = await analyzeImageWithGemini(analysisImage);
      setAnalysisResult(result);
    } catch (err) {
      setAnalysisResult("Error al analizar la imagen.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Handlers for Chat
  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    const response = await sendChatMessage(userMsg);
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setChatLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      
      {/* Tabs / Segmented Control logic would go here if split, but we stack them for the "Modal" feel */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Module 1: Room Analysis */}
        <section className="bg-indigo-50 rounded-xl p-5 border border-indigo-100">
          <h3 className="font-bold text-indigo-900 mb-2 flex items-center">
            <span className="mr-2 text-xl">📸</span> Analizador de Estilo
          </h3>
          <p className="text-sm text-indigo-700 mb-4">Sube una foto y te diremos qué protector LITPER combina mejor.</p>
          
          <div className="flex space-x-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 bg-white rounded-lg border-2 border-dashed border-indigo-300 flex items-center justify-center cursor-pointer hover:bg-indigo-50"
            >
              {analysisImage ? (
                <img src={analysisImage} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <span className="text-2xl text-indigo-300">+</span>
              )}
            </div>
            <div className="flex-1 flex flex-col justify-center">
               <button
                onClick={handleAnalyze}
                disabled={!analysisImage || analyzing}
                className="bg-indigo-600 text-white text-sm font-bold py-2 px-4 rounded-lg shadow disabled:opacity-50"
               >
                 {analyzing ? 'Analizando...' : 'Analizar Habitación'}
               </button>
            </div>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />

          {analysisResult && (
            <div className="mt-4 p-3 bg-white rounded-lg text-sm text-gray-700 shadow-sm animate-fade-in">
              <p className="font-bold text-indigo-900 mb-1">Sugerencia LITPER:</p>
              {analysisResult}
            </div>
          )}
        </section>

        {/* Module 2: Fast Chat */}
        <section>
          <h3 className="font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2 text-xl">💬</span> Chat Rápido
          </h3>
          <div className="bg-gray-100 rounded-xl p-4 h-64 overflow-y-auto mb-3 flex flex-col space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${m.role === 'user' ? 'bg-black text-white rounded-br-none' : 'bg-white text-gray-800 shadow-sm rounded-bl-none'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {chatLoading && <div className="text-xs text-gray-400 ml-2">Escribiendo...</div>}
          </div>
          <div className="flex space-x-2">
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              placeholder="Escribe tu duda..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
            <button 
              onClick={handleSendChat}
              className="bg-black text-white rounded-lg px-4 hover:bg-gray-800"
            >
              ➤
            </button>
          </div>
        </section>

      </div>
    </div>
  );
};

export default AnalysisChat;
