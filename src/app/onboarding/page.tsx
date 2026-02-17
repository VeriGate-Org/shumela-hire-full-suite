'use client';

import React from 'react';
import OnboardingWizard from '@/components/OnboardingWizard';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();

  const handleComplete = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with logo */}
      <header className="w-full px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 bg-gold-500 rounded-sm grid place-items-center">
            <span className="text-violet-950 font-bold text-sm">SH</span>
          </div>
          <span className="font-bold text-sm tracking-tight text-gray-900">ShumelaHire</span>
        </div>
      </header>

      {/* Centered wizard */}
      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        <OnboardingWizard companyName="ShumelaHire" onComplete={handleComplete} />
      </main>

      {/* Minimal footer */}
      <footer className="w-full px-6 py-4 text-center">
        <p className="text-xs text-gray-400">&copy; 2026 ShumelaHire by Arthmatic DevWorks</p>
      </footer>
    </div>
  );
}
