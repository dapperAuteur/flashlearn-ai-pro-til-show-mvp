/// <reference types="cypress" />

// Helper function to mock the NextAuth session
const mockSession = (sessionData: object | null) => {
  cy.intercept('GET', '/api/auth/session', {
    statusCode: 200,
    body: sessionData,
  }).as('session');
};

describe('CardGenerator for Guest Users (Not Logged In)', () => {
  beforeEach(() => {
    // For a guest, we mock the session API to return null (no user)
    mockSession(null);
    cy.visit('/');
    
    // The component will try to fetch sets, which should fail for a guest
    cy.intercept('GET', '/api/flashcard-sets', { statusCode: 401 }).as('getSetsGuest');

    // Handle the username modal
    cy.get('h3').contains('Enter a Username').should('be.visible');
    cy.get('input[placeholder="Your cool name"]').type('TestGuest');
    cy.get('button').contains('Save').click();
    cy.get('h3').contains('Enter a Username').should('not.exist');
  });

  it('should redirect to the login page when trying to generate cards', () => {
    // This test now assumes your front-end will be fixed to redirect.
    // When the user clicks, the app should redirect without making an API call.
    cy.get('input[placeholder="Enter a topic..."]').type('Guest Topic');
    cy.get('button').contains('Generate Cards').click();

    // Assert that the URL has changed to the login page.
    cy.url().should('include', '/api/auth/signin');
    cy.contains('Sign in').should('be.visible'); // A better check for the login page
  });
});

describe('CardGenerator for Authenticated Users', () => {
  beforeEach(() => {
    // For authenticated tests, mock the session API to return a user object
    mockSession({
      user: {
        id: 'mockUserId123',
        name: 'Test User',
        email: 'test@example.com',
      },
      expires: new Date(Date.now() + 3600 * 1000).toISOString(),
    });

    // Mock the successful generation of cards from the AI
    cy.intercept('POST', '/api/generate', {
      statusCode: 200,
      body: {
        cards: [
          { front: 'What is Cypress?', back: 'A tool for testing web applications.' },
          { front: 'What is E2E testing?', back: 'Testing the application flow from start to finish.' }
        ]
      }
    }).as('generateCards');

    cy.visit('/');

    // Handle the username modal
    cy.get('h3').contains('Enter a Username').should('be.visible');
    cy.get('input[placeholder="Your cool name"]').type('TestUser_LoggedIn');
    cy.get('button').contains('Save').click();
    cy.get('h3').contains('Enter a Username').should('not.exist');
  });

  it('should allow a logged-in user to generate a new set when under the limit', () => {
    const newTopic = 'Cypress Testing';

    // Mock the API to show the user has 1 existing set
    cy.intercept('GET', '/api/flashcard-sets', {
      statusCode: 200,
      body: { sets: [{ _id: 'existingSet1', topic: 'First Set', cards: [] }] }
    }).as('getSets');
    
    cy.intercept('POST', '/api/flashcard-sets', { statusCode: 201 }).as('saveSet');
    
    cy.get('input[placeholder="Enter a topic..."]').type(newTopic);
    cy.get('button').contains('Generate Cards').click();

    // After generating, the app will refetch the sets. We update the mock.
    cy.intercept('GET', '/api/flashcard-sets', {
      statusCode: 200,
      body: {
        sets: [
          { _id: 'existingSet1', topic: 'First Set', cards: [] },
          { _id: 'newSet2', topic: newTopic, cards: [{ front: 'Q', back: 'A' }] }
        ]
      }
    }).as('getSetsAfterGenerating');

    cy.wait(['@generateCards', '@saveSet', '@getSetsAfterGenerating']);
    cy.contains('.bg-gray-800', newTopic).should('be.visible');
  });

  it('should prevent generation when the user has reached the monthly limit', () => {
    // Mock the API to show the user already has 2 sets
    cy.intercept('GET', '/api/flashcard-sets', {
      statusCode: 200,
      body: {
        sets: [
          { _id: 'existingSet1', topic: 'First Set', cards: [], createdAt: new Date().toISOString() },
          { _id: 'existingSet2', topic: 'Second Set', cards: [], createdAt: new Date().toISOString() }
        ]
      }
    }).as('getSetsAtLimit');

    // Mock the generate API to return the rate limit error
    cy.intercept('POST', '/api/generate', {
      statusCode: 429,
      body: { error: 'You have reached your monthly generation limit.' }
    }).as('generateCardsOverLimit');

    cy.get('input[placeholder="Enter a topic..."]').type('A Third Topic');
    cy.get('button').contains('Generate Cards').click();

    cy.wait('@generateCardsOverLimit');
    cy.contains('You have reached your monthly generation limit.').should('be.visible');
  });
});
