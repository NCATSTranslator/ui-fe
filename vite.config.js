import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import eslint from 'vite-plugin-eslint';

export default defineConfig(() => {
  return {
    build: {
      outDir: 'build',
      chunkSizeWarningLimit: 1200,
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'graph-vendor': [
              'translator-graph-view',
              '@xyflow/react'
            ],
            'ui-vendor': [
              'react-select',
              'react-paginate',
              'react-range',
              'react-tooltip',
              'react-toastify',
              'react-animate-height',
              'react-awesome-reveal',
              'react-responsive-carousel'
            ],
            'utils-vendor': [
              'lodash',
              'mathjs',
              'fraction.js',
              'fastest-levenshtein'
            ],
            'redux-vendor': [
              'react-redux',
              '@reduxjs/toolkit',
              'redux'
            ],
            'query-vendor': [
              '@tanstack/react-query'
            ]
          }
        }
      }
    },
    plugins: [
      react(),
      eslint(),
      // svgr options: https://react-svgr.com/docs/options/
      svgr(),
    ],
    compilerOptions: {
      jsx: "react-jsx"
    },
    resolve: {
      alias: {
        '@': '/src',
        'translator-graph-view/styles.css': resolve(dirname(fileURLToPath(import.meta.url)), 'node_modules/translator-graph-view/dist/translator-graph-view.css')
      }
    }
  };
});