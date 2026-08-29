'use client';

import React, { useState } from 'react';
import {
  PencilIcon,
  TrashIcon,
  ShareIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { ReportConfig } from './ReportBuilder';
import EmptyState from '@/components/EmptyState';

export interface SavedReport extends ReportConfig {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isShared: boolean;
  lastRun?: string;
  runCount: number;
  tags: string[];
}

interface ReportLibraryProps {
  reports: SavedReport[];
  onRun: (report: SavedReport) => void;
  onEdit: (report: SavedReport) => void;
  onDelete: (reportId: string) => void;
  onDuplicate: (report: SavedReport) => void;
  onShare: (reportId: string) => void;
  onView: (report: SavedReport) => void;
  className?: string;
}

/**
 * A saved report is a row, not a card.
 *
 * <p>What the reader wants from this list is: what is it about, does it run by itself, did the last
 * run work, and can I run it now. That is four facts, and a three-across grid of cards spent a
 * quarter of the screen on each while pushing the schedule state into a hoverable icon.
 *
 * <p>The category sidebar is gone rather than restyled. It assigned reports by scanning
 * {@code report.fields} for substrings — 'candidate', 'application', 'pipeline', 'stage' — against
 * the flat field list that predates the subject catalogue. Measured against the columns the wizard
 * now offers: <b>Pipeline matches nothing at all</b>, so it could only ever read zero on every
 * tenant, and Recruitment matches only the analytics measure {@code applications} — so a saved
 * Applications report, whose columns are {@code applicant_name}, {@code job_title}, {@code status}
 * and {@code submitted_date}, fell into no category but All. Sorting went with it: on a list this
 * shape, most-recently-updated first is the only order anyone asked for.
 *
 * <p>Search stays. It is the one control that still does what it says.
 */

import { subjectFor } from './subjects';

/** When a report last produced something, or that it never has. */
function lastRunLabel(report: SavedReport): string {
  if (!report.lastRun) return 'never run';
  const when = new Date(report.lastRun);
  if (Number.isNaN(when.getTime())) return 'never run';
  return `last run ${when.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}`;
}

/** The schedule state, as one of three things a reader can act on. */
function scheduleState(report: SavedReport): { label: string; tone: 'idle' | 'ok' | 'bad' } {
  if (!report.schedule?.enabled) return { label: 'Not scheduled', tone: 'idle' };
  const frequency = report.schedule.frequency;
  return { label: frequency.charAt(0).toUpperCase() + frequency.slice(1), tone: 'ok' };
}

export default function ReportLibrary({
  reports,
  onRun,
  onEdit,
  onDelete,
  onDuplicate,
  onShare,
  onView,
  className = '',
}: ReportLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReports = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matched = query
      ? reports.filter(
          (r) =>
            r.name.toLowerCase().includes(query) ||
            r.description?.toLowerCase().includes(query) ||
            r.tags.some((tag) => tag.toLowerCase().includes(query)),
        )
      : [...reports];

    return matched.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [reports, searchQuery]);

  return (
    <section className={`bg-card border border-border rounded-card ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <div>
          <h2 className="text-[1.0625rem] font-bold text-foreground">Saved reports</h2>
          <p className="text-[0.8125rem] text-muted-foreground mt-0.5">
            {reports.length === 0
              ? 'Nothing saved yet'
              : `${reports.length} saved · most recently changed first`}
          </p>
        </div>
        <input
          type="search"
          aria-label="Search saved reports"
          placeholder="Search reports…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-64 rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cta"
        />
      </div>

      {filteredReports.length === 0 ? (
        searchQuery ? (
          <EmptyState
            icon={ChartBarIcon}
            title={`Nothing saved matches "${searchQuery}"`}
            description="Search looks at the report name, its description and its tags. Clear it to see everything saved."
          />
        ) : (
          <EmptyState
            icon={ChartBarIcon}
            title="No saved reports"
            description="Build a report and save it here to run it again later, or to put it on a schedule."
          />
        )
      ) : (
        <ul className="px-5">
          {filteredReports.map((report) => {
            const subject = subjectFor(report.subject);
            const state = scheduleState(report);
            const unit = subject.aggregate ? 'measure' : 'column';
            const count = report.fields.length;

            return (
              <li
                key={report.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5 border-b border-border last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{report.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {subject.noun}s · {count} {count === 1 ? unit : `${unit}s`} · {lastRunLabel(report)}
                  </p>
                </div>

                <span
                  className={`flex-none px-2.5 py-1 rounded-full text-[0.6875rem] font-bold ${
                    state.tone === 'ok'
                      ? 'bg-success-bg text-success-on-tint'
                      : state.tone === 'bad'
                        ? 'bg-error-bg text-error-on-tint'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {state.label}
                </span>

                <div className="flex flex-none items-center gap-1">
                  <button
                    onClick={() => onRun(report)}
                    className="rounded-full border border-border px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-accent"
                  >
                    Run
                  </button>
                  <button
                    onClick={() => onView(report)}
                    aria-label={`Preview ${report.name}`}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onEdit(report)}
                    aria-label={`Edit ${report.name}`}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDuplicate(report)}
                    aria-label={`Duplicate ${report.name}`}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onShare(report.id)}
                    aria-label={`Share ${report.name}`}
                    className="p-1.5 text-muted-foreground hover:text-success-on-tint rounded"
                  >
                    <ShareIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(report.id)}
                    aria-label={`Delete ${report.name}`}
                    className="p-1.5 text-muted-foreground hover:text-error-on-tint rounded"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
