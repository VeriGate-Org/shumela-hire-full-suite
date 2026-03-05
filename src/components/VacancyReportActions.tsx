'use client';

import React, { useState } from 'react';
import { useToast } from '@/components/Toast';
import { vacancyReportService } from '@/services/vacancyReportService';

interface VacancyReportActionsProps {
  jobId: string;
  showDemographics?: boolean;
}

export default function VacancyReportActions({ jobId, showDemographics = false }: VacancyReportActionsProps) {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (type: 'summary' | 'shortlist' | 'response-handling' | 'demographics') => {
    setDownloading(type);
    try {
      switch (type) {
        case 'summary':
          await vacancyReportService.downloadVacancySummaryPdf(jobId);
          break;
        case 'shortlist':
          await vacancyReportService.downloadShortlistPackPdf(jobId);
          break;
        case 'response-handling':
          await vacancyReportService.downloadResponseHandlingPdf(jobId);
          break;
        case 'demographics':
          await vacancyReportService.downloadDemographicsReportPdf(jobId);
          break;
      }
    } catch (error) {
      console.error(`Failed to download ${type} report:`, error);
      toast(`Failed to download ${type} report. Please try again.`, 'error');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
        IDC Reports
      </h4>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleDownload('summary')}
          disabled={downloading !== null}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-violet-700 bg-gold-50 border border-violet-200 rounded-sm hover:bg-gold-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloading === 'summary' ? 'Generating...' : 'Vacancy Summary'}
        </button>

        <button
          onClick={() => handleDownload('shortlist')}
          disabled={downloading !== null}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-violet-700 bg-gold-50 border border-violet-200 rounded-sm hover:bg-gold-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloading === 'shortlist' ? 'Generating...' : 'Shortlist Pack'}
        </button>

        <button
          onClick={() => handleDownload('response-handling')}
          disabled={downloading !== null}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-violet-700 bg-gold-50 border border-violet-200 rounded-sm hover:bg-gold-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloading === 'response-handling' ? 'Generating...' : 'Response Handling'}
        </button>

        {showDemographics && (
          <a
            href="/reports/demographics-ee-report.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-violet-700 bg-gold-50 border border-violet-200 rounded-sm hover:bg-gold-100"
          >
            Demographics / EE
          </a>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Reports are generated in accordance with POPIA. Demographic data is only included where explicit consent has been provided.
      </p>
    </div>
  );
}
