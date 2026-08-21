'use client';

import { useEffect, useState } from 'react';
import { getTenantSubdomain } from '@/lib/tenant-utils';

/**
 * Shown only on the idc.shumelahire.co.za login screen to give IDC personnel
 * their sign-in credentials at the point they actually need them.
 */
export default function IdcLoginCredentials() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getTenantSubdomain() === 'idc');
  }, []);

  if (!visible) return null;

  return (
    <div className="rounded-control border border-[#FDB913]/40 bg-[#003B71] text-white px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FDB913] mb-3">
        IDC Sign-In Access
      </p>
      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-white/60 mb-1">Administrator</p>
          <p className="font-mono break-all">admin@idc.shumelahire.co.za</p>
          <p className="font-mono">79wLp1^czdq</p>
        </div>
        <div>
          <p className="text-white/60 mb-1">Hiring Manager</p>
          <p className="font-mono break-all">yolanda.gaba@idc.shumelahire.co.za</p>
          <p className="font-mono">dmw7W9#9arv</p>
        </div>
      </div>
    </div>
  );
}
