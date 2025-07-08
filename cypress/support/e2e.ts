// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// cypress/support/e2e.ts

Cypress.Commands.add('login', (user = {}) => {
  // This command mocks a login request.
  // In a real app, you might make a POST request to your /api/auth/login endpoint
  // and then set the session cookie or token in the browser.
  cy.setCookie('next-auth.session-token', 'mock-session-token-for-testing');
  
  // You can also mock the user session data if your app needs it
  cy.window().then((win) => {
    win.localStorage.setItem('next-auth.session', JSON.stringify({
      user: {
        id: 'mockUserId',
        email: 'test@example.com',
        name: 'Test User',
        ...user
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }));
  });
});