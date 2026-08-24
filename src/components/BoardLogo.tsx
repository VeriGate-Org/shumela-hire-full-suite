'use client';

import React, { useState } from 'react';
import { JobBoardType, getBoardDisplayName } from '@/types/jobBoard';

/**
 * The mark for a job board, wherever that board is named.
 *
 * Assets are served locally from /logos/boards/ — never from a CDN. The
 * published demo has to work with no network, and a board logo is exactly the
 * kind of thing that quietly fails to load in a room with bad wifi.
 *
 * Trademark note. These are third-party marks used nominatively, to identify
 * the channel a posting went to. That is the same use as the Dots Africa mark
 * in BackgroundCheckPanel, and it is why this component is only ever placed
 * next to a function — "Publish to", a posting row, a sourcing channel — and
 * never beside the ShumelaHire or Arthmatic mark, and never under a heading
 * like "Partners". Placed that way it identifies; placed the other way it
 * implies an endorsement none of these boards has given.
 *
 * A missing asset renders a monogram rather than a broken image. The monogram
 * is deliberately neutral — it uses the product's own tokens and makes no
 * attempt to echo the board's colours, because a hand-approximated brand mark
 * is worse than an obviously generic one.
 */

interface BoardAsset {
  /** File under public/logos/boards/. */
  file: string;
  /** Monogram shown until the asset is present. */
  monogram: string;
}

const BOARD_ASSETS: Partial<Record<JobBoardType, BoardAsset>> = {
  [JobBoardType.PNET]: { file: 'pnet.svg', monogram: 'PN' },
  [JobBoardType.CAREER_JUNCTION]: { file: 'careerjunction.svg', monogram: 'CJ' },
  // "Li", not "in" — the latter is LinkedIn's actual mark, and a monogram
  // standing in for a logo must not be a rough copy of that logo.
  [JobBoardType.LINKEDIN]: { file: 'linkedin.svg', monogram: 'Li' },
  [JobBoardType.INDEED]: { file: 'indeed.svg', monogram: 'ID' },
};

const SIZES = {
  sm: { box: 'w-5 h-5', text: 'text-[0.5625rem]' },
  md: { box: 'w-7 h-7', text: 'text-[0.6875rem]' },
  lg: { box: 'w-9 h-9', text: 'text-sm' },
} as const;

interface BoardLogoProps {
  boardType: JobBoardType | string;
  size?: keyof typeof SIZES;
  className?: string;
}

export default function BoardLogo({ boardType, size = 'md', className = '' }: BoardLogoProps) {
  const [assetFailed, setAssetFailed] = useState(false);

  const type = boardType as JobBoardType;
  const asset = BOARD_ASSETS[type];
  const name = getBoardDisplayName(type);
  const { box, text } = SIZES[size];

  // Boards with no mark of their own — Internal Portal, Public Website — are
  // ours, not a third party's, and get the monogram treatment by design.
  if (!asset || assetFailed) {
    const monogram = asset?.monogram ?? name.slice(0, 2).toUpperCase();
    return (
      <span
        role="img"
        aria-label={name}
        title={name}
        className={`${box} ${text} flex-shrink-0 rounded-control bg-muted text-muted-foreground
          font-bold tracking-tight flex items-center justify-center select-none ${className}`}
      >
        {monogram}
      </span>
    );
  }

  return (
    <img
      src={`/logos/boards/${asset.file}`}
      alt={name}
      title={name}
      onError={() => setAssetFailed(true)}
      className={`${box} flex-shrink-0 object-contain ${className}`}
    />
  );
}

/** Board types that have a third-party mark on file. */
export const BOARDS_WITH_LOGOS = Object.keys(BOARD_ASSETS) as JobBoardType[];
