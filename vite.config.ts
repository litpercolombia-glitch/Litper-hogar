import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // Litper: la clave de Gemini ya NO se inyecta en el bundle del navegador.
      // Las llamadas pasan por el proxy seguro (Supabase Edge Function).
      build: {
        target: 'es2020',
        chunkSizeWarningLimit: 800,
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom'],
              'genai': ['@google/genai'],
              'markdown': ['react-markdown'],
            },
          },
        },
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
