import fs from 'fs';
import path from 'path';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { PipelineFunnelChart, SourceEffectivenessChart } from '@/components/charts/RecruitmentMetrics';

// The populated charts read the theme to colour their axes and grid; the empty path returns before
// that, which is why only this case needs it.
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ colorMode: 'light', resolvedTheme: 'light', setCurrentRole: jest.fn() }),
}));

const source = fs.readFileSync(
  path.join(process.cwd(), 'src', 'components', 'charts', 'RecruitmentMetrics.tsx'),
  'utf8',
);
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

/**
 * The six charts on the analytics page.
 *
 * <p>Not one of them checked the length of its data. A series the backend returned empty — which
 * happens per department, since the analytics endpoint reports what it has — drew a titled frame
 * with nothing inside, and a reader could not tell an empty period from a measure nobody collects.
 */
describe('a chart with nothing behind it says so', () => {
  it('shows the empty state rather than an empty frame', () => {
    render(<PipelineFunnelChart data={[]} />);

    expect(screen.getByText('Recruitment Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Not reported')).toBeInTheDocument();
  });

  it('keeps the heading, so the reader knows what is missing', () => {
    render(<SourceEffectivenessChart data={[]} />);

    expect(screen.getByText('Source Effectiveness')).toBeInTheDocument();
    expect(screen.getByText(/A different period or department may have data/)).toBeInTheDocument();
  });

  it('guards every chart, not just the two rendered here', () => {
    // Six — the seventh, HiringManagerPerformanceChart, is rendered nowhere and is left alone.
    expect((strip(source).match(/if \(!data\?\.length\)/g) ?? []).length).toBe(6);
  });
});

describe('the funnel does not divide by zero', () => {
  it('reports 0% rather than Infinity when a stage is empty', () => {
    // ((stage.count / 0) * 100) prints Infinity%, which reads as a number.
    render(
      <PipelineFunnelChart
        data={[
          { stage: 'Applied', count: 0, percentage: 0 },
          { stage: 'Screening', count: 5, percentage: 0 },
        ] as never}
      />,
    );

    expect(screen.queryByText(/Infinity/)).not.toBeInTheDocument();
  });
});

describe('the chart cards read from the product palette', () => {
  it('uses tokens rather than a fixed light palette', () => {
    const code = strip(source);

    expect(code).not.toMatch(/\bbg-white\b/);
    expect(code).not.toMatch(/\btext-gray-\d{3}\b/);
    expect(code).not.toMatch(/\bborder-gray-\d{3}\b/);
    expect(code).toContain('bg-card');
    expect(code).toContain('text-muted-foreground');
  });

  it('draws one card, defined once', () => {
    // The seven cards repeated the same class string; the empty state has to match the filled one.
    expect(source).toContain("const CARD = 'bg-card rounded-card border border-border");
  });
});
