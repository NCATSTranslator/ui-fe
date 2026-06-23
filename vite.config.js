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
          manualChunks(id) {
            if (id.includes('node_modules/react-dom/') || id.includes('node_modules/react/')) {
              return 'react-vendor';
            }
            if (id.includes('node_modules/scheduler/')) {
              return 'react-vendor';
            }
            const graphVendor = ['translator-graph-view', '@xyflow/react'];
            if (graphVendor.some(pkg => id.includes(`node_modules/${pkg}/`))) {
              return 'graph-vendor';
            }
            const uiVendor = ['react-select', 'react-paginate', 'react-range', 'react-tooltip', 'react-toastify', 'react-animate-height', 'react-awesome-reveal', 'react-responsive-carousel'];
            if (uiVendor.some(pkg => id.includes(`node_modules/${pkg}/`))) {
              return 'ui-vendor';
            }
            const utilsVendor = ['lodash', 'mathjs', 'fraction.js', 'fastest-levenshtein'];
            if (utilsVendor.some(pkg => id.includes(`node_modules/${pkg}/`))) {
              return 'utils-vendor';
            }
            const reduxVendor = ['react-redux', '@reduxjs/toolkit', 'redux'];
            if (reduxVendor.some(pkg => id.includes(`node_modules/${pkg}/`))) {
              return 'redux-vendor';
            }
            if (id.includes('node_modules/@tanstack/react-query/')) {
              return 'query-vendor';
            }
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