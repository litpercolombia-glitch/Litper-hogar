import React, { useState } from 'react';
import { generateImageWithGemini, promptForApiKey } from '../services/geminiService';
import { AspectRatio, ImageSize } from '../types';
import { ASPECT_RATIOS, IMAGE_SIZES } from '../constants';

const InspirationGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [imageSize, setImageSize] = useState<ImageSize>(ImageSize.K1);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const result = await generateImageWithGemini(prompt, aspectRatio, imageSize);
      setGeneratedImage(result);
    } catch (err: any) {
      if (err.message === 'KEY_REQUIRED') {
        setError('KEY_REQUIRED');
      } else {
        setError("Error generando la imagen. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white p-6 overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Inspiración 3D</h2>
      <p className="text-sm text-gray-500 mb-6">Diseña la habitación de tus sueños desde cero usando Nano Banana Pro.</p>

      {/* Controls */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tu idea (Prompt)</label>
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ej: Una habitación minimalista con grandes ventanales y sábanas de seda negra..."
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none h-24"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Formato</label>
            <select 
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            >
              {ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Calidad</label>
            <select 
              value={imageSize}
              onChange={(e) => setImageSize(e.target.value as ImageSize)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            >
              {IMAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading || !prompt}
        className={`w-full py-3 rounded-lg text-white font-bold transition-all
          ${loading || !prompt ? 'bg-gray-300' : 'bg-purple-600 hover:bg-purple-700 shadow-md'}
        `}
      >
        {loading ? 'Generando...' : 'Crear Imagen'}
      </button>

      {/* Error / Key Prompt */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {error === 'KEY_REQUIRED' ? (
            <div className="flex flex-col items-center">
              <p className="mb-2 text-center">Esta función de alta calidad requiere seleccionar una API Key de pago.</p>
              <button 
                onClick={() => promptForApiKey().then(handleGenerate)} // Retry after select
                className="bg-red-100 px-4 py-2 rounded text-red-800 font-bold hover:bg-red-200"
              >
                Seleccionar API Key
              </button>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="mt-2 text-xs underline">Ver documentación de facturación</a>
            </div>
          ) : (
            <p>{error}</p>
          )}
        </div>
      )}

      {/* Result */}
      {generatedImage && (
        <div className="mt-6 animate-fade-in">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Resultado</p>
          <img src={generatedImage} alt="Generado por IA" className="w-full rounded-lg shadow-lg" />
          <a 
            href={generatedImage} 
            download="litper_inspiration.png"
            className="block text-center mt-2 text-purple-600 text-sm hover:underline"
          >
            Descargar Imagen
          </a>
        </div>
      )}
    </div>
  );
};

export default InspirationGenerator;
