import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { signIn } from 'next-auth/react';
import GetStartedButton from './GetStartedButton';

// Mock the next-auth signIn function
jest.mock('next-auth/react', () => ({
  ...jest.requireActual('next-auth/react'), // import and retain default behavior
  signIn: jest.fn(),
}));

describe('GetStartedButton Component', () => {
  const mockedSignIn = signIn as jest.Mock;

  beforeEach(() => {
    mockedSignIn.mockClear();
  });

  it('renders the button with the correct text', () => {
    render(<GetStartedButton />);
    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
  });

  it('calls the signIn function when clicked', () => {
    render(<GetStartedButton />);
    const button = screen.getByRole('button', { name: /get started/i });
    fireEvent.click(button);
    expect(mockedSignIn).toHaveBeenCalledTimes(1);
    // Assert it was called with specific arguments for a good user experience
    expect(mockedSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/' });
  });
});
