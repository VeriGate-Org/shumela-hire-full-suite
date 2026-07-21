import type { Metadata } from 'next';
import HeroSection from '@/components/marketing/HeroSection';
import SectionWrapper from '@/components/marketing/SectionWrapper';
import TrustBar from '@/components/marketing/TrustBar';
import FeatureCard from '@/components/marketing/FeatureCard';
import FeatureDetailBlock from '@/components/marketing/FeatureDetailBlock';
import TestimonialBlock from '@/components/marketing/TestimonialBlock';
import StatsRow from '@/components/marketing/StatsRow';
import CTASection from '@/components/marketing/CTASection';
import ConstellationGraphic from '@/components/marketing/ConstellationGraphic';
import GridPattern from '@/components/marketing/GridPattern';
import IdcAccessNotice from '@/components/marketing/IdcAccessNotice';

export const metadata: Metadata = {
  title: 'ShumelaHire — Structured Talent Acquisition for Institutions',
  description:
    'ShumelaHire brings order, transparency, and measurable outcomes to every stage of the hiring process. Purpose-built for corporates, DFIs, and government agencies.',
};

/* ------------------------------------------------------------------ */
/*  Inline SVG Icons for Feature Cards                                 */
/* ------------------------------------------------------------------ */

function ClipboardIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  );
}

function ScaleIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="3" x2="12" y2="21" />
      <polyline points="1 14 5 10 9 14" />
      <polyline points="15 14 19 10 23 14" />
      <line x1="5" y1="10" x2="12" y2="5" />
      <line x1="19" y1="10" x2="12" y2="5" />
      <path d="M1 14a4 4 0 0 0 8 0" />
      <path d="M15 14a4 4 0 0 0 8 0" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Gold Check Icon for Platform Overview                              */
/* ------------------------------------------------------------------ */

function GoldCheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      className="shrink-0 mt-1"
    >
      <path
        d="M3.75 9.75L7.5 13.5L14.25 4.5"
        stroke="#F1C54B"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Placeholder Image Slot for Feature Detail Blocks                   */
/* ------------------------------------------------------------------ */

function FeaturePlaceholder({ label }: { label: string }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[2px] aspect-video flex items-center justify-center">
      <div className="text-center">
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          stroke="#CBD5E1"
          strokeWidth="1.5"
          className="mx-auto mb-3"
        >
          <rect x="4" y="4" width="40" height="32" rx="2" />
          <line x1="4" y1="14" x2="44" y2="14" />
          <rect x="8" y="18" width="14" height="6" rx="1" />
          <rect x="8" y="28" width="20" height="4" rx="1" />
          <rect x="26" y="18" width="14" height="14" rx="1" />
        </svg>
        <span className="text-xs text-[#94A3B8] font-medium">{label}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard Wireframe Placeholder for Platform Overview              */
/* ------------------------------------------------------------------ */

function DashboardWireframe() {
  return (
    <div className="border border-white/10 bg-white/5 rounded-[2px] p-6 aspect-[4/3]">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-[2px] bg-white/10" />
        <div className="h-3 w-24 rounded-[2px] bg-white/10" />
        <div className="ml-auto flex gap-2">
          <div className="h-3 w-12 rounded-[2px] bg-white/10" />
          <div className="h-3 w-12 rounded-[2px] bg-white/10" />
        </div>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-[2px] p-3">
            <div className="h-2 w-10 rounded bg-white/10 mb-2" />
            <div className="h-5 w-14 rounded bg-[#F1C54B]/20" />
          </div>
        ))}
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-5 gap-3">
        {/* Sidebar */}
        <div className="col-span-1 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-3 rounded bg-white/10" />
          ))}
        </div>

        {/* Table area */}
        <div className="col-span-4 space-y-2">
          <div className="h-4 rounded bg-white/10" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-3 rounded bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Platform Overview Capabilities                                     */
/* ================================================================== */

const platformCapabilities = [
  'End-to-end requisition lifecycle management',
  'Configurable multi-stage interview workflows',
  'Real-time pipeline analytics and reporting',
  'Automated candidate communication',
  'Role-based dashboards for every stakeholder',
  'Enterprise-grade security and data residency',
];

/* ================================================================== */
/*  Page Component                                                     */
/* ================================================================== */

export default function MarketingHomePage() {
  return (
    <>
      <IdcAccessNotice />

      {/* ---------------------------------------------------------- */}
      {/* 1. Hero                                                      */}
      {/* ---------------------------------------------------------- */}
      <div className="relative overflow-hidden bg-[#F8FAFC]">
        <GridPattern className="opacity-100" />
        <HeroSection
          overline="ENTERPRISE TALENT ACQUISITION"
          headline="Structured Talent Acquisition for Institutions That Cannot Afford to Get It Wrong"
          subheadline="ShumelaHire brings order, transparency, and measurable outcomes to every stage of the hiring process. Purpose-built for corporates, DFIs, and government agencies."
          primaryCTA={{ label: 'Request a Demo', href: '/demo' }}
          secondaryCTA={{ label: 'Explore the Platform', href: '/features' }}
        >
          <ConstellationGraphic className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[400px] opacity-20 pointer-events-none hidden lg:block" />
        </HeroSection>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* 2. Trust Bar                                                 */}
      {/* ---------------------------------------------------------- */}
      <SectionWrapper bg="white" className="!py-12">
        <TrustBar />
      </SectionWrapper>

      {/* ---------------------------------------------------------- */}
      {/* 3. Value Proposition Triptych                                */}
      {/* ---------------------------------------------------------- */}
      <SectionWrapper bg="white">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#05527E] mb-4">
            WHY SHUMELAHIRE
          </p>
          <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.03em] text-[#0F172A]">
            Precision-Engineered for High-Stakes Hiring
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<ClipboardIcon />}
            title="Requisition Control"
            description="Every role begins with a structured requisition. Define requirements, set approval chains, and maintain a complete audit trail from request to appointment."
          />
          <FeatureCard
            icon={<ScaleIcon />}
            title="Structured Evaluation"
            description="Standardised scorecards, blind review options, and calibrated assessment criteria eliminate bias and produce defensible hiring decisions."
          />
          <FeatureCard
            icon={<ShieldIcon />}
            title="Compliance-First Architecture"
            description="POPIA-compliant data handling, role-based access controls, and comprehensive audit logging are not add-ons. They are foundational."
          />
        </div>
      </SectionWrapper>

      {/* ---------------------------------------------------------- */}
      {/* 4. Platform Overview                                         */}
      {/* ---------------------------------------------------------- */}
      <SectionWrapper bg="navy">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F1C54B] mb-4">
              THE PLATFORM
            </p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.03em] text-white mb-6">
              A Complete Talent Acquisition Operating System
            </h2>
            <p className="text-white/70 leading-relaxed mb-8">
              ShumelaHire consolidates the tools, workflows, and data that
              institutions need to hire with confidence. From requisition
              approval through to onboarding, every step is tracked, measured,
              and auditable.
            </p>

            <ul className="space-y-4">
              {platformCapabilities.map((capability) => (
                <li key={capability} className="flex items-start gap-3 text-white/90 text-sm">
                  <GoldCheckIcon />
                  {capability}
                </li>
              ))}
            </ul>
          </div>

          {/* Right column — Dashboard wireframe */}
          <div>
            <DashboardWireframe />
          </div>
        </div>
      </SectionWrapper>

      {/* ---------------------------------------------------------- */}
      {/* 5. Feature Highlights                                        */}
      {/* ---------------------------------------------------------- */}
      <SectionWrapper bg="offwhite">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#05527E] mb-4">
            CAPABILITIES
          </p>
          <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.03em] text-[#0F172A]">
            Built for How Institutions Actually Hire
          </h2>
        </div>

        <div className="space-y-20 lg:space-y-28">
          <FeatureDetailBlock
            title="Workflow Automation"
            description="Define multi-stage hiring workflows that mirror your organisation's approval processes. Automate stage transitions, notifications, and escalations."
            features={[
              'Configurable approval chains',
              'Automated stage transitions',
              'SLA tracking and alerts',
            ]}
            imageSlot={<FeaturePlaceholder label="Workflow Automation" />}
            reversed={false}
          />

          <FeatureDetailBlock
            title="Pipeline Analytics"
            description="Real-time visibility into every requisition, candidate, and hiring stage. Identify bottlenecks, measure time-to-fill, and forecast capacity."
            features={[
              'Live pipeline dashboards',
              'Time-to-fill analytics',
              'Diversity and inclusion metrics',
            ]}
            imageSlot={<FeaturePlaceholder label="Pipeline Analytics" />}
            reversed={true}
          />

          <FeatureDetailBlock
            title="Role-Based Access"
            description="Every user sees precisely what they need. Recruiters, hiring managers, executives, and candidates each have purpose-built interfaces."
            features={[
              'Granular permission controls',
              'Purpose-built dashboards',
              'Complete audit trail',
            ]}
            imageSlot={<FeaturePlaceholder label="Role-Based Access" />}
            reversed={false}
          />

          <FeatureDetailBlock
            title="Interview Scheduling"
            description="Coordinate complex panel interviews across time zones and calendars. Structured interview guides ensure consistency across every conversation."
            features={[
              'Panel coordination',
              'Calendar integration',
              'Structured interview guides',
            ]}
            imageSlot={<FeaturePlaceholder label="Interview Scheduling" />}
            reversed={true}
          />
        </div>
      </SectionWrapper>

      {/* ---------------------------------------------------------- */}
      {/* 6. Testimonial                                               */}
      {/* ---------------------------------------------------------- */}
      <SectionWrapper bg="white">
        <TestimonialBlock
          quote="ShumelaHire replaced a fragmented process with a single, auditable system. Our time-to-fill dropped by 34% in the first quarter, and our compliance team finally has the visibility they need."
          author="Head of Talent Acquisition"
          role="Financial Services"
          organisation="Leading South African Bank"
        />
      </SectionWrapper>

      {/* ---------------------------------------------------------- */}
      {/* 7. Stats Row                                                 */}
      {/* ---------------------------------------------------------- */}
      <StatsRow
        stats={[
          { value: '34%', label: 'Reduction in Time-to-Fill' },
          { value: '100%', label: 'Audit Compliance' },
          { value: '2,400+', label: 'Requisitions Processed' },
          { value: '98%', label: 'Hiring Manager Satisfaction' },
        ]}
      />

      {/* ---------------------------------------------------------- */}
      {/* 8. CTA Section                                               */}
      {/* ---------------------------------------------------------- */}
      <CTASection
        headline="Ready to Transform Your Hiring Process"
        subtext="See how ShumelaHire can bring structure, transparency, and measurable outcomes to your organisation's talent acquisition."
        ctaLabel="Request a Demo"
        ctaHref="/demo"
      />
    </>
  );
}
