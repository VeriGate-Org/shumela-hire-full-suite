import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../page';


// Track router.push calls
const mockPush = jest.fn();

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock aws-amplify/auth
jest.mock('aws-amplify/auth', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  fetchAuthSession: jest.fn(),
  getCurrentUser: jest.fn(),
  fetchUserAttributes: jest.fn(),
}));

// Mock aws-amplify
jest.mock('aws-amplify', () => ({
  Amplify: {
    configure: jest.fn(),
  },
}));

// Mock amplify-config: isCognitoConfigured = false to get dev mode
jest.mock('@/lib/amplify-config', () => ({
  isCognitoConfigured: false,
  configureAmplify: jest.fn(),
}));

// Import AuthProvider to wrap the login page
import { AuthProvider } from '@/contexts/AuthContext';

function renderLoginPage() {
  return render(
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    mockPush.mockClear();
    sessionStorage.clear();
  });

  it('renders the login page heading in dev mode', async () => {
    renderLoginPage();

    const heading = await screen.findByText('Sign in to your account');
    expect(heading).toBeInTheDocument();
  });

  it('displays development mode indicator', async () => {
    renderLoginPage();

    const devLabel = await screen.findByText('Development Mode');
    expect(devLabel).toBeInTheDocument();
  });

  it('renders the ShumelaHire brand name', async () => {
    renderLoginPage();

    const shumela = await screen.findByText('Shumela');
    const hire = await screen.findByText('Hire');
    expect(shumela).toBeInTheDocument();
    expect(hire).toBeInTheDocument();
  });

  it('renders all role selection buttons', async () => {
    renderLoginPage();

    // Wait for the page to fully render
    await screen.findByText('Development Mode');

    expect(screen.getByText('Administrator')).toBeInTheDocument();
    expect(screen.getByText('Executive')).toBeInTheDocument();
    expect(screen.getByText('HR Manager')).toBeInTheDocument();
    expect(screen.getByText('Talent Acquisition')).toBeInTheDocument();
    expect(screen.getByText('Recruiter')).toBeInTheDocument();
    expect(screen.getByText('Interviewer')).toBeInTheDocument();
    expect(screen.getByText('Employee')).toBeInTheDocument();
    expect(screen.getByText('Applicant')).toBeInTheDocument();
  });

  it('defaults to ADMIN role with correct sign-in button text', async () => {
    renderLoginPage();

    const signInButton = await screen.findByRole('button', { name: /Sign In as Administrator/i });
    expect(signInButton).toBeInTheDocument();
  });

  it('changes selected role when a role button is clicked', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await screen.findByText('Development Mode');

    // Click on Recruiter role
    const recruiterButton = screen.getByText('Recruiter');
    await user.click(recruiterButton);

    // The sign-in button text should update
    expect(screen.getByRole('button', { name: /Sign In as Recruiter/i })).toBeInTheDocument();
  });

  it('performs mock sign-in and redirects to dashboard', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await screen.findByText('Development Mode');

    // Click the sign-in button (defaults to ADMIN)
    const signInButton = screen.getByRole('button', { name: /Sign In as Administrator/i });
    await user.click(signInButton);

    // Should redirect to dashboard
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('performs mock sign-in with a non-default role', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await screen.findByText('Development Mode');

    // Select HR Manager
    const hrButton = screen.getByText('HR Manager');
    await user.click(hrButton);

    // Click sign in
    const signInButton = screen.getByRole('button', { name: /Sign In as HR Manager/i });
    await user.click(signInButton);

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });
});
