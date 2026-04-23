'use client';

import PageWrapper from '@/components/PageWrapper';
import {
  CloudIcon,
  ShieldCheckIcon,
  ServerStackIcon,
  CpuChipIcon,
  LockClosedIcon,
  ArrowPathIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  CircleStackIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';

const layers = [
  {
    title: 'Presentation Layer',
    color: 'blue',
    components: [
      { name: 'Next.js 14 Web App', desc: 'Server-side rendering, static generation, app router', icon: GlobeAltIcon },
      { name: 'Progressive Web App', desc: 'Offline-capable, installable, push notifications', icon: DevicePhoneMobileIcon },
      { name: 'Capacitor Mobile', desc: 'iOS & Android native shell with push, biometrics', icon: DevicePhoneMobileIcon },
    ],
  },
  {
    title: 'API Gateway & Auth',
    color: 'indigo',
    components: [
      { name: 'Amazon API Gateway', desc: 'RESTful API routing, throttling, request validation', icon: CloudIcon },
      { name: 'Amazon Cognito', desc: 'User pools, MFA, social federation, JWT tokens', icon: LockClosedIcon },
      { name: 'Spring Security', desc: 'RBAC, method-level security, tenant isolation', icon: ShieldCheckIcon },
    ],
  },
  {
    title: 'Application Layer',
    color: 'emerald',
    components: [
      { name: 'Spring Boot 3 API', desc: 'Domain-driven microservices, AOP feature gates', icon: ServerStackIcon },
      { name: 'AI/ML Services', desc: 'Sentiment analysis, skill gap detection, candidate ranking', icon: CpuChipIcon },
      { name: 'Workflow Engine', desc: 'Configurable approval chains, escalation rules', icon: ArrowPathIcon },
    ],
  },
  {
    title: 'Data & Integration',
    color: 'amber',
    components: [
      { name: 'Amazon DynamoDB', desc: 'Single-table design, GSI access patterns, on-demand capacity', icon: CircleStackIcon },
      { name: 'Amazon SQS', desc: 'Async event processing, notification delivery, audit logging', icon: BoltIcon },
      { name: 'Sage Integration', desc: 'Sage 300 People & Evolution ERP bi-directional sync', icon: ArrowPathIcon },
    ],
  },
  {
    title: 'Infrastructure & Security',
    color: 'red',
    components: [
      { name: 'AWS CDK (IaC)', desc: 'Infrastructure as code, multi-environment deployment', icon: CloudIcon },
      { name: 'AES-256-GCM Encryption', desc: 'PII encryption at rest, SHA-256 hashing, key management', icon: LockClosedIcon },
      { name: 'Multi-Tenant Isolation', desc: 'Tenant context per request, data partitioning, plan-based features', icon: ShieldCheckIcon },
    ],
  },
];

const principles = [
  { title: 'Multi-Tenant by Design', desc: 'Every request scoped to a tenant. Data isolated via partition keys. Feature flags per subscription plan.' },
  { title: 'Zero-Trust Security', desc: 'JWT validation on every request. RBAC with 8 role types. AES-256-GCM for PII. POPIA/GDPR compliant.' },
  { title: 'Event-Driven Architecture', desc: 'SQS queues for async processing. DynamoDB Streams for change capture. Notification delivery pipeline.' },
  { title: 'Horizontal Scalability', desc: 'Stateless application tier. DynamoDB on-demand scaling. No single point of failure. Auto-scaling policies.' },
  { title: 'Cloud-Native Deployment', desc: 'AWS CDK for repeatable infrastructure. CI/CD pipeline. Blue-green deployments. Multi-region capable.' },
  { title: 'Offline-First Mobile', desc: 'Service worker caching. IndexedDB local storage. Background sync. PWA score 100/100.' },
];

const colorMap: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  blue:    { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'text-blue-600' },
  indigo:  { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', icon: 'text-indigo-600' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: 'text-emerald-600' },
  amber:   { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: 'text-amber-600' },
  red:     { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-600' },
};

export default function ArchitecturePage() {
  return (
    <PageWrapper title="System Architecture" subtitle="Cloud-native, multi-tenant HRMS platform">
      <div className="space-y-8">
        {/* Architecture Layers */}
        <div className="space-y-4">
          {layers.map((layer, i) => {
            const c = colorMap[layer.color];
            return (
              <div key={layer.title} className={`rounded-lg border ${c.border} overflow-hidden`}>
                <div className={`${c.bg} px-5 py-3 flex items-center gap-3`}>
                  <span className={`text-xs font-bold ${c.text} bg-white/60 px-2 py-0.5 rounded`}>LAYER {i + 1}</span>
                  <h3 className={`text-sm font-semibold ${c.text}`}>{layer.title}</h3>
                </div>
                <div className="bg-white p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {layer.components.map(comp => (
                      <div key={comp.name} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                        <comp.icon className={`w-6 h-6 ${c.icon} shrink-0 mt-0.5`} />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{comp.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{comp.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {i < layers.length - 1 && (
                  <div className="flex justify-center -mb-2 relative z-10">
                    <div className="w-0.5 h-4 bg-gray-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Data Flow */}
        <div className="enterprise-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Request Flow</h3>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {[
              'Client (Web/Mobile/PWA)',
              'API Gateway',
              'Cognito Auth',
              'Tenant Context',
              'Feature Gate Check',
              'Business Logic',
              'DynamoDB',
              'SQS Events',
              'Response',
            ].map((step, i, arr) => (
              <span key={step} className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-gray-100 rounded-lg font-medium text-gray-700">{step}</span>
                {i < arr.length - 1 && <span className="text-gray-400">→</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Design Principles */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4">Architecture Principles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {principles.map(p => (
              <div key={p.title} className="enterprise-card p-4">
                <p className="text-sm font-semibold text-foreground mb-1">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack Summary */}
        <div className="enterprise-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Technology Stack</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-semibold text-foreground mb-2">Frontend</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>Next.js 14 (App Router)</li>
                <li>React 18</li>
                <li>Tailwind CSS</li>
                <li>TypeScript</li>
                <li>Capacitor (Mobile)</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-2">Backend</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>Java 21</li>
                <li>Spring Boot 3</li>
                <li>Spring Security</li>
                <li>AOP Feature Gates</li>
                <li>OpenAI / Claude AI</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-2">AWS Services</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>DynamoDB (Database)</li>
                <li>Cognito (Auth/SSO)</li>
                <li>SQS (Messaging)</li>
                <li>S3 (File Storage)</li>
                <li>CDK (Infrastructure)</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-2">Security</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>AES-256-GCM Encryption</li>
                <li>TLS 1.3 (Transit)</li>
                <li>JWT + MFA Auth</li>
                <li>POPIA Compliance</li>
                <li>Full Audit Trail</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
