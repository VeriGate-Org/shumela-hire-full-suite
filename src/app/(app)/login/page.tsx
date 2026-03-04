'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth, ALL_ROLES, ROLE_DISPLAY_NAMES, UserRole } from '@/contexts/AuthContext';
import { rolePermissions } from '@/config/permissions';
import { isCognitoConfigured, isOAuthConfigured } from '@/lib/amplify-config';
import { validatePassword, getPasswordStrength } from '@/lib/password-validation';
import { useEffect, useState, Suspense } from 'react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login, loginWithCredentials, loginWithLinkedIn, confirmNewPassword, pendingNewPasswordChallenge } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPwd, setConfirmNewPwd] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError('Authentication failed. Please try again.');
    }
  }, [searchParams]);

  const handleCognitoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginWithCredentials(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const errObj = err as { name?: string; message?: string };
      const message = errObj.name
        ? `${errObj.name}: ${errObj.message}`
        : errObj.message || 'Login failed';
      setError(message);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmNewPwd) {
      setError('Passwords do not match.');
      return;
    }
    const validationError = validatePassword(newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await confirmNewPassword(newPassword);
      router.push('/dashboard');
    } catch (err: unknown) {
      const errObj = err as { name?: string; message?: string };
      setError(errObj.message || 'Failed to set new password.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithLinkedIn();
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setError(errObj.message || 'Failed to start LinkedIn sign-in');
      setLoading(false);
    }
  };

  const handleMockLogin = (role: UserRole) => {
    const mockUser = {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@company.com',
      role,
      permissions: rolePermissions[role],
    };

    login(mockUser);
    router.push('/dashboard');
  };

  // NEW_PASSWORD_REQUIRED challenge (invited users on first login)
  if (isCognitoConfigured && pendingNewPasswordChallenge) {
    const strength = getPasswordStrength(newPassword);
    const strengthColor =
      strength.label === 'Strong' ? 'bg-green-500' :
      strength.label === 'Good' ? 'bg-gold-500' :
      strength.label === 'Fair' ? 'bg-yellow-500' :
      'bg-red-400';

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
              Set a new password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-500">
              Your account requires a new password before you can continue.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleNewPasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Enter new password"
                autoComplete="new-password"
              />
              {newPassword && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${strengthColor}`}
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-12">{strength.label}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirm-new-password" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <input
                id="confirm-new-password"
                type="password"
                required
                value={confirmNewPwd}
                onChange={(e) => setConfirmNewPwd(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border-2 border-gold-500 text-sm font-medium rounded-full bg-transparent text-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50"
            >
              {loading ? 'Setting password...' : 'Set Password'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Cognito login form
  if (isCognitoConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm font-extrabold tracking-[-0.03em]">
              <span className="text-primary">Shumela</span><span className="text-cta">Hire</span>
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleCognitoLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border-2 border-gold-500 text-sm font-medium rounded-full bg-transparent text-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {isOAuthConfigured && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-50 px-2 text-gray-400 tracking-wider">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLinkedInLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 text-sm font-medium rounded-full bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A66C2] disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0A66C2">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                Sign in with LinkedIn
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Mock login for development
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm font-extrabold tracking-[-0.03em]">
            <span className="text-primary">Shumela</span><span className="text-cta">Hire</span>
          </p>
          <p className="mt-1 text-center text-xs text-gray-400 uppercase tracking-wider">
            Development Mode
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="role-select" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Sign in as
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-3 py-2 text-sm font-medium rounded-full border transition-colors ${
                    selectedRole === role
                      ? 'bg-gold-500 text-violet-950 border-gold-500 ring-1 ring-gold-400/40'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-violet-300 hover:bg-gold-50'
                  }`}
                >
                  {ROLE_DISPLAY_NAMES[role]}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleMockLogin(selectedRole)}
            className="group relative w-full flex justify-center py-2.5 px-4 border-2 border-gold-500 text-sm font-medium rounded-full bg-transparent text-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
          >
            Sign In as {ROLE_DISPLAY_NAMES[selectedRole]}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
