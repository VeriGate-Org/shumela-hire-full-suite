'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-fetch';
import { validatePassword, getPasswordStrength } from '@/lib/password-validation';
import AuthLayout from '@/components/auth/AuthLayout';
import { Field, AuthButton, AuthAlert, PasswordStrength } from '@/components/auth/AuthControls';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(form.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const passwordError = validatePassword(form.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/public/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Registration failed. Please try again.');
        return;
      }

      // Registration successful — redirect to login
      const loginUrl = returnTo
        ? `/login?registered=true&returnTo=${encodeURIComponent(returnTo)}`
        : '/login?registered=true';
      router.push(loginUrl);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      wide
      eyebrow="Candidate registration"
      title="Create your account"
      subtitle="Register once, then apply to any advertised role and track where your application stands."
      footer={
        <div className="space-y-2 text-center text-sm text-muted-foreground">
          <p>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
          <p>
            Registering as a recruitment agency?{' '}
            <Link
              href="/agencies/register"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Agency registration
            </Link>
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <AuthAlert tone="error">{error}</AuthAlert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="firstName"
            name="firstName"
            label="First name"
            type="text"
            required
            value={form.firstName}
            onChange={handleChange}
            placeholder="Thandi"
            autoComplete="given-name"
          />
          <Field
            id="lastName"
            name="lastName"
            label="Last name"
            type="text"
            required
            value={form.lastName}
            onChange={handleChange}
            placeholder="Molefe"
            autoComplete="family-name"
          />
        </div>

        <Field
          id="email"
          name="email"
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          autoComplete="email"
        />

        <Field
          id="phone"
          name="phone"
          label="Phone"
          hint="(optional)"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          placeholder="+27 82 000 0000"
          autoComplete="tel"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Field
              id="password"
              name="password"
              label="Password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="Create a password"
              autoComplete="new-password"
            />
            {form.password && <PasswordStrength score={strength.score} label={strength.label} />}
          </div>

          <Field
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm password"
            type="password"
            required
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Repeat your password"
            autoComplete="new-password"
          />
        </div>

        <AuthButton type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </AuthButton>
      </form>
    </AuthLayout>
  );
}
