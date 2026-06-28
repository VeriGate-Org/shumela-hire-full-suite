'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-fetch';
import { validatePassword, getPasswordStrength } from '@/lib/password-validation';

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
  const router = useRouter();
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
  const strengthColor =
    strength.label === 'Strong' ? 'bg-green-500' :
    strength.label === 'Good' ? 'bg-gold-500' :
    strength.label === 'Fair' ? 'bg-yellow-500' :
    'bg-red-400';

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center px-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-[-0.03em] mb-2">
            Registration Submitted
          </h2>
          <p className="text-gray-600 mb-6">
            Your agency registration is under review. You will be able to sign in once your account has been approved by our team.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-2.5 border-2 border-gold-500 text-sm font-medium rounded-full text-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
      <div className="max-w-lg w-full space-y-8 px-4">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900 tracking-[-0.03em]">
            Register your agency
          </h2>
          <p className="mt-2 text-center text-sm font-extrabold tracking-[-0.03em]">
            <span className="text-primary">Shumela</span><span className="text-cta">Hire</span>
          </p>
          <p className="mt-1 text-center text-sm text-gray-500">
            Partner with us to place candidates in open positions
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-control">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Agency Details */}
          <div>
            <label htmlFor="agencyName" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Agency Name
            </label>
            <input
              id="agencyName"
              name="agencyName"
              type="text"
              required
              value={form.agencyName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-control text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Acme Recruitment"
            />
          </div>

          <div>
            <label htmlFor="registrationNumber" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Registration Number <span className="normal-case tracking-normal text-gray-400">(optional)</span>
            </label>
            <input
              id="registrationNumber"
              name="registrationNumber"
              type="text"
              value={form.registrationNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-control text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="e.g. 2024/123456/07"
            />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="contactPerson" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Contact Person
              </label>
              <input
                id="contactPerson"
                name="contactPerson"
                type="text"
                required
                value={form.contactPerson}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-control text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Full name"
              />
            </div>
            <div>
              <label htmlFor="contactPhone" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Phone <span className="normal-case tracking-normal text-gray-400">(optional)</span>
              </label>
              <input
                id="contactPhone"
                name="contactPhone"
                type="tel"
                value={form.contactPhone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-control text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="+27 12 345 6789"
              />
            </div>
          </div>

          <div>
            <label htmlFor="contactEmail" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Contact Email
            </label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              required
              value={form.contactEmail}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-control text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="contact@agency.co.za"
            />
          </div>

          {/* BEE Level */}
          <div>
            <label htmlFor="beeLevel" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              B-BBEE Level <span className="normal-case tracking-normal text-gray-400">(optional)</span>
            </label>
            <select
              id="beeLevel"
              name="beeLevel"
              value={form.beeLevel}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-control text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
            >
              <option value="">Select level</option>
              {BEE_LEVELS.map(level => (
                <option key={level} value={level}>Level {level}</option>
              ))}
            </select>
          </div>

          {/* Specializations */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Specializations <span className="normal-case tracking-normal text-gray-400">(select all that apply)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SPECIALIZATION_OPTIONS.map(spec => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => toggleSpecialization(spec)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                    form.specializations.includes(spec)
                      ? 'bg-gold-500 text-violet-950 border-gold-500'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>

          {/* Account credentials */}
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              Account Credentials
            </p>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-control text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
            {form.password && (
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
            <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-control text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border-2 border-gold-500 text-sm font-medium rounded-full bg-transparent text-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Registration'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Already registered?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
