'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, ALL_ROLES, ROLE_DISPLAY_NAMES, UserRole } from '../../contexts/AuthContext';
import { rolePermissions } from '@/config/permissions';
import { isCognitoConfigured } from '@/lib/amplify-config';
import { useEffect, useState, Suspense } from 'react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login, loginWithCredentials } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border-2 border-gold-500 text-sm font-medium rounded-full bg-transparent text-violet-900 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
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
            className="group relative w-full flex justify-center py-2.5 px-4 border-2 border-gold-500 text-sm font-medium rounded-full bg-transparent text-violet-900 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
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
