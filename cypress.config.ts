import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // Add this line:
    baseUrl: 'http://localhost:3000',
    
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});