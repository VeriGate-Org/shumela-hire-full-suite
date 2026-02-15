'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { rolePermissions } from '@/config/permissions';
import { useEffect, useState, Suspense } from 'react';
import ThemeToggle from '../../components/ThemeToggle';

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

  const handleMockLogin = () => {
    const mockUser = {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@company.com',
      role: 'ADMIN' as const,
      permissions: rolePermissions['ADMIN'],
    };

    sessionStorage.setItem('jwt_token', 'mock-jwt-token-' + Date.now());
    login(mockUser);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative">
      {/* Theme Toggle in top-right corner */}
      <div className="absolute top-6 right-6">
        <ThemeToggle compact />
      </div>

      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            TalentGate
          </p>
        </div>

        {ssoError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
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
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
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

        <div>
          <button
            onClick={handleMockLogin}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
          >
            Sign In (Demo)
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
