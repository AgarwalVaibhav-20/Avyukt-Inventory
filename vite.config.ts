import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (!id.includes('node_modules')) return;
              const moduleId = id.replace(/\\/g, '/');
              if (moduleId.includes('/recharts/') || moduleId.includes('/d3-')) return 'vendor-charts';
              if (moduleId.includes('/xlsx/')) return 'vendor-xlsx';
              if (moduleId.includes('/@radix-ui/') || moduleId.includes('/radix-ui/') || moduleId.includes('/cmdk/')) return 'vendor-ui';
              if (moduleId.includes('/lucide-react/')) return 'vendor-icons';
              if (moduleId.includes('/@google/genai/')) return 'vendor-ai';
              if (moduleId.includes('/socket.io-client/')) return 'vendor-socket';
              if (
                moduleId.includes('/react/') ||
                moduleId.includes('/react-dom/') ||
                moduleId.includes('/react-router-dom/') ||
                moduleId.includes('/@reduxjs/toolkit/') ||
                moduleId.includes('/react-redux/')
              ) return 'vendor-react';
            },
          },
        },
      }
    };
});
