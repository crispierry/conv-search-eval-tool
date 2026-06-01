import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/conv-search-eval-tool/' : '/',
  plugins: [react()],
}));
