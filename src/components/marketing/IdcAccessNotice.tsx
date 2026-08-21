'use client';

import { useEffect, useState } from 'react';
import { getTenantSubdomain } from '@/lib/tenant-utils';

/**
 * Shown only on the idc.shumelahire.co.za homepage to point IDC personnel
 * to the login screen, where their role credentials are shown. The
 * credentials themselves live on /login (see IdcLoginCredentials), not here.
 */
export default function IdcAccessNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getTenantSubdomain() === 'idc');
  }, []);

  if (!visible) return null;

  return (
    <div className="bg-[#003B71] text-white px-6 py-4">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-2 text-sm text-center">
        <span>IDC personnel: click Sign In to view your role&apos;s credentials.</span>
        <a href="/login" className="font-medium text-[#FDB913] underline whitespace-nowrap">
          Sign in &rarr;
        </a>
      </div>
    </div>
  );
}
