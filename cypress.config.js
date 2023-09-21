import { defineConfig } from 'cypress'
import vitePreprocessor from 'cypress-vite'

export default defineConfig({
  e2e: {
    setupNodeEvents(on) {
      on('file:preprocessor', vitePreprocessor())
    },
    viewportHeight: 700,
    viewportWidth: 1440
  },
})