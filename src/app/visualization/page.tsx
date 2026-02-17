'use client';

import ReportVisualization from '../../components/ReportVisualization';
import PageWrapper from '../../components/PageWrapper';

export default function VisualizationPage() {
  return (
    <PageWrapper
      title="Data Visualization" 
      subtitle="Interactive charts and analytics for recruitment insights"
    >
      <ReportVisualization />
    </PageWrapper>
  );
}
