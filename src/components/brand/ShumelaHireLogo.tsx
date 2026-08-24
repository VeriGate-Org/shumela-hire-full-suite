/**
 * The ShumelaHire mark and wordmark.
 *
 * Geometry is taken from public/shumelahire-logo.svg so the two cannot drift. Rendered inline
 * rather than as <img src="…svg"> for two reasons: an SVG loaded through <img> is an isolated
 * document that cannot inherit the app's Manrope, so the wordmark there depends on a Google Fonts
 * @import at render time; and inline lets the mark take its colours from the surface it sits on.
 *
 * The wordmark is one word, always — "Shumela" in primary teal, "Hire" in gold, no space.
 */

type Tone = 'onLight' | 'onDark';
type Size = 'sm' | 'md' | 'lg';

interface ShumelaHireLogoProps {
  tone?: Tone;
  size?: Size;
  /** The letterspaced descender under the wordmark. */
  tagline?: boolean;
  className?: string;
}

const MARK_PX: Record<Size, number> = { sm: 32, md: 40, lg: 56 };
const WORD_CLASS: Record<Size, string> = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-[2rem] leading-none',
};

/**
 * The Orbital Hub: a gold centre with satellites held in orbit around it — the product's claim
 * that scattered hiring activity resolves to one accountable centre.
 */
function OrbitalHub({ tone, px }: { tone: Tone; px: number }) {
  // On navy the satellites are white; on light surfaces they are primary teal.
  const node = tone === 'onDark' ? '#FFFFFF' : '#05527E';
  const core = tone === 'onDark' ? '#032E49' : '#FFFFFF';

  return (
    <svg
      viewBox="-32 -32 64 64"
      width={px}
      height={px}
      className="shrink-0 overflow-visible"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="0" cy="0" rx="26" ry="26" fill="none" stroke={node} strokeWidth="0.8" opacity="0.14" />
      <ellipse cx="0" cy="0" rx="16" ry="16" fill="none" stroke={node} strokeWidth="0.6" opacity="0.1" />

      <g stroke={node} strokeWidth="1.2" opacity="0.22">
        <line x1="0" y1="0" x2="22" y2="-14" />
        <line x1="0" y1="0" x2="-18" y2="-20" />
        <line x1="0" y1="0" x2="-24" y2="10" />
        <line x1="0" y1="0" x2="10" y2="24" />
        <line x1="0" y1="0" x2="26" y2="6" />
      </g>

      <g fill={node}>
        <circle cx="22" cy="-14" r="4" />
        <circle cx="-18" cy="-20" r="3.5" opacity="0.6" />
        <circle cx="-24" cy="10" r="4" />
        <circle cx="10" cy="24" r="3.5" opacity="0.6" />
        <circle cx="26" cy="6" r="3" opacity="0.4" />
        <circle cx="14" cy="-24" r="2" opacity="0.2" />
        <circle cx="-10" cy="26" r="2" opacity="0.2" />
      </g>

      <circle cx="0" cy="0" r="7" fill="#F1C54B" />
      <circle cx="0" cy="0" r="3.5" fill={core} />
    </svg>
  );
}

export default function ShumelaHireLogo({
  tone = 'onLight',
  size = 'md',
  tagline = false,
  className = '',
}: ShumelaHireLogoProps) {
  const shumela = tone === 'onDark' ? 'text-white' : 'text-primary';

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <OrbitalHub tone={tone} px={MARK_PX[size]} />
      <span className="flex flex-col justify-center">
        {/* aria-label so assistive tech reads one word, not two coloured fragments. */}
        <span
          className={`font-extrabold tracking-[-0.03em] ${WORD_CLASS[size]}`}
          aria-label="ShumelaHire"
        >
          <span aria-hidden="true" className={shumela}>
            Shumela
          </span>
          <span aria-hidden="true" className="text-[#F1C54B]">
            Hire
          </span>
        </span>
        {tagline && (
          <span
            className={`mt-1 text-[0.5625rem] font-semibold uppercase tracking-[0.22em] ${
              tone === 'onDark' ? 'text-white/35' : 'text-muted-foreground'
            }`}
          >
            Talent Acquisition Platform
          </span>
        )}
      </span>
    </span>
  );
}
