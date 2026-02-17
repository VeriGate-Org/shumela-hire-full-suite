'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, ALL_ROLES, ROLE_DISPLAY_NAMES, UserRole } from '../../contexts/AuthContext';
import { rolePermissions } from '@/config/permissions';
import { useEffect, useState, Suspense } from 'react';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface SsoProvider {
  id: string;
  name: string;
  type: string;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login } = useAuth();
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [ssoProviders, setSsoProviders] = useState<SsoProvider[]>([]);
  const [ssoError, setSsoError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Check for SSO error in URL params
  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'sso_failed') {
      setSsoError('SSO authentication failed. Please try again or use demo login.');
    } else if (error === 'sso_no_email') {
      setSsoError('No email address found in SSO profile.');
    }
  }, [searchParams]);

  // Check SSO status on mount
  useEffect(() => {
    checkSsoStatus();
  }, []);

  const checkSsoStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/sso/status`);
      if (response.ok) {
        const data = await response.json();
        setSsoEnabled(data.enabled);
        setSsoProviders(data.providers || []);
      }
    } catch {
      // SSO not available, that's fine
    }
  };

  const handleSsoLogin = async (providerId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/sso/initiate?provider=${providerId}`);
      if (response.ok) {
        const data = await response.json();
        window.location.href = `${API_BASE}${data.redirectUrl}`;
      }
    } catch {
      setSsoError('Failed to initiate SSO login');
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

    sessionStorage.setItem('jwt_token', 'mock-jwt-token-' + Date.now());
    login(mockUser);
    router.push('/dashboard');
  };

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
        </div>

        {ssoError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm">
            {ssoError}
          </div>
        )}

        {/* SSO Buttons */}
        {ssoEnabled && ssoProviders.length > 0 && (
          <div className="space-y-3">
            {ssoProviders.map(provider => (
              <button
                key={provider.id}
                onClick={() => handleSsoLogin(provider.id)}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
              >
                Sign in with {provider.name}
              </button>
            ))}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Or</span>
              </div>
            </div>
          </div>
        )}

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
