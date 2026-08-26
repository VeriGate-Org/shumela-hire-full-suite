'use client';

import React, { ReactNode, useState } from 'react';

/**
 * A tenant's logo, on a surface that may be darker than the logo was drawn for.
 *
 * <p><b>The problem.</b> A tenant uploads whatever artwork it has, which is almost always ink drawn
 * for white paper on a transparent background. The IDC mark is typical: measured against the
 * sidebar's #0B1929, <b>63% of its opaque pixels fall below 3:1</b> and the median is 2.18:1, so the
 * wordmark and its strapline all but disappear. On a white plate the same ink measures 8.14:1.
 *
 * <p><b>Why a plate rather than a second asset.</b> Asking every tenant for a light-on-dark variant
 * means a second upload, a second field and a fallback for the ones who never provide it. The plate
 * works for any artwork, including the ones already uploaded.
 *
 * <p><b>Why the two callers differ.</b> The sidebar is #0B1929 in <em>both</em> themes, so it always
 * needs the plate. The top bar sits on {@code --card}, which is white in light mode and only needs
 * one in the dark. ModernLayout had the dark-mode plate and the sidebar had nothing at all, which is
 * how a logo could be illegible in light mode on one surface and fine on the other.
 */
interface TenantLogoProps {
  src: string;
  /** 'always' for the sidebar, which is dark in both themes. 'dark' for surfaces that flip. */
  plate: 'always' | 'dark';
  className?: string;
  /** Rendered when the logo URL fails to load. */
  fallback: ReactNode;
}

export default function TenantLogo({ src, plate, className = 'h-8', fallback }: TenantLogoProps) {
  const [failed, setFailed] = useState(false);

  // The sidebar previously had no error handling, so a bad URL rendered the browser's broken-image
  // glyph in the top-left corner of the application.
  if (failed) return <>{fallback}</>;

  const plating =
    plate === 'always'
      ? 'bg-white rounded px-1.5 py-1'
      : 'dark:bg-white dark:rounded dark:px-1.5 dark:py-1';

  return (
    <img
      src={src}
      alt="Organization logo"
      onError={() => setFailed(true)}
      className={`w-auto max-w-[180px] object-contain ${className} ${plating}`}
    />
  );
}
