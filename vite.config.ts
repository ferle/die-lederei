import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build', // Change Vite's default output directory to 'build'
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
