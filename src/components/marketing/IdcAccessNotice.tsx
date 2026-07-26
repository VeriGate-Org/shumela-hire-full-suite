'use client';

import { useEffect, useState } from 'react';
import { getTenantSubdomain } from '@/lib/tenant-utils';

/**
 * Shown only on the idc.shumelahire.co.za homepage to give IDC personnel
 * their sign-in credentials directly on first visit.
 */
export default function IdcAccessNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getTenantSubdomain() === 'idc');
  }, []);

  if (!visible) return null;

  return (
    <div className="bg-[#003B71] text-white px-6 py-5">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FDB913] mb-3">
          IDC Sign-In Access
        </p>
        <div className="grid sm:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-white/60 mb-1">Administrator</p>
            <p className="font-mono">admin@idc.shumelahire.co.za</p>
            <p className="font-mono">79wLp1^czdq</p>
          </div>
          <div>
            <p className="text-white/60 mb-1">Hiring Manager</p>
            <p className="font-mono">yolanda.gaba@idc.shumelahire.co.za</p>
            <p className="font-mono">dmw7W9#9arv</p>
          </div>
        </div>
        <a href="/login" className="inline-block mt-4 text-sm font-medium text-[#FDB913] underline">
          Sign in &rarr;
        </a>
      </div>
    </div>
  );
}
