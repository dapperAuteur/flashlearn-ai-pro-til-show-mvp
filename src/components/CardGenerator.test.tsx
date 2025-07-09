/* eslint-disable react/display-name */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSession, signIn } from 'next-auth/react';
import CardGenerator from './CardGenerator';
import { getUsername } from './UsernameSetter';

// Mock the next-auth module
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
}));

// Mock the UsernameSetter component and its helper function
jest.mock('./UsernameSetter', () => ({
  __esModule: true,
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="username-setter-modal">
      <button onClick={onClose}>Cancel</button>
    </div>
  ),
  getUsername: jest.fn(),
}));

// Mock child components that are not relevant to these tests
jest.mock('./StudySession', () => () => <div data-testid="study-session" />);
jest.mock('./Leaderboard', () => () => <div data-testid="leaderboard" />);
jest.mock('./ReviewAlert', () => () => <div data-testid="review-alert" />);


describe('CardGenerator Component', () => {
  // Cast mocks to the correct type to satisfy TypeScript
  const mockedUseSession = useSession as jest.Mock;
  const mockedGetUsername = getUsername as jest.Mock;
  const mockedSignIn = signIn as jest.Mock;

  beforeEach(() => {
    // Reset mocks before each test
    mockedUseSession.mockClear();
    mockedGetUsername.mockClear();
    mockedSignIn.mockClear();
    // Mock fetch API
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ sets: [] }) })) as jest.Mock;
  });

  describe('Username Modal Logic', () => {
    it('should show the username modal on first visit if no username is set', () => {
      // Arrange: User is a guest and has no username in localStorage
      mockedUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
      mockedGetUsername.mockReturnValue(null);

      // Act
      render(<CardGenerator />);

      // Assert
      expect(screen.getByTestId('username-setter-modal')).toBeInTheDocument();
    });

    it('should NOT show the username modal if a username is already set', () => {
      // Arrange: User has a username in localStorage
      mockedUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
      mockedGetUsername.mockReturnValue('TestUser');

      // Act
      render(<CardGenerator />);

      // Assert
      expect(screen.queryByTestId('username-setter-modal')).not.toBeInTheDocument();
    });

    it('should NOT show the username modal if the user is authenticated and has a username', () => {
      // Arrange: User is logged in and has a username
      mockedUseSession.mockReturnValue({
        data: { user: { name: 'Test User' } },
        status: 'authenticated',
      });
      mockedGetUsername.mockReturnValue('TestUser');

      // Act
      render(<CardGenerator />);

      // Assert
      expect(screen.queryByTestId('username-setter-modal')).not.toBeInTheDocument();
    });
  });

  describe('Guest User (Unauthenticated)', () => {
    beforeEach(() => {
      mockedUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
      mockedGetUsername.mockReturnValue('TestUser'); // Assume username is set
    });

    it('should call signIn when "Generate Cards" is clicked', () => {
      // Act
      render(<CardGenerator />);
      const generateButton = screen.getByRole('button', { name: /generate cards/i });
      fireEvent.click(generateButton);

      // Assert
      expect(mockedSignIn).toHaveBeenCalledTimes(1);
    });

    it('should not attempt to fetch flashcard sets', () => {
      // Act
      render(<CardGenerator />);

      // Assert
      expect(global.fetch).not.toHaveBeenCalledWith('/api/flashcard-sets');
    });
  });

  describe('Logged-In User (Authenticated)', () => {
    beforeEach(() => {
      mockedUseSession.mockReturnValue({
        data: { user: { name: 'Test User' } },
        status: 'authenticated',
      });
      mockedGetUsername.mockReturnValue('TestUser');
    });

    it('should fetch flashcard sets on mount', async () => {
      // Act
      render(<CardGenerator />);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/flashcard-sets');
      });
    });

    it('should call the generate API when "Generate Cards" is clicked with a topic', async () => {
       // Arrange
       global.fetch.mockResolvedValueOnce({
           ok: true,
           json: () => Promise.resolve({ cards: [{ front: 'Q', back: 'A' }] })
       }).mockResolvedValueOnce({ // For the save call
           ok: true,
           json: () => Promise.resolve({ success: true })
       });

      // Act
      render(<CardGenerator />);
      const topicInput = screen.getByPlaceholderText(/enter a topic/i);
      const generateButton = screen.getByRole('button', { name: /generate cards/i });

      fireEvent.change(topicInput, { target: { value: 'My Topic' } });
      fireEvent.click(generateButton);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/generate', expect.any(Object));
      });
    });
  });
});
