'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-fetch';
import { validatePassword, getPasswordStrength } from '@/lib/password-validation';
import AuthLayout from '@/components/auth/AuthLayout';
import { Field, AuthButton, AuthAlert, PasswordStrength } from '@/components/auth/AuthControls';

const SPECIALIZATION_OPTIONS = [
  'IT & Software Development',
  'Finance & Accounting',
  'Engineering',
  'Healthcare & Medical',
  'Sales & Marketing',
  'Human Resources',
  'Legal & Compliance',
  'Manufacturing & Operations',
  'Construction & Mining',
  'Education & Training',
  'Logistics & Supply Chain',
  'Retail & Hospitality',
  'Executive Search',
  'Temporary Staffing',
  'General Recruitment',
];

const BEE_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function AgencyRegisterPage() {
  const [form, setForm] = useState({
    agencyName: '',
    registrationNumber: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    specializations: [] as string[],
    beeLevel: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const strength = getPasswordStrength(form.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleSpecialization = (spec: string) => {
    setForm(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec],
    }));
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
      const res = await apiFetch('/api/public/agencies/register', {
        method: 'POST',
        body: JSON.stringify({
          agencyName: form.agencyName,
          registrationNumber: form.registrationNumber || undefined,
          contactPerson: form.contactPerson,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone || undefined,
          specializations: form.specializations.join(', ') || undefined,
          beeLevel: form.beeLevel ? parseInt(form.beeLevel) : undefined,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Registration failed. Please try again.');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthLayout
        eyebrow="Received"
        title="Registration submitted"
        footer={
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
              Back to sign in
            </Link>
          </p>
        }
      >
        <AuthAlert tone="success">
          Your agency registration is under review. You will be able to sign in once your account
          has been approved by our team.
        </AuthAlert>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      wide
      eyebrow="Agency registration"
      title="Register your agency"
      subtitle="Partner with us to place candidates in open positions. Accounts are activated once your agency has been approved."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Already registered?{' '}
          <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <AuthAlert tone="error">{error}</AuthAlert>}

        <Field
          id="agencyName"
          name="agencyName"
          label="Agency name"
          type="text"
          required
          value={form.agencyName}
          onChange={handleChange}
          placeholder="Karisani Talent Partners"
          autoComplete="organization"
        />

        <Field
          id="registrationNumber"
          name="registrationNumber"
          label="Registration number"
          hint="(optional)"
          type="text"
          value={form.registrationNumber}
          onChange={handleChange}
          placeholder="2019/123456/07"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="contactPerson"
            name="contactPerson"
            label="Contact person"
            type="text"
            required
            value={form.contactPerson}
            onChange={handleChange}
            placeholder="Thandi Molefe"
            autoComplete="name"
          />
          <Field
            id="contactPhone"
            name="contactPhone"
            label="Phone"
            hint="(optional)"
            type="tel"
            value={form.contactPhone}
            onChange={handleChange}
            placeholder="+27 82 000 0000"
            autoComplete="tel"
          />
        </div>

        <Field
          id="contactEmail"
          name="contactEmail"
          label="Contact email"
          type="email"
          required
          value={form.contactEmail}
          onChange={handleChange}
          placeholder="you@agency.co.za"
          autoComplete="email"
        />

        <div>
          <label
            htmlFor="beeLevel"
            className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-muted-foreground"
          >
            B-BBEE level
            <span className="ml-1 font-medium normal-case tracking-normal text-muted-foreground/70">
              (optional)
            </span>
          </label>
          <select
            id="beeLevel"
            name="beeLevel"
            value={form.beeLevel}
            onChange={handleChange}
            className="w-full rounded-control border border-border bg-card px-3.5 py-2.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Select level</option>
            {BEE_LEVELS.map(level => (
              <option key={level} value={level}>Level {level}</option>
            ))}
          </select>
        </div>

        <div>
          <p
            id="specializations-label"
            className="mb-2 text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-muted-foreground"
          >
            Specializations
            <span className="ml-1 font-medium normal-case tracking-normal text-muted-foreground/70">
              (select all that apply)
            </span>
          </p>
          <div role="group" aria-labelledby="specializations-label" className="flex flex-wrap gap-2">
            {SPECIALIZATION_OPTIONS.map(spec => {
              const selected = form.specializations.includes(spec);
              return (
                <button
                  key={spec}
                  type="button"
                  onClick={() => toggleSpecialization(spec)}
                  aria-pressed={selected}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                    selected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  {spec}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-border pt-5">
          <p className="mb-4 text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            Account credentials
          </p>

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
                placeholder="At least 8 characters"
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
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
          </div>
        </div>

        <AuthButton type="submit" disabled={loading}>
          {loading ? 'Submitting\u2026' : 'Submit registration'}
        </AuthButton>
      </form>
    </AuthLayout>
  );
}
