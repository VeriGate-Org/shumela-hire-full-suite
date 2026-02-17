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
          <img src="/icons/shumelahire-icon.svg" alt="ShumelaHire" className="h-8 w-8" />
          <span className="font-extrabold text-sm tracking-[-0.03em]">
            <span className="text-primary">Shumela</span><span className="text-cta">Hire</span>
          </span>
        </div>
      </header>

      {/* Centered wizard */}
      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        <OnboardingWizard companyName="ShumelaHire" onComplete={handleComplete} />
      </main>

      {/* Minimal footer */}
      <footer className="w-full px-6 py-4 text-center">
        <p className="text-xs text-gray-400">&copy; 2026 <span className="text-primary">Shumela</span><span className="text-cta">Hire</span> by Arthmatic DevWorks</p>
      </footer>
    </div>
  );
}
