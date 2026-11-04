import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter} from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  plugins: [
    // The router plugin must run before the React plugin.
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: false,
    }),
    react(),
    tailwindcss(),
  ],
});
