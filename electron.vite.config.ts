import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@/main': path.resolve(__dirname, './src/main'),
        '@/shared': path.resolve(__dirname, './src/shared'),
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist/main',
      lib: {
        entry: 'src/main/index.ts',
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@/preload': path.resolve(__dirname, './src/preload'),
        '@/shared': path.resolve(__dirname, './src/shared'),
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist/preload',
      lib: {
        entry: 'src/preload/index.ts',
      },
    },
  },
  renderer: {
    plugins: [react()],
    resolve: {
      alias: {
        '@/renderer': path.resolve(__dirname, './src/renderer'),
        '@/shared': path.resolve(__dirname, './src/shared'),
        '@': path.resolve(__dirname, './src'),
      },
    },
    root: 'src/renderer',
    build: {
      outDir: '../../dist/renderer',
      rollupOptions: {
        input: path.resolve(__dirname, 'src/renderer/index.html'),
      },
    },
  },
});
