import React, { useState, useEffect } from 'react';

interface ChartData {
  type: string;
  title: string;
  labels: string[];
  datasets: any[];
  scales?: any;
}

interface KPIWidget {
  value: number;
  unit: string;
  title: string;
  trend: string;
  target: number;
  color: string;
}

const ReportVisualization: React.FC = () => {
  const [kpis, setKPIs] = useState<Record<string, KPIWidget>>({});
  const [charts, setCharts] = useState<Record<string, ChartData>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDateRange, setSelectedDateRange] = useState('last-6-months');

  useEffect(() => {
    fetchVisualizationData();
  }, [selectedDateRange]);

  const fetchVisualizationData = async () => {
    setLoading(true);
    try {
      // Fetch KPIs
      const kpiResponse = await fetch('http://localhost:8080/api/visualization/kpis');
      const kpiData = await kpiResponse.json();
      setKPIs(kpiData);

      // Fetch individual charts
      const chartEndpoints = [
        'application-status',
        'applications-timeline',
        'top-positions',
        'source-effectiveness',
        'interview-ratings',
        'hiring-trends'
      ];

      const chartData: Record<string, ChartData> = {};
      
      for (const endpoint of chartEndpoints) {
        try {
          const response = await fetch(`http://localhost:8080/api/visualization/charts/${endpoint}${getDateParam()}`);
          const data = await response.json();
          chartData[endpoint] = data;
        } catch (error) {
          console.error(`Error fetching ${endpoint}:`, error);
        }
      }

      setCharts(chartData);
    } catch (error) {
      console.error('Error fetching visualization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateParam = () => {
    const now = new Date();
    let fromDate: Date;

    switch (selectedDateRange) {
      case 'last-30-days':
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last-3-months':
        fromDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'last-6-months':
        fromDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      default:
        fromDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    }

    return `?fromDate=${fromDate.toISOString().split('T')[0]}`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '📊';
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-violet-500 text-violet-100',
      green: 'bg-green-500 text-green-100',
      purple: 'bg-purple-500 text-purple-100',
      orange: 'bg-orange-500 text-orange-100',
      red: 'bg-red-500 text-red-100',
    };
    return colorMap[color] || 'bg-gray-500 text-gray-100';
  };

  const KPICard: React.FC<{ kpi: KPIWidget; name: string }> = ({ kpi, name }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-violet-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
          <div className="flex items-baseline mt-1">
            <p className="text-3xl font-bold text-gray-900">
              {kpi.unit === '$' && kpi.unit}
              {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
              {kpi.unit !== '$' && kpi.unit}
            </p>
            <p className="ml-2 text-sm font-medium text-gray-500">
              / {kpi.target}{kpi.unit !== '$' && kpi.unit}
            </p>
          </div>
        </div>
        <div className={`flex items-center justify-center w-12 h-12 rounded-full ${getColorClasses(kpi.color)}`}>
          {getTrendIcon(kpi.trend)}
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-600">Target Progress:</span>
          <div className="ml-2 flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full bg-${kpi.color}-500`}
              style={{ width: `${Math.min(100, (Number(kpi.value) / kpi.target) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const ChartCard: React.FC<{ chart: ChartData; name: string }> = ({ chart, name }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{chart.title}</h3>
      <div className="h-64 flex items-center justify-center">
        {chart.type === 'pie' && (
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <div className="space-y-2">
              {chart.labels.map((label, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{label}:</span>
                  <span className="font-medium">{chart.datasets[0]?.data[index] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {chart.type === 'line' && (
          <div className="w-full text-center">
            <div className="text-4xl mb-4">📈</div>
            <div className="text-sm text-gray-600">
              {chart.datasets.map((dataset, index) => (
                <div key={index} className="mb-2">
                  <strong>{dataset.label}:</strong> {dataset.data.reduce((a: number, b: number) => a + b, 0)} total
                </div>
              ))}
            </div>
          </div>
        )}
        
        {chart.type === 'bar' && (
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <div className="text-sm text-gray-600">
              Top {chart.labels.length} entries shown
            </div>
          </div>
        )}
        
        {chart.type === 'horizontalBar' && (
          <div className="w-full">
            <div className="text-4xl text-center mb-4">📈</div>
            <div className="space-y-2">
              {chart.labels.slice(0, 5).map((label, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-24 text-xs text-gray-600 truncate">{label}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 mx-2">
                    <div 
                      className="bg-green-500 h-4 rounded-full"
                      style={{ width: `${(chart.datasets[0]?.data[index] / Math.max(...chart.datasets[0]?.data)) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">{chart.datasets[0]?.data[index]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {chart.type === 'radar' && (
          <div className="text-center">
            <div className="text-4xl mb-4">🎯</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {chart.labels.map((label, index) => (
                <div key={index} className="text-gray-600">
                  <strong>{label}:</strong> {chart.datasets[0]?.data[index]?.toFixed(1) || '0.0'}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const exportVisualization = async (format: string) => {
    try {
      const exportData = {
        kpis,
        charts,
        metadata: {
          generatedAt: new Date().toISOString(),
          dateRange: selectedDateRange,
          format
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `visualization_data_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting visualization:', error);
      alert('Error exporting visualization data. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Data Visualization</h1>
            <p className="mt-2 text-gray-600">Interactive charts and analytics for recruitment insights</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
            >
              <option value="last-30-days">Last 30 Days</option>
              <option value="last-3-months">Last 3 Months</option>
              <option value="last-6-months">Last 6 Months</option>
            </select>
            <button
              onClick={() => exportVisualization('json')}
              className="bg-violet-600 text-white px-4 py-2 rounded hover:bg-violet-700 transition-colors"
            >
              Export Data
            </button>
          </div>
        </div>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Object.entries(kpis).map(([name, kpi]) => (
          <KPICard key={name} kpi={kpi} name={name} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {Object.entries(charts).map(([name, chart]) => (
          <ChartCard key={name} chart={chart} name={name} />
        ))}
      </div>

      {/* Help Section */}
      <div className="bg-violet-50 border border-violet-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-violet-900 mb-2">📊 Visualization Guide</h3>
        <div className="text-sm text-violet-800 space-y-1">
          <p>• <strong>KPI Widgets:</strong> Key performance indicators with progress bars and trend indicators</p>
          <p>• <strong>Charts:</strong> Visual representations of recruitment data including status distribution, timeline trends, and performance metrics</p>
          <p>• <strong>Date Range:</strong> Adjust the time period to see different trends and patterns</p>
          <p>• <strong>Export:</strong> Download visualization data for further analysis or reporting</p>
        </div>
      </div>
    </div>
  );
};

export default ReportVisualization;
