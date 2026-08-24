'use client';

import { useState } from 'react';
import Link from 'next/link';
import { resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import { isCognitoConfigured, configureAmplify } from '@/lib/amplify-config';
import { validatePassword, getPasswordStrength } from '@/lib/password-validation';
import AuthLayout from '@/components/auth/AuthLayout';
import { Field, AuthButton, AuthAlert, PasswordStrength } from '@/components/auth/AuthControls';

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
      <AuthLayout
        eyebrow="Unavailable"
        title="Password reset is unavailable"
        subtitle="This environment runs without Cognito, so reset codes cannot be sent."
      >
        <Link
          href="/login"
          className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </AuthLayout>
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

  const TITLES: Record<Step, string> = {
    request: 'Reset your password',
    confirm: 'Enter verification code',
    success: 'Password reset complete',
  };

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title={TITLES[step]}
      subtitle={
        step === 'request'
          ? 'Enter your email address and we will send you a verification code.'
          : step === 'confirm'
            ? <>We sent a code to <strong className="font-semibold text-foreground">{email}</strong>. Enter it below with your new password.</>
            : undefined
      }
      footer={
        step !== 'success' ? (
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
              Back to sign in
            </Link>
          </p>
        ) : undefined
      }
    >
      <div className="space-y-5">
        {error && <AuthAlert tone="error">{error}</AuthAlert>}

        {step === 'request' && (
          <form onSubmit={handleRequestCode} className="space-y-5">
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
            <AuthButton type="submit" disabled={loading}>
              {loading ? 'Sending\u2026' : 'Send verification code'}
            </AuthButton>
          </form>
        )}

        {step === 'confirm' && (
          <form onSubmit={handleConfirmReset} className="space-y-5">
            <Field
              id="code"
              label="Verification code"
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              autoComplete="one-time-code"
              inputMode="numeric"
              className="font-mono tracking-[0.3em]"
            />

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
              id="confirm-password"
              label="Confirm password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
            />

            <AuthButton type="submit" disabled={loading}>
              {loading ? 'Resetting\u2026' : 'Reset password'}
            </AuthButton>

            <button
              type="button"
              onClick={() => { setStep('request'); setError(null); }}
              className="w-full text-center text-xs font-semibold text-primary underline-offset-4 hover:underline"
            >
              Resend code
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 rounded-control border-l-[3px] border-l-[#047469] bg-[#EFFEFB] px-4 py-4 dark:bg-[#047469]/10">
              <svg className="h-5 w-5 shrink-0 text-[#047469] dark:text-[#5EEAD4]" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <p className="text-sm text-[#065F52] dark:text-[#5EEAD4]">
                Your password has been reset. You can sign in with it now.
              </p>
            </div>
            <Link href="/login" className="block">
              <AuthButton type="button" tabIndex={-1}>Sign in</AuthButton>
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
