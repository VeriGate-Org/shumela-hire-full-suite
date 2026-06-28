import React, { useMemo } from 'react';
import { format } from 'date-fns';
import {
  RecruitmentBarChart,
  RecruitmentAreaChart,
  RecruitmentRadialChart,
  RecruitmentComposedChart,
  CHART_COLORS,
} from './RecruitmentCharts';

// Types for recruitment metrics
interface ApplicationMetrics {
  date: string;
  applications: number;
  interviews: number;
  offers: number;
  hires: number;
  [key: string]: unknown;
}

interface PipelineStageData {
  stage: string;
  count: number;
  color?: string;
  [key: string]: unknown;
}

interface SourceEffectivenessData {
  source: string;
  applications: number;
  hires: number;
  conversionRate: number;
  [key: string]: unknown;
}

interface TimeToHireData {
  position: string;
  timeToHire: number;
  target: number;
  [key: string]: unknown;
}

interface PerformanceMetrics {
  metric: string;
  current: number;
  target: number;
  percentage: number;
  [key: string]: unknown;
}

// Application Volume Trend Chart
interface ApplicationVolumeProps {
  data: ApplicationMetrics[];
  timeframe?: 'week' | 'month' | 'quarter';
  className?: string;
}

const ApplicationVolumeChart: React.FC<ApplicationVolumeProps> = ({
  data,
  timeframe = 'month',
  className = '',
}) => {
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      date: format(new Date(item.date), 'MMM dd'),
    }));
  }, [data]);

  return (
    <div className={`bg-white rounded-control border border-gray-200 border-t-2 border-t-gold-500 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Application Volume Trend</h3>
        <p className="text-sm text-gray-500">
          Daily application submissions over the last {timeframe}
        </p>
      </div>
      <RecruitmentAreaChart
        data={chartData}
        xKey="date"
        yKey="applications"
        height={300}
        color={CHART_COLORS.primary}
        fillOpacity={0.3}
      />
    </div>
  );
};

// Pipeline Funnel Chart
interface PipelineFunnelProps {
  data: PipelineStageData[];
  className?: string;
}

const PipelineFunnelChart: React.FC<PipelineFunnelProps> = ({
  data,
  className = '',
}) => {
  const conversionRates = useMemo(() => {
    return data.map((stage, index) => {
      if (index === 0) return { ...stage, conversionRate: 100 };
      const previousStage = data[index - 1];
      const rate = ((stage.count / previousStage.count) * 100).toFixed(1);
      return { ...stage, conversionRate: parseFloat(rate) };
    });
  }, [data]);

  return (
    <div className={`bg-white rounded-control border border-gray-200 border-t-2 border-t-gold-500 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recruitment Pipeline</h3>
        <p className="text-sm text-gray-500">
          Current candidates at each stage with conversion rates
        </p>
      </div>
      
      {/* Visual funnel representation */}
      <div className="space-y-2 mb-6">
        {conversionRates.map((stage, _index) => {
          const width = (stage.count / data[0].count) * 100;
          return (
            <div key={stage.stage} className="flex items-center space-x-3">
              <div className="w-32 text-sm font-medium text-gray-700 text-right">
                {stage.stage}
              </div>
              <div className="flex-1 bg-gray-100 rounded-full h-8 relative">
                <div
                  className="bg-gold-500 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium transition-all duration-1000 ease-out"
                  style={{ width: `${width}%` }}
                >
                  {stage.count}
                </div>
              </div>
              <div className="w-16 text-sm text-gray-500 text-center">
                {stage.conversionRate.toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Bar chart representation */}
      <RecruitmentBarChart
        data={data}
        xKey="stage"
        yKey="count"
        height={200}
        color={CHART_COLORS.primary}
      />
    </div>
  );
};

// Source Effectiveness Chart
interface SourceEffectivenessProps {
  data: SourceEffectivenessData[];
  className?: string;
}

const SourceEffectivenessChart: React.FC<SourceEffectivenessProps> = ({
  data,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-control border border-gray-200 border-t-2 border-t-gold-500 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Source Effectiveness</h3>
        <p className="text-sm text-gray-500">
          Application volume vs. conversion rate by source
        </p>
      </div>
      <RecruitmentComposedChart
        data={data}
        xKey="source"
        barData={[{ key: 'applications', color: CHART_COLORS.primary }]}
        lineData={[{ key: 'conversionRate', color: CHART_COLORS.success }]}
        height={300}
      />
    </div>
  );
};

// Time to Hire Chart
interface TimeToHireProps {
  data: TimeToHireData[];
  className?: string;
}

const TimeToHireChart: React.FC<TimeToHireProps> = ({
  data,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-control border border-gray-200 border-t-2 border-t-gold-500 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Time to Hire Analysis</h3>
        <p className="text-sm text-gray-500">
          Average days to hire vs. target by position
        </p>
      </div>
      <RecruitmentComposedChart
        data={data}
        xKey="position"
        barData={[
          { key: 'timeToHire', color: CHART_COLORS.warning },
          { key: 'target', color: CHART_COLORS.success },
        ]}
        lineData={[]}
        height={300}
      />
    </div>
  );
};

// Performance KPI Gauge
interface PerformanceGaugeProps {
  data: PerformanceMetrics[];
  className?: string;
}

const PerformanceGaugeChart: React.FC<PerformanceGaugeProps> = ({
  data,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-control border border-gray-200 border-t-2 border-t-gold-500 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Performance KPIs</h3>
        <p className="text-sm text-gray-500">
          Current performance vs. targets
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((metric, _index) => {
          const gaugeData = [{ name: metric.metric, value: metric.percentage, fill: getPerformanceColor(metric.percentage) }];
          
          return (
            <div key={metric.metric} className="text-center">
              <RecruitmentRadialChart
                data={gaugeData}
                dataKey="value"
                height={180}
                color={getPerformanceColor(metric.percentage)}
              />
              <div className="mt-2">
                <h4 className="font-medium text-gray-900">{metric.metric}</h4>
                <p className="text-sm text-gray-500">
                  {metric.current} / {metric.target} ({metric.percentage.toFixed(1)}%)
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Helper function for performance color coding
const getPerformanceColor = (percentage: number): string => {
  if (percentage >= 90) return CHART_COLORS.success;
  if (percentage >= 75) return CHART_COLORS.warning;
  return CHART_COLORS.danger;
};

// Hiring Manager Performance Chart
interface HiringManagerData {
  manager: string;
  positions: number;
  timeToFill: number;
  satisfaction: number;
  [key: string]: unknown;
}

interface HiringManagerPerformanceProps {
  data: HiringManagerData[];
  className?: string;
}

const HiringManagerPerformanceChart: React.FC<HiringManagerPerformanceProps> = ({
  data,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-control border border-gray-200 border-t-2 border-t-gold-500 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Hiring Manager Performance</h3>
        <p className="text-sm text-gray-500">
          Time to fill vs. satisfaction ratings by manager
        </p>
      </div>
      <RecruitmentComposedChart
        data={data}
        xKey="manager"
        barData={[
          { key: 'timeToFill', color: CHART_COLORS.primary },
        ]}
        lineData={[
          { key: 'satisfaction', color: CHART_COLORS.success },
        ]}
        height={300}
      />
    </div>
  );
};

// Monthly Hiring Trends
interface MonthlyTrendsData {
  month: string;
  applications: number;
  interviews: number;
  offers: number;
  hires: number;
  rejections: number;
  [key: string]: unknown;
}

interface MonthlyTrendsProps {
  data: MonthlyTrendsData[];
  className?: string;
}

const MonthlyTrendsChart: React.FC<MonthlyTrendsProps> = ({
  data,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-control border border-gray-200 border-t-2 border-t-gold-500 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Monthly Hiring Trends</h3>
        <p className="text-sm text-gray-500">
          Complete hiring funnel metrics over time
        </p>
      </div>
      <RecruitmentComposedChart
        data={data}
        xKey="month"
        barData={[
          { key: 'applications', color: CHART_COLORS.primary },
          { key: 'interviews', color: CHART_COLORS.secondary },
          { key: 'offers', color: CHART_COLORS.warning },
          { key: 'hires', color: CHART_COLORS.success },
        ]}
        lineData={[]}
        height={400}
      />
    </div>
  );
};

// Export all components
export {
  ApplicationVolumeChart,
  PipelineFunnelChart,
  SourceEffectivenessChart,
  TimeToHireChart,
  PerformanceGaugeChart,
  HiringManagerPerformanceChart,
  MonthlyTrendsChart,
};
