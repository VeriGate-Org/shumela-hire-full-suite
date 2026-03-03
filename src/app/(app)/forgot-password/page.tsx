'use client';

import { useState } from 'react';
import Link from 'next/link';
import { resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import { isCognitoConfigured, configureAmplify } from '@/lib/amplify-config';
import { validatePassword, getPasswordStrength } from '@/lib/password-validation';

if (isCognitoConfigured) {
  configureAmplify();
}

type Step = 'request' | 'confirm' | 'success';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isCognitoConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Password Reset Unavailable</h2>
          <p className="text-sm text-gray-500">
            Password reset is not available in development mode.
          </p>
          <Link href="/login" className="text-sm font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await resetPassword({ username: email.trim().toLowerCase() });
      setStep('confirm');
    } catch (err: unknown) {
      const errObj = err as { name?: string; message?: string };
      // Prevent user enumeration — always advance to confirm step
      if (errObj.name === 'UserNotFoundException') {
        setStep('confirm');
      } else if (errObj.name === 'LimitExceededException') {
        setError('Too many attempts. Please wait a few minutes and try again.');
      } else {
        setError(errObj.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
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
      await confirmResetPassword({
        username: email.trim().toLowerCase(),
        confirmationCode: code.trim(),
        newPassword,
      });
      setStep('success');
    } catch (err: unknown) {
      const errObj = err as { name?: string; message?: string };
      if (errObj.name === 'CodeMismatchException') {
        setError('Invalid verification code. Please check and try again.');
      } else if (errObj.name === 'ExpiredCodeException') {
        setError('Verification code has expired. Please request a new one.');
      } else if (errObj.name === 'LimitExceededException') {
        setError('Too many attempts. Please wait a few minutes and try again.');
      } else if (errObj.name === 'InvalidPasswordException') {
        setError(errObj.message || 'Password does not meet requirements.');
      } else {
        setError(errObj.message || 'Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

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
            {step === 'request' && 'Reset your password'}
            {step === 'confirm' && 'Enter verification code'}
            {step === 'success' && 'Password reset complete'}
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

        {/* Step 1: Request code */}
        {step === 'request' && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter your email address and we will send you a verification code to reset your password.
            </p>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border-2 border-gold-500 text-sm font-medium rounded-full bg-transparent text-violet-900 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>

            <p className="text-center text-sm text-gray-500">
              <Link href="/login" className="font-medium text-primary hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        )}

        {/* Step 2: Confirm code + new password */}
        {step === 'confirm' && (
          <form onSubmit={handleConfirmReset} className="space-y-4">
            <p className="text-sm text-gray-600">
              We sent a verification code to <strong>{email}</strong>. Enter it below along with your new password.
            </p>

            <div>
              <label htmlFor="code" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono tracking-widest"
                placeholder="123456"
                autoComplete="one-time-code"
              />
            </div>

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
              <label htmlFor="confirm-password" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border-2 border-gold-500 text-sm font-medium rounded-full bg-transparent text-violet-900 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <div className="flex justify-between text-sm text-gray-500">
              <button
                type="button"
                onClick={() => { setStep('request'); setError(null); }}
                className="font-medium text-primary hover:underline"
              >
                Resend code
              </button>
              <Link href="/login" className="font-medium text-primary hover:underline">
                Back to sign in
              </Link>
            </div>
          </form>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
            <Link
              href="/login"
              className="inline-flex justify-center py-2.5 px-6 border-2 border-gold-500 text-sm font-medium rounded-full bg-transparent text-violet-900 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
