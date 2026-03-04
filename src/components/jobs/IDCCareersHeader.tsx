import Image from 'next/image';
import Link from 'next/link';

export default function IDCCareersHeader() {
  return (
    <header>
      {/* Logo bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/jobs" className="flex items-center">
              <Image
                src="/idc-logo.png"
                alt="Industrial Development Corporation"
                width={140}
                height={54}
                className="h-10 w-auto"
                priority
              />
            </Link>

            <nav className="hidden sm:flex items-center space-x-8">
              <span className="text-[#05527E] text-sm font-medium uppercase tracking-[0.05em] border-b-2 border-[#F1C54B] pb-1">
                Careers
              </span>
            </nav>
          </div>
        </div>
      </div>

      {/* Gold accent strip */}
      <div className="h-1 bg-[#F1C54B]" />
    </header>
  );
}
