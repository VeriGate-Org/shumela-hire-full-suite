'use client';

import React from 'react';

interface PipelineStage {
  name: string;
  displayName: string;
  order: number;
  isActive: boolean;
  isTerminal: boolean;
  successful: boolean;
  rejected: boolean;
  withdrawn: boolean;
  cssClass: string;
  statusIcon: string;
  progressPercentage: number;
}

interface PipelineFunnelProps {
  funnelData: Record<string, number>;
  stages: PipelineStage[];
  onStageClick?: (stage: string) => void;
}

export default function PipelineFunnel({ funnelData, stages, onStageClick }: PipelineFunnelProps) {
  // Sort stages by order and filter to active stages for the funnel
  const activeStages = stages
    .filter(stage => stage.isActive)
    .sort((a, b) => a.order - b.order);

  // Calculate funnel data with conversion rates
  const funnelStages = activeStages.map((stage, index) => {
    const count = Number(funnelData[stage.displayName]) || 0;
    const previousCount = index > 0 ? (Number(funnelData[activeStages[index - 1].displayName]) || 0) : count;
    const conversionRate = previousCount > 0 ? (count / previousCount) * 100 : (index === 0 ? 100 : 0);
    
    return {
      ...stage,
      count,
      conversionRate,
      isFirst: index === 0,
      isLast: index === activeStages.length - 1
    };
  });

  // Calculate maximum count for width scaling
  const maxCount = Math.max(...funnelStages.map(stage => stage.count), 1);

  // Calculate funnel width as percentage
  const getFunnelWidth = (count: number) => {
    return Math.max((count / maxCount) * 100, 10); // Minimum 10% width
  };

  // Get color based on conversion rate
  const getConversionColor = (conversionRate: number) => {
    if (conversionRate >= 80) return 'text-green-600';
    if (conversionRate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-control shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Recruitment Pipeline Funnel</h3>
        <div className="text-sm text-gray-500">
          Total applications processed: {funnelStages[0]?.count || 0}
        </div>
      </div>

      <div className="space-y-4">
        {funnelStages.map((stage, index) => (
          <div key={stage.name} className="relative">
            {/* Connector Line */}
            {!stage.isLast && (
              <div className="absolute left-1/2 transform -translate-x-1/2 top-full z-10">
                <div className="w-0.5 h-4 bg-gray-300"></div>
                <div className="w-3 h-3 bg-gray-300 rounded-full transform -translate-x-1 -translate-y-1"></div>
              </div>
            )}

            {/* Funnel Stage */}
            <div 
              className={`relative mx-auto cursor-pointer transition-all hover:shadow-md ${
                stage.count > 0 ? 'hover:scale-105' : ''
              }`}
              style={{ width: `${getFunnelWidth(stage.count)}%`, minWidth: '200px' }}
              onClick={() => onStageClick && onStageClick(stage.name)}
            >
              <div className={`${stage.cssClass} border-2 rounded-control p-4 text-center`}>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-lg">{stage.statusIcon}</span>
                  <h4 className="font-medium text-sm">{stage.displayName}</h4>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xl font-bold">{stage.count}</p>
                  <p className="text-xs opacity-75">applications</p>
                  
                  {!stage.isFirst && (
                    <div className="flex items-center justify-center space-x-2 text-xs">
                      <span className={`font-medium ${getConversionColor(stage.conversionRate)}`}>
                        {(isNaN(stage.conversionRate) ? 0 : stage.conversionRate).toFixed(1)}%
                      </span>
                      <span className="opacity-75">conversion</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Stage percentage indicator */}
              <div className="absolute -top-2 -right-2 bg-gold-500 text-white text-xs rounded-full w-8 h-8 flex items-center justify-center font-medium">
                {((stage.count / (funnelStages[0]?.count || 1)) * 100).toFixed(0)}%
              </div>
            </div>

            {/* Stage Details */}
            <div className="mt-2 text-center text-xs text-gray-500">
              {stage.count > 0 && (
                <div className="space-y-1">
                  <p>Stage {stage.order}</p>
                  {!stage.isFirst && (
                    <p>
                      {funnelStages[index - 1]?.count - stage.count} dropped
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Terminal Stages Summary */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h4 className="text-md font-medium text-gray-900 mb-4">Final Outcomes</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stages
            .filter(stage => stage.isTerminal)
            .map(stage => {
              const count = funnelData[stage.displayName] || 0;
              const percentage = funnelStages[0]?.count > 0 ? 
                (count / funnelStages[0].count * 100).toFixed(1) : '0.0';
              
              return (
                <div 
                  key={stage.name}
                  className={`${stage.cssClass} border rounded-control p-4 cursor-pointer hover:shadow-md transition-shadow`}
                  onClick={() => onStageClick && onStageClick(stage.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{stage.statusIcon}</span>
                      <div>
                        <p className="font-medium text-sm">{stage.displayName}</p>
                        <p className="text-xs opacity-75">{percentage}% of total</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{count}</p>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Funnel Metrics */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-md font-medium text-gray-900 mb-4">Pipeline Metrics</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-gold-50 rounded-control p-3">
            <p className="font-medium text-violet-900">Total Funnel</p>
            <p className="text-lg font-bold text-gold-600">{funnelStages[0]?.count || 0}</p>
            <p className="text-xs text-violet-700">applications started</p>
          </div>
          
          <div className="bg-green-50 rounded-control p-3">
            <p className="font-medium text-green-900">Success Rate</p>
            <p className="text-lg font-bold text-green-600">
              {funnelStages[0]?.count > 0 ? 
                (((funnelData['Offer Accepted'] || 0) + (funnelData['Hired'] || 0)) / funnelStages[0].count * 100).toFixed(1) : 
                '0.0'
              }%
            </p>
            <p className="text-xs text-green-700">hired successfully</p>
          </div>
          
          <div className="bg-red-50 rounded-control p-3">
            <p className="font-medium text-red-900">Drop-off Rate</p>
            <p className="text-lg font-bold text-red-600">
              {funnelStages[0]?.count > 0 ? 
                (((funnelData['Rejected'] || 0)) / funnelStages[0].count * 100).toFixed(1) : 
                '0.0'
              }%
            </p>
            <p className="text-xs text-red-700">rejected in process</p>
          </div>
          
          <div className="bg-yellow-50 rounded-control p-3">
            <p className="font-medium text-yellow-900">Avg. Conversion</p>
            <p className="text-lg font-bold text-yellow-600">
              {funnelStages.length > 1 ? 
                (funnelStages.slice(1).reduce((sum, stage) => sum + stage.conversionRate, 0) / (funnelStages.length - 1)).toFixed(1) :
                '0.0'
              }%
            </p>
            <p className="text-xs text-yellow-700">per stage</p>
          </div>
        </div>
      </div>

      {/* Interactive Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          💡 <strong>Tip:</strong> Click on any stage to filter applications by that stage. 
          Conversion rates show the percentage of candidates who progress from the previous stage.
        </p>
      </div>
    </div>
  );
}