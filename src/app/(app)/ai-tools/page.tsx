'use client';

import React, { useState } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { useFeatureGate } from '@/contexts/FeatureGateContext';
import AiSmartSearch from '@/components/ai/AiSmartSearch';
import AiEmailDrafter from '@/components/ai/AiEmailDrafter';
import AiJobDescriptionWriter from '@/components/ai/AiJobDescriptionWriter';
import AiSalaryBenchmark from '@/components/ai/AiSalaryBenchmark';
import {
  AI_FEATURES,
  AiFeature,
  embeddedFeatures,
  enabledCount,
  highRiskFeatures,
  launchableFeatures,
} from '@/components/ai/registry';

/**
 * What the AI in this platform is doing, and where.
 *
 * <p>The page used to list four features — the ones that happen to be runnable from here — in a
 * 2×2 grid. There are twelve. Six of the other eight are embedded in other screens, and
 * <b>all five high-risk features are among them</b>: they judge candidates from inside the pipeline
 * board, the candidate panel, the offers screen and the applicant profile, and no screen said so.
 *
 * <p>A launcher that lists only the safe, runnable half is worse than no launcher, because it
 * implies the list is complete. This page is generated from
 * {@link import('@/components/ai/registry')}, whose completeness is enforced by a test that reads
 * the filesystem — adding a thirteenth feature without registering it fails the build.
 */

/** The bodies for the features that can actually be opened here. */
const LAUNCHERS: Record<string, React.ReactNode> = {
  'smart-search': <AiSmartSearch />,
  'email-drafter': <AiEmailDrafter />,
  'job-description': <AiJobDescriptionWriter />,
  'salary-benchmark': <AiSalaryBenchmark />,
};

function RiskBadge({ level }: { level: AiFeature['level'] }) {
  // Colour carries risk, not tool identity. The old cards spent navy/teal/gold/pink on which tool
  // it was, which conflicts with every other screen in this system — where teal means complete,
  // gold means owed and red means stopped. Pink was not in the palette at all.
  return level === 'high-risk' ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.625rem] font-bold uppercase tracking-wider bg-surface-pink text-accent-pink">
      High risk
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.625rem] font-bold uppercase tracking-wider bg-muted text-muted-foreground">
      Advisory
    </span>
  );
}

function FeatureCard({
  feature,
  enabled,
  expanded,
  onToggle,
}: {
  feature: AiFeature;
  enabled: boolean | null;
  expanded: boolean;
  onToggle: () => void;
}) {
  const body = LAUNCHERS[feature.id];

  return (
    <div
      className={`enterprise-card p-5 ${
        feature.level === 'high-risk' ? 'border-l-4 border-accent-pink' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-foreground">{feature.label}</h3>
            <RiskBadge level={feature.level} />
            {/* A tool that vanishes when its flag is off leaves an operator unable to tell
                "we do not have that" from "it is turned off" — and only one is fixable by them. */}
            {enabled === false && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.625rem] font-bold uppercase tracking-wider bg-muted text-muted-foreground/70">
                Not enabled
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
          <p className="text-xs text-muted-foreground/70 mt-2">
            {feature.launchable ? 'Also runs on' : 'Runs on'}:{' '}
            <b className="font-semibold text-muted-foreground">{feature.runsIn.join(' · ')}</b>
          </p>
        </div>

        {body && enabled !== false && (
          <button
            onClick={onToggle}
            aria-expanded={expanded}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border border-border text-foreground hover:border-primary hover:text-primary transition-colors"
          >
            {expanded ? 'Close' : 'Open'}
          </button>
        )}
      </div>

      {/* Nothing is expanded by default. The old page expanded the first panel and collapsed
          three, which made a catalogue look like one tool with clutter round it. */}
      {body && expanded && enabled !== false && (
        <div className="mt-4 pt-4 border-t border-border">{body}</div>
      )}
    </div>
  );
}

export default function AiToolsPage() {
  return (
    <FeatureGate
      feature="AI_ENABLED"
      // Without a fallback this renders null, so a navigation item leads to a blank page on any
      // tenant without AI. An empty screen reads as a broken page; "not enabled" reads as an answer.
      fallback={
        <PageWrapper title="AI Tools" subtitle="Not enabled for this organisation">
          <div className="enterprise-card p-8 text-center max-w-lg mx-auto">
            <h2 className="text-lg font-bold text-foreground mb-2">AI features are switched off</h2>
            <p className="text-sm text-muted-foreground">
              Nobody in this organisation can use the AI tools at the moment. Your administrator can
              enable them.
            </p>
          </div>
        </PageWrapper>
      }
      // A whole route must not flash the "switched off" message before the flags resolve — that
      // reads as a definite answer, and it is the wrong one for most tenants.
      loading={
        <PageWrapper title="AI Tools" subtitle="Every AI feature in this platform, and where it runs">
          <div className="enterprise-card p-8 text-center max-w-lg mx-auto">
            <p className="text-sm text-muted-foreground">Checking which features are enabled…</p>
          </div>
        </PageWrapper>
      }
    >
      <AiToolsContent />
    </FeatureGate>
  );
}

function AiToolsContent() {
  const { isFeatureEnabled, isLoading } = useFeatureGate();
  const [openId, setOpenId] = useState<string | null>(null);

  const enabledFor = (flag: string): boolean | null => (isLoading ? null : isFeatureEnabled(flag));
  const enabled = enabledCount(isLoading ? null : isFeatureEnabled);
  const highRisk = highRiskFeatures();

  return (
    <PageWrapper
      title="AI Tools"
      subtitle="Every AI feature in this platform, and where it runs"
    >
      <div className="space-y-6">
        {/* The question worth answering first is not "what AI exists" but "what is it deciding
            about our candidates". All five high-risk features run inside other screens. */}
        <div className="enterprise-card p-5 border-l-4 border-accent-pink">
          <p className="text-sm font-bold text-foreground">
            {highRisk.length} of these {AI_FEATURES.length} features make judgements about people.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {highRisk.map((f) => f.label).join(', ')} — each carries a stronger disclaimer than the
            rest, and <b className="font-semibold text-foreground">none of them runs from this
            page</b>. They act inside the pipeline board, the candidate panel, the offers screen and
            the applicant profile.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-2">
            {/* Null, not zero, while the flag state loads: "none are enabled" and "we do not yet
                know" are different answers. */}
            {enabled === null
              ? 'Checking which are enabled for this organisation…'
              : `${enabled} of ${AI_FEATURES.length} enabled for this organisation.`}
          </p>
        </div>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground/70 mb-3">
            You can run these here
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {launchableFeatures().map((feature) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                enabled={enabledFor(feature.flag)}
                expanded={openId === feature.id}
                onToggle={() => setOpenId(openId === feature.id ? null : feature.id)}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground/70 mb-3">
            These run inside other screens
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {embeddedFeatures().map((feature) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                enabled={enabledFor(feature.flag)}
                expanded={false}
                onToggle={() => {}}
              />
            ))}
          </div>
        </section>

        {/* Agreed rather than inherited: the descriptions above are written for this page, in the
            terms a candidate would recognise. Each tool's own subtitle is marketing register
            ("Natural language candidate discovery"), which is the wrong voice for saying what a
            high-risk feature does to a person. */}
        <p className="text-xs text-muted-foreground/70">
          The descriptions on this page are written for it, and say what each feature does to a
          candidate. They differ from the subtitles shown on the tools themselves. Risk levels are
          read from the code, not assigned here.
        </p>
      </div>
    </PageWrapper>
  );
}
