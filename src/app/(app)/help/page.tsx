'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import IdentityBand from '@/components/record/IdentityBand';
import { useAuth } from '@/contexts/AuthContext';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import {
  RocketLaunchIcon,
  BookOpenIcon,
  QuestionMarkCircleIcon,
  CommandLineIcon,
  WrenchScrewdriverIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

import {
  gettingStartedByRole,
  featureGuides,
  faqItems,
  troubleshootingItems,
  releaseNotes,
  additionalShortcuts,
  type GettingStartedGuide,
  type FeatureGuide,
  type FAQItem,
  type TroubleshootingItem,
  type ReleaseNote,
} from './data/helpContent';

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type HelpTab = 'getting-started' | 'features' | 'faq' | 'shortcuts' | 'troubleshooting' | 'contact' | 'release-notes';

const TABS: { id: HelpTab; label: string; icon: React.ReactNode }[] = [
  { id: 'getting-started', label: 'Getting Started', icon: <RocketLaunchIcon className="h-4 w-4" /> },
  { id: 'features', label: 'Feature Guides', icon: <BookOpenIcon className="h-4 w-4" /> },
  { id: 'faq', label: 'FAQ', icon: <QuestionMarkCircleIcon className="h-4 w-4" /> },
  { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: <CommandLineIcon className="h-4 w-4" /> },
  { id: 'troubleshooting', label: 'Troubleshooting', icon: <WrenchScrewdriverIcon className="h-4 w-4" /> },
  { id: 'contact', label: 'Contact Support', icon: <ChatBubbleLeftRightIcon className="h-4 w-4" /> },
  { id: 'release-notes', label: "What's New", icon: <SparklesIcon className="h-4 w-4" /> },
];

// ---------------------------------------------------------------------------
// Search helpers
// ---------------------------------------------------------------------------

interface SearchResult {
  tab: HelpTab;
  section: string;
  title: string;
  snippet: string;
}

function buildSearchIndex(
  guides: GettingStartedGuide[],
  features: FeatureGuide[],
  faqs: FAQItem[],
  troubles: TroubleshootingItem[],
  releases: ReleaseNote[],
): SearchResult[] {
  const results: SearchResult[] = [];

  guides.forEach((g) =>
    g.steps.forEach((s) =>
      results.push({ tab: 'getting-started', section: g.roleCategory, title: s.title, snippet: s.description }),
    ),
  );

  features.forEach((f) =>
    results.push({ tab: 'features', section: 'Feature Guides', title: f.name, snippet: f.description }),
  );

  faqs.forEach((f) =>
    results.push({ tab: 'faq', section: f.category, title: f.question, snippet: f.answer }),
  );

  troubles.forEach((t) =>
    results.push({ tab: 'troubleshooting', section: 'Troubleshooting', title: t.problem, snippet: t.resolution }),
  );

  releases.forEach((r) =>
    r.highlights.forEach((h) =>
      results.push({ tab: 'release-notes', section: r.version, title: h, snippet: `Released ${r.date}` }),
    ),
  );

  return results;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HelpPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as HelpTab) || 'getting-started';
  const [activeTab, setActiveTab] = useState<HelpTab>(TABS.some((t) => t.id === initialTab) ? initialTab : 'getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [expandedTrouble, setExpandedTrouble] = useState<string | null>(null);

  const { user, hasPermission } = useAuth();
  const { shortcutList } = useKeyboardShortcuts();
  const userRole = user?.role;

  // Build search index once
  const searchIndex = useMemo(
    () => buildSearchIndex(gettingStartedByRole, featureGuides, faqItems, troubleshootingItems, releaseNotes),
    [],
  );

  // Filtered search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return searchIndex.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.snippet.toLowerCase().includes(q) ||
        r.section.toLowerCase().includes(q),
    );
  }, [searchQuery, searchIndex]);

  const isSearching = searchQuery.trim().length > 0;

  // Role-specific getting-started guide
  const activeGuide = useMemo(() => {
    if (!userRole) return gettingStartedByRole[0];
    return gettingStartedByRole.find((g) => g.roles.includes(userRole)) ?? gettingStartedByRole[0];
  }, [userRole]);

  // Permission-filtered features
  const visibleFeatures = useMemo(
    () => featureGuides.filter((f) => hasPermission(f.requiredPermission)),
    [hasPermission],
  );

  // Role-filtered FAQ (show relevant first, then rest)
  const sortedFaq = useMemo(() => {
    if (!userRole) return faqItems;
    const relevant: FAQItem[] = [];
    const rest: FAQItem[] = [];
    faqItems.forEach((f) => {
      if (!f.relevantRoles || f.relevantRoles.includes(userRole)) {
        relevant.push(f);
      } else {
        rest.push(f);
      }
    });
    return [...relevant, ...rest];
  }, [userRole]);

  // Group FAQ by category
  const faqByCategory = useMemo(() => {
    const map = new Map<string, FAQItem[]>();
    sortedFaq.forEach((f) => {
      const list = map.get(f.category) ?? [];
      list.push(f);
      map.set(f.category, list);
    });
    return map;
  }, [sortedFaq]);

  // -------------------------------------------------------------------------
  // Section renderers
  // -------------------------------------------------------------------------

  function renderGettingStarted() {
    return (
      <div className="space-y-6">
        <div className="enterprise-card p-6">
          <h3 className="text-sm font-bold uppercase tracking-[0.05em] text-foreground mb-1">
            {activeGuide.roleCategory}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Follow these steps to get up and running with ShumelaHire.
          </p>
          <div className="space-y-5">
            {activeGuide.steps.map((step) => (
              <div key={step.step} className="flex gap-4">
                <div className="shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-primary text-white text-xs font-bold">
                  {step.step}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{step.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                  {step.href && (
                    <Link href={step.href} className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                      Go to {step.title} <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Show other role guides collapsed */}
        {gettingStartedByRole.filter((g) => g !== activeGuide).length > 0 && (
          <div className="enterprise-card p-6">
            <h3 className="text-sm font-bold uppercase tracking-[0.05em] text-foreground mb-4">
              Other Role Guides
            </h3>
            <div className="space-y-2">
              {gettingStartedByRole
                .filter((g) => g !== activeGuide)
                .map((g) => (
                  <details key={g.roleCategory} className="group">
                    <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-foreground py-2 hover:text-primary transition-colors">
                      <ChevronRightIcon className="h-3.5 w-3.5 text-muted-foreground group-open:rotate-90 transition-transform" />
                      {g.roleCategory}
                    </summary>
                    <div className="pl-5.5 space-y-3 pb-3">
                      {g.steps.map((step) => (
                        <div key={step.step} className="flex gap-3 pl-1">
                          <span className="shrink-0 text-xs font-bold text-muted-foreground mt-0.5">{step.step}.</span>
                          <div>
                            <p className="text-sm font-medium text-foreground">{step.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderFeatureGuides() {
    return (
      <div className="space-y-6">
        <div className="enterprise-card p-6">
          <h3 className="text-sm font-bold uppercase tracking-[0.05em] text-foreground mb-1">
            Feature Guides
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Features available to you based on your current permissions.
          </p>
          {visibleFeatures.length === 0 ? (
            <p className="text-sm text-muted-foreground">No features are available for your current role.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {visibleFeatures.map((f) => (
                <Link
                  key={f.name}
                  href={f.href}
                  className="enterprise-card p-4 hover:border-primary/40 transition-colors block"
                >
                  <p className="text-sm font-medium text-foreground">{f.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{f.description}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderFaq() {
    return (
      <div className="space-y-6">
        {Array.from(faqByCategory.entries()).map(([category, items]) => (
          <div key={category} className="enterprise-card p-6">
            <h3 className="text-sm font-bold uppercase tracking-[0.05em] text-foreground mb-4">
              {category}
            </h3>
            <div className="divide-y divide-border">
              {items.map((item) => {
                const key = `${category}-${item.question}`;
                const isOpen = expandedFaq === key;
                return (
                  <div key={key}>
                    <button
                      onClick={() => setExpandedFaq(isOpen ? null : key)}
                      className="flex items-center justify-between w-full py-3 text-left gap-3"
                    >
                      <span className="text-sm font-medium text-foreground">{item.question}</span>
                      <ChevronDownIcon
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <p className="text-sm text-muted-foreground pb-3">{item.answer}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderShortcuts() {
    const allShortcuts = [...shortcutList, ...additionalShortcuts];
    return (
      <div className="space-y-6">
        <div className="enterprise-card p-6">
          <h3 className="text-sm font-bold uppercase tracking-[0.05em] text-foreground mb-1">
            Keyboard Shortcuts
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Use these shortcuts to navigate ShumelaHire more efficiently. Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted border border-border rounded-control">?</kbd> anywhere to toggle the shortcuts overlay.
          </p>
          <div className="divide-y divide-border">
            {allShortcuts.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <span className="text-sm text-foreground">{s.description}</span>
                <div className="flex items-center gap-1">
                  {s.keys.split(' ').map((key, j) => (
                    <span key={j} className="flex items-center gap-1">
                      {j > 0 && <span className="text-xs text-muted-foreground">then</span>}
                      <kbd className="px-2 py-1 text-xs font-mono bg-muted border border-border rounded-control">{key}</kbd>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderTroubleshooting() {
    return (
      <div className="space-y-6">
        <div className="enterprise-card p-6">
          <h3 className="text-sm font-bold uppercase tracking-[0.05em] text-foreground mb-1">
            Troubleshooting
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Common issues and their resolutions. If your problem is not listed, contact support.
          </p>
          <div className="divide-y divide-border">
            {troubleshootingItems.map((item) => {
              const isOpen = expandedTrouble === item.problem;
              return (
                <div key={item.problem}>
                  <button
                    onClick={() => setExpandedTrouble(isOpen ? null : item.problem)}
                    className="flex items-center justify-between w-full py-3 text-left gap-3"
                  >
                    <span className="text-sm font-medium text-foreground">{item.problem}</span>
                    <ChevronDownIcon
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="pb-4 space-y-2">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.05em] text-muted-foreground">Symptoms</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{item.symptoms}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.05em] text-muted-foreground">Resolution</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{item.resolution}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function renderContact() {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Self-service */}
          <div className="enterprise-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <BookOpenIcon className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-[0.05em] text-foreground">Self-Service</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Start with the FAQ and Troubleshooting tabs in this Help Center. Most common questions are answered there.
            </p>
            <button
              onClick={() => setActiveTab('faq')}
              className="btn-secondary text-xs"
            >
              View FAQ
            </button>
          </div>

          {/* Internal support */}
          <div className="enterprise-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-[0.05em] text-foreground">Internal Support</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              For access issues, role changes, or workflow questions, contact your internal system administrator.
            </p>
            <a
              href="mailto:support@shumelahire.co.za"
              className="btn-primary text-xs inline-block"
            >
              Email Support
            </a>
          </div>

          {/* Urgent incidents */}
          <div className="enterprise-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <WrenchScrewdriverIcon className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-[0.05em] text-foreground">Urgent Incidents</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              For production incidents or data issues, follow your organisation&apos;s incident process and on-call escalation policy.
            </p>
            <button
              onClick={() => setActiveTab('troubleshooting')}
              className="btn-secondary text-xs"
            >
              Troubleshooting
            </button>
          </div>
        </div>

        <div className="enterprise-card p-6">
          <h3 className="text-sm font-bold uppercase tracking-[0.05em] text-foreground mb-4">
            When Contacting Support
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            To help us resolve your issue quickly, include the following in your message:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1.5">
            <li>A description of the problem and what you expected to happen</li>
            <li>The page URL or route path where the issue occurred</li>
            <li>Screenshots showing the error or unexpected behaviour</li>
            <li>The approximate date and time the issue occurred</li>
            <li>Your browser name and version</li>
          </ul>
        </div>
      </div>
    );
  }

  function renderReleaseNotes() {
    return (
      <div className="space-y-6">
        {releaseNotes.map((release) => (
          <div key={release.version} className="enterprise-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-bold uppercase tracking-[0.05em] rounded-full bg-primary/10 text-primary border border-primary/20">
                {release.version}
              </span>
              <span className="text-xs text-muted-foreground">{release.date}</span>
            </div>
            <ul className="space-y-2">
              {release.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-cta" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Search results renderer
  // -------------------------------------------------------------------------

  function renderSearchResults() {
    if (searchResults.length === 0) {
      return (
        <div className="enterprise-card p-6 text-center">
          <p className="text-sm text-muted-foreground">No results found for &ldquo;{searchQuery}&rdquo;</p>
        </div>
      );
    }

    // Group by tab
    const grouped = new Map<HelpTab, SearchResult[]>();
    searchResults.forEach((r) => {
      const list = grouped.get(r.tab) ?? [];
      list.push(r);
      grouped.set(r.tab, list);
    });

    const tabLabel = (id: HelpTab) => TABS.find((t) => t.id === id)?.label ?? id;

    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
        </p>
        {Array.from(grouped.entries()).map(([tab, results]) => (
          <div key={tab} className="enterprise-card p-6">
            <h3 className="text-sm font-bold uppercase tracking-[0.05em] text-foreground mb-4">
              {tabLabel(tab)}
            </h3>
            <div className="space-y-3">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveTab(tab);
                    setSearchQuery('');
                  }}
                  className="block w-full text-left p-3 rounded-control hover:bg-accent transition-colors"
                >
                  <p className="text-sm font-medium text-foreground">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.snippet}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Tab content switch
  // -------------------------------------------------------------------------

  function renderContent() {
    switch (activeTab) {
      case 'getting-started':
        return renderGettingStarted();
      case 'features':
        return renderFeatureGuides();
      case 'faq':
        return renderFaq();
      case 'shortcuts':
        return renderShortcuts();
      case 'troubleshooting':
        return renderTroubleshooting();
      case 'contact':
        return renderContact();
      case 'release-notes':
        return renderReleaseNotes();
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <PageWrapper>
      <IdentityBand
        eyebrow="System"
        title="Help Center"
        subtitle="Find answers, explore features, and get support"
      />
      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search help articles, FAQ, troubleshooting..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input w-full pl-9"
          />
        </div>
      </div>

      {isSearching ? (
        renderSearchResults()
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar tabs */}
          <nav className="lg:w-56 shrink-0">
            <div className="enterprise-card p-2 flex lg:flex-col gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium rounded-control text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Tab content */}
          <div className="flex-1 min-w-0">{renderContent()}</div>
        </div>
      )}
    </PageWrapper>
  );
}
