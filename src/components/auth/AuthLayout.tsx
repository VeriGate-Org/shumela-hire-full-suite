import ShumelaHireLogo from '@/components/brand/ShumelaHireLogo';

/**
 * The shell every authentication screen sits in.
 *
 * These pages were the last unbranded surface in the product: a centred form on bare `gray-50`,
 * no mark, and a stray `violet-950` left over from an earlier palette. They are also the first
 * thing an evaluator sees after leaving the marketing site, so the seam showed.
 *
 * Two columns. The left is the brand: deep navy, the orbital field, the mark, and one line of
 * positioning. It is decorative and hidden below `lg`, where the mark moves inline above the form
 * so small screens still carry the brand without spending half the viewport on it.
 */

interface AuthLayoutProps {
  /** Small letterspaced line above the title, e.g. "Welcome back". */
  eyebrow?: string;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  /** Sits under the card — "Don't have an account?" and similar. */
  footer?: React.ReactNode;
  /** Registration needs more width than a sign-in form. */
  wide?: boolean;
}

/**
 * The orbital field behind the brand panel — the mark's motif at wall scale.
 * Deterministic by hand rather than generated, so it composes with the panel's copy.
 */
function OrbitalField({ className = '' }: { className?: string }) {
  // Held to the upper two-thirds. The copy sits in the lower third, and lines crossing
  // letterforms made it noticeably harder to read.
  const nodes: Array<[number, number, number, number]> = [
    // x, y, r, opacity
    [78, 96, 5, 0.5], [206, 58, 3.5, 0.32], [338, 120, 4.5, 0.42],
    [142, 214, 4, 0.36], [306, 246, 3, 0.26], [56, 268, 3.5, 0.3],
    [386, 208, 2.5, 0.2], [248, 330, 4, 0.28], [104, 356, 3, 0.2],
    [352, 352, 3.5, 0.24], [180, 424, 3, 0.16], [300, 440, 2.5, 0.13],
    [64, 430, 2.5, 0.14],
  ];
  const hub: [number, number] = [212, 212];

  return (
    <svg
      viewBox="0 0 440 760"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <g stroke="#FFFFFF" strokeWidth="1">
        {nodes.map(([x, y], i) => (
          <line
            key={`h${i}`}
            x1={hub[0]}
            y1={hub[1]}
            x2={x}
            y2={y}
            opacity={0.07}
          />
        ))}
        {/* Perimeter, tracing the constellation rather than radiating from it. */}
        <polyline
          points={nodes.slice(0, 6).map(([x, y]) => `${x},${y}`).join(' ')}
          fill="none"
          opacity="0.05"
        />
      </g>

      <g fill="#FFFFFF">
        {nodes.map(([x, y, r, o], i) => (
          <circle key={`n${i}`} cx={x} cy={y} r={r} opacity={o} />
        ))}
      </g>

      <circle cx={hub[0]} cy={hub[1]} r="26" fill="none" stroke="#F1C54B" strokeWidth="1" opacity="0.18" />
      <circle cx={hub[0]} cy={hub[1]} r="44" fill="none" stroke="#F1C54B" strokeWidth="1" opacity="0.08" />
      <circle cx={hub[0]} cy={hub[1]} r="9" fill="#F1C54B" opacity="0.85" />
      <circle cx={hub[0]} cy={hub[1]} r="4.5" fill="#032E49" />
    </svg>
  );
}

export default function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  wide = false,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,26rem)_1fr] xl:grid-cols-[minmax(0,32rem)_1fr] bg-background">
      {/* ---------- Brand panel ---------- */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#032E49] px-12 py-14">
        <OrbitalField className="pointer-events-none absolute inset-0 h-full w-full" />
        {/* Lifts the top-left so the mark sits on depth rather than flat navy. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 80% at 15% 12%, rgba(5,82,126,0.55) 0%, rgba(3,46,73,0) 58%)',
          }}
        />
        {/* Settles the field back into the navy before it reaches the copy, so no
            connecting line ever runs through a letterform. */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%]"
          style={{
            background: 'linear-gradient(to top, #032E49 34%, rgba(3,46,73,0.86) 62%, rgba(3,46,73,0) 100%)',
          }}
        />

        <div className="relative">
          <ShumelaHireLogo tone="onDark" size="md" tagline />
        </div>

        <div className="relative max-w-sm">
          <p className="text-[0.625rem] font-bold uppercase tracking-[0.2em] text-[#F1C54B]">
            Enterprise Talent Acquisition
          </p>
          <p className="mt-5 text-[1.75rem] font-extrabold leading-[1.15] tracking-[-0.035em] text-white">
            Every appointment,
            <br />
            evidenced end to end.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/55">
            Structured hiring for corporates, DFIs and government agencies — where every decision
            has to stand up to scrutiny long after it is made.
          </p>
        </div>

        <div className="relative flex items-center gap-6 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-white/35">
          <span>POPIA aligned</span>
          <span aria-hidden="true" className="h-3 w-px bg-white/15" />
          <span>Full audit trail</span>
        </div>
      </aside>

      {/* ---------- Form column ---------- */}
      <main className="flex flex-col items-center justify-center px-6 py-12 sm:px-10">
        <div className={`w-full ${wide ? 'max-w-xl' : 'max-w-sm'}`}>
          {/* The panel is hidden below lg, so the mark comes inline here instead. */}
          <div className="mb-10 flex justify-center lg:hidden">
            <ShumelaHireLogo tone="onLight" size="md" />
          </div>

          <header className="mb-8">
            {eyebrow && (
              <p className="mb-2 text-[0.625rem] font-bold uppercase tracking-[0.2em] text-primary">
                {eyebrow}
              </p>
            )}
            <h1 className="text-[1.75rem] font-extrabold leading-tight tracking-[-0.035em] text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
            )}
          </header>

          {children}

          {footer && <div className="mt-8">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
