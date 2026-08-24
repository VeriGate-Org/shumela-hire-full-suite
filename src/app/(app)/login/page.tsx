'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth, ALL_ROLES, ROLE_DISPLAY_NAMES, UserRole } from '@/contexts/AuthContext';
import { rolePermissions } from '@/config/permissions';
import { isCognitoConfigured, isOAuthConfigured } from '@/lib/amplify-config';
import { validatePassword, getPasswordStrength } from '@/lib/password-validation';
import { useEffect, useMemo, useState, Suspense } from 'react';
import AuthLayout from '@/components/auth/AuthLayout';
import { Field, AuthButton, AuthAlert, PasswordStrength, AuthSpinner } from '@/components/auth/AuthControls';

/**
 * The two self-service ways onto the platform.
 *
 * One credential form serves everybody — staff, candidates and approved agencies all sign in
 * above; Cognito group membership decides what they see. Only account *creation* differs, and
 * the agency route was previously reachable only from the bottom of the candidate register page,
 * so an agency landing on the sign-in screen had no visible way in.
 *
 * Staff accounts are created by an administrator, so there is deliberately no route for them.
 */
function RegistrationRoutes() {
  const routes = [
    {
      href: '/register',
      title: 'Register as a candidate',
      detail: 'Apply for advertised roles and track your applications.',
    },
    {
      href: '/agencies/register',
      title: 'Register your agency',
      detail: 'Submit candidates on open briefs. Activated once approved.',
    },
  ];

  return (
    <div className="border-t border-border pt-6">
      <p className="mb-3 text-center text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        New to ShumelaHire?
      </p>
      <div className="grid gap-2">
        {routes.map(({ href, title, detail }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-control border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <span className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-foreground">{title}</span>
              <svg
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12l-7.5 7.5M21 12H3" />
              </svg>
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{detail}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

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

  // Where to send the user once they are authenticated.
  //
  // The register page forwards returnTo so a candidate who arrived from a live
  // advert lands back on the application form. Nothing here read it: every
  // path pushed /dashboard unconditionally, so a candidate registered, signed
  // in, and was dropped on a dashboard with no way back to the job they had
  // clicked Apply on.
  //
  // Only same-origin relative paths are honoured — an absolute URL in a query
  // parameter is an open redirect, and this one is reachable while logged out.
  const destination = useMemo(() => {
    const target = searchParams.get('returnTo');
    if (!target) return '/dashboard';
    if (!target.startsWith('/') || target.startsWith('//')) return '/dashboard';
    return target;
  }, [searchParams]);

  const registeredSuccess = searchParams.get('registered') === 'true';

  useEffect(() => {
    if (user) {
      router.push(destination);
    }
  }, [user, router, destination]);

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
      router.push(destination);
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
      router.push(destination);
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
    router.push(destination);
  };

  // NEW_PASSWORD_REQUIRED challenge (invited users on first login)
  if (isCognitoConfigured && pendingNewPasswordChallenge) {
    const strength = getPasswordStrength(newPassword);

    return (
      <AuthLayout
        eyebrow="One more step"
        title="Set a new password"
        subtitle="Your account was created for you, so it needs a password of your own before you can continue."
      >
        <form onSubmit={handleNewPasswordSubmit} className="space-y-5">
          {error && <AuthAlert tone="error">{error}</AuthAlert>}

          <div>
            <Field
              id="new-password"
              label="New password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              autoComplete="new-password"
            />
            {newPassword && <PasswordStrength score={strength.score} label={strength.label} />}
          </div>

          <Field
            id="confirm-new-password"
            label="Confirm password"
            type="password"
            required
            value={confirmNewPwd}
            onChange={(e) => setConfirmNewPwd(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
          />

          <AuthButton type="submit" disabled={loading}>
            {loading ? 'Setting password…' : 'Set password'}
          </AuthButton>
        </form>
      </AuthLayout>
    );
  }

  // Cognito login form
  if (isCognitoConfigured) {
    return (
      <AuthLayout
        eyebrow="Welcome back"
        title="Sign in to your account"
        footer={<RegistrationRoutes />}
      >
        <form onSubmit={handleCognitoLogin} className="space-y-5">
          {registeredSuccess && (
            <AuthAlert tone="success">Account created successfully. Sign in to continue.</AuthAlert>
          )}
          {error && <AuthAlert tone="error">{error}</AuthAlert>}

          <Field
            id="email"
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
          />

          <div>
            <Field
              id="password"
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            <div className="mt-2 flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <AuthButton type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </AuthButton>
        </form>

        {isOAuthConfigured && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  or
                </span>
              </div>
            </div>

            <AuthButton type="button" variant="secondary" onClick={handleLinkedInLogin} disabled={loading}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              Sign in with LinkedIn
            </AuthButton>
          </>
        )}
      </AuthLayout>
    );
  }

  // Mock login for development
  return (
    <AuthLayout
      eyebrow="Development mode"
      title="Sign in to your account"
      subtitle="Cognito is not configured for this environment. Pick a role to sign in with."
      footer={<RegistrationRoutes />}
    >
      <div className="space-y-5">
        <div>
          <p
            id="role-select-label"
            className="mb-2 text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-muted-foreground"
          >
            Sign in as
          </p>
          <div role="group" aria-labelledby="role-select-label" className="grid grid-cols-2 gap-2">
            {ALL_ROLES.map((role) => {
              const active = selectedRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  {ROLE_DISPLAY_NAMES[role]}
                </button>
              );
            })}
          </div>
        </div>

        <AuthButton type="button" onClick={() => handleMockLogin(selectedRole)}>
          Sign in as {ROLE_DISPLAY_NAMES[selectedRole]}
        </AuthButton>
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthSpinner message="Loading…" />}>
      <LoginContent />
    </Suspense>
  );
}
