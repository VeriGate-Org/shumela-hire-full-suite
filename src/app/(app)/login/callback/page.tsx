'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { rolePermissions } from '@/config/permissions';
import { AuthSpinner } from '@/components/auth/AuthControls';

function LoginCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        console.error('Authentication error:', error);
        router.push('/login?error=' + error);
        return;
      }

      // Handle SSO token redirect (from backend SSO flow)
      if (token) {
        try {
          // Store the JWT token from SSO
          sessionStorage.setItem('jwt_token', token);

          // Decode JWT payload to extract user info
          const payload = JSON.parse(atob(token.split('.')[1]));

          const userRole = (payload.role || 'EMPLOYEE') as UserRole;
          const userData = {
            id: payload.sub || payload.userId || '1',
            name: payload.name || payload.firstName || payload.sub || 'SSO User',
            email: payload.email || payload.sub || '',
            role: userRole,
            permissions: rolePermissions[userRole],
          };

          login(userData);
          router.push('/dashboard');
        } catch (err) {
          console.error('Failed to process SSO token:', err);
          router.push('/login?error=token_invalid');
        }
        return;
      }

      // Handle OAuth2 authorization code flow (existing mock flow)
      if (code) {
        try {
          router.push('/login?error=mock_auth_removed');
        } catch (err) {
          console.error('Token exchange failed:', err);
          router.push('/login?error=token_exchange_failed');
        }
        return;
      }

      // No token or code
      router.push('/login?error=no_credentials');
    };

    handleCallback();
  }, [searchParams, login, router]);

  return <AuthSpinner message="Completing sign in…" />;
}

export default function LoginCallbackPage() {
  return (
    <Suspense fallback={<AuthSpinner message="Loading…" />}>
      <LoginCallbackContent />
    </Suspense>
  );
}
