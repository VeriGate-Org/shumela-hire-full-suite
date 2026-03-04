import IDCCareersHeader from '@/components/jobs/IDCCareersHeader';
import IDCCareersFooter from '@/components/jobs/IDCCareersFooter';

export default function JobsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <IDCCareersHeader />
      <main className="flex-1">{children}</main>
      <IDCCareersFooter />
    </div>
  );
}
