'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, UserRole } from '../../../contexts/AuthContext';
import { rolePermissions } from '@/config/permissions';

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
          const mockJwtPayload = {
            sub: '123e4567-e89b-12d3-a456-426614174000',
            name: 'John Doe',
            email: 'john.doe@company.com',
            preferred_username: 'john.doe',
            realm_access: {
              roles: ['ADMIN', 'user']
            },
            resource_access: {
              'shumelahire': {
                roles: ['ADMIN']
              }
            }
          };

          const extractUserRole = (payload: {
            realm_access?: { roles?: string[] };
            resource_access?: { [key: string]: { roles?: string[] } };
          }): string => {
            const clientRoles = payload.resource_access?.['shumelahire']?.roles || [];
            const realmRoles = payload.realm_access?.roles || [];
            const roleHierarchy = ['ADMIN', 'EXECUTIVE', 'HR_MANAGER', 'HIRING_MANAGER', 'RECRUITER', 'INTERVIEWER', 'EMPLOYEE', 'APPLICANT'];

            for (const role of roleHierarchy) {
              if (clientRoles.includes(role) || realmRoles.includes(role)) {
                return role;
              }
            }
            return 'APPLICANT';
          };

          const userRole = extractUserRole(mockJwtPayload);

          const typedRole = userRole as UserRole;
          const userData = {
            id: mockJwtPayload.sub,
            name: mockJwtPayload.name,
            email: mockJwtPayload.email,
            role: typedRole,
            permissions: rolePermissions[typedRole],
          };

          sessionStorage.setItem('jwt_token', 'mock_jwt_token_' + Date.now());
          login(userData);
          router.push('/dashboard');
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}

export default function LoginCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginCallbackContent />
    </Suspense>
  );
}
