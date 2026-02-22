'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  ComposedChart,
} from 'recharts';

// Color palette for consistent chart theming
export const CHART_COLORS = {
  primary: '#05527E',
  secondary: '#008C7F',
  success: '#10b981',
  warning: '#F1C54B',
  danger: '#ef4444',
  info: '#0693E3',
  gray: '#64748B',
  light: '#E2E8F0',
  dark: '#0F172A',
} as const;

export const CHART_COLOR_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.danger,
  CHART_COLORS.info,
  '#4CA6D0', // navy-400
  '#21D4C4', // teal-400
  '#D4A832', // gold-600
  '#04466B', // navy-700
];

const CHART_GRID = '#E2E8F0';
const CHART_AXIS = '#64748B';

const DARK_CHART_COLORS = {
  primary: '#4CA6D0',
  secondary: '#21D4C4',
  success: '#34D399',
  warning: '#F6CE5E',
  danger: '#F87171',
  info: '#38BDF8',
  gray: '#94A3B8',
  light: '#1E3A5F',
  dark: '#F8FAFC',
} as const;

const DARK_CHART_COLOR_PALETTE = [
  DARK_CHART_COLORS.primary,
  DARK_CHART_COLORS.secondary,
  DARK_CHART_COLORS.success,
  DARK_CHART_COLORS.warning,
  DARK_CHART_COLORS.danger,
  DARK_CHART_COLORS.info,
  '#83C3E2', // navy-300
  '#53EBDA', // teal-300
  '#F6CE5E', // gold-400
  '#B5DCEF', // navy-200
];

const DARK_CHART_GRID = '#1E3A5F';
const DARK_CHART_AXIS = '#94A3B8';

export function useChartColors() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return {
    colors: isDark ? DARK_CHART_COLORS : CHART_COLORS,
    palette: isDark ? DARK_CHART_COLOR_PALETTE : CHART_COLOR_PALETTE,
    grid: isDark ? DARK_CHART_GRID : CHART_GRID,
    axis: isDark ? DARK_CHART_AXIS : CHART_AXIS,
  };
}

const CHART_TOOLTIP_STYLE = {
  backgroundColor: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '4px',
  boxShadow: '0 4px 10px rgba(50, 50, 93, 0.09), 0 2px 5px rgba(0, 0, 0, 0.07)',
} as const;

// Common chart props interface
interface BaseChartProps {
  data: Array<Record<string, unknown>>;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  animated?: boolean;
  className?: string;
}

// Line Chart Component
interface LineChartProps extends BaseChartProps {
  xKey: string;
  yKey: string;
  color?: string;
  strokeWidth?: number;
  showDots?: boolean;
  curved?: boolean;
}

export const RecruitmentLineChart: React.FC<LineChartProps> = ({
  data,
  xKey,
  yKey,
  height = 300,
  color = CHART_COLORS.primary,
  strokeWidth = 2,
  showGrid = true,
  showLegend = false,
  showDots = true,
  curved = true,
  animated = true,
  className = '',
}) => {
  const { grid, axis } = useChartColors();

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={grid} />}
          <XAxis
            dataKey={xKey}
            stroke={axis}
            fontSize={12}
          />
          <YAxis
            stroke={axis}
            fontSize={12}
          />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
          {showLegend && <Legend />}
          <Line
            type={curved ? "monotone" : "linear"}
            dataKey={yKey}
            stroke={color}
            strokeWidth={strokeWidth}
            dot={showDots ? { fill: color, r: 4 } : false}
            animationDuration={animated ? 1500 : 0}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Area Chart Component
interface AreaChartProps extends BaseChartProps {
  xKey: string;
  yKey: string;
  color?: string;
  fillOpacity?: number;
}

export const RecruitmentAreaChart: React.FC<AreaChartProps> = ({
  data,
  xKey,
  yKey,
  height = 300,
  color = CHART_COLORS.primary,
  fillOpacity = 0.6,
  showGrid = true,
  showLegend = false,
  animated = true,
  className = '',
}) => {
  const { grid, axis } = useChartColors();

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={grid} />}
          <XAxis dataKey={xKey} stroke={axis} fontSize={12} />
          <YAxis stroke={axis} fontSize={12} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
          {showLegend && <Legend />}
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={color}
            fill={color}
            fillOpacity={fillOpacity}
            animationDuration={animated ? 1500 : 0}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Bar Chart Component
interface BarChartProps extends BaseChartProps {
  xKey: string;
  yKey: string;
  color?: string;
  horizontal?: boolean;
}

export const RecruitmentBarChart: React.FC<BarChartProps> = ({
  data,
  xKey,
  yKey,
  height = 300,
  color = CHART_COLORS.primary,
  showGrid = true,
  showLegend = false,
  horizontal = false,
  animated = true,
  className = '',
}) => {
  const { grid, axis } = useChartColors();
  const ChartComponent = horizontal ? BarChart : BarChart;

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          layout={horizontal ? 'horizontal' : 'vertical'}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={grid} />}
          <XAxis
            dataKey={horizontal ? yKey : xKey}
            type={horizontal ? 'number' : 'category'}
            stroke={axis}
            fontSize={12}
          />
          <YAxis
            dataKey={horizontal ? xKey : undefined}
            type={horizontal ? 'category' : 'number'}
            stroke={axis}
            fontSize={12}
          />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
          {showLegend && <Legend />}
          <Bar
            dataKey={yKey}
            fill={color}
            animationDuration={animated ? 1500 : 0}
            radius={[2, 2, 0, 0]}
          />
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};

// Pie Chart Component
interface PieChartProps extends BaseChartProps {
  dataKey: string;
  nameKey?: string;
  colors?: string[];
  innerRadius?: number;
  showLabels?: boolean;
}

export const RecruitmentPieChart: React.FC<PieChartProps> = ({
  data,
  dataKey,
  height = 300,
  colors,
  innerRadius = 0,
  showLabels = true,
  showLegend = true,
  animated = true,
  className = '',
}) => {
  const { palette } = useChartColors();
  const resolvedColors = colors || palette;

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={80}
            paddingAngle={5}
            dataKey={dataKey}
            animationDuration={animated ? 1500 : 0}
            label={showLabels ? ({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%` : false}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={resolvedColors[index % resolvedColors.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
          {showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Radial Bar Chart (Progress/Gauge Chart)
interface RadialBarChartProps extends BaseChartProps {
  dataKey: string;
  color?: string;
}

export const RecruitmentRadialChart: React.FC<RadialBarChartProps> = ({
  data,
  dataKey,
  height = 250,
  color = CHART_COLORS.primary,
  animated = true,
  className = '',
}) => {
  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="80%" data={data}>
          <RadialBar
            dataKey={dataKey}
            cornerRadius={10}
            fill={color}
            animationDuration={animated ? 1500 : 0}
          />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Composed Chart (Line + Bar combination)
interface ComposedChartProps extends BaseChartProps {
  xKey: string;
  barData: { key: string; color?: string }[];
  lineData: { key: string; color?: string }[];
}

export const RecruitmentComposedChart: React.FC<ComposedChartProps> = ({
  data,
  xKey,
  barData,
  lineData,
  height = 300,
  showGrid = true,
  showLegend = true,
  animated = true,
  className = '',
}) => {
  const { grid, axis, palette } = useChartColors();

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={grid} />}
          <XAxis dataKey={xKey} stroke={axis} fontSize={12} />
          <YAxis stroke={axis} fontSize={12} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
          {showLegend && <Legend />}
          {barData.map((bar, index) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              fill={bar.color || palette[index % palette.length]}
              animationDuration={animated ? 1500 : 0}
            />
          ))}
          {lineData.map((line, index) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              stroke={line.color || palette[(index + barData.length) % palette.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              animationDuration={animated ? 1500 : 0}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// Custom Tooltip Component
interface CustomTooltipPayloadEntry {
  color: string;
  name: string;
  value: string | number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: CustomTooltipPayloadEntry[];
  label?: string | number;
}

export const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card p-3 border border-border rounded-card shadow-lg">
        <p className="font-medium text-foreground">{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};
