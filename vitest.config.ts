import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.ts',
        '**/*.config.js',
        'dist/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/renderer': path.resolve(__dirname, './src/renderer'),
      '@/main': path.resolve(__dirname, './src/main'),
      '@/preload': path.resolve(__dirname, './src/preload'),
      '@/shared': path.resolve(__dirname, './src/shared'),
    },
  },
});
