export default function IDCCareersFooter() {
  return (
    <footer className="bg-[#0F172A] text-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg tracking-[-0.03em] mb-4">
              Industrial Development Corporation
            </h3>
            <p className="text-sm leading-relaxed">
              The IDC is a national development finance institution set up to promote
              economic growth and industrial development in South Africa.
            </p>
          </div>

          <div>
            <h4 className="text-white font-medium text-sm uppercase tracking-[0.05em] mb-4">
              Contact
            </h4>
            <ul className="space-y-2 text-sm">
              <li>19 Fredman Drive, Sandown</li>
              <li>Sandton, 2196</li>
              <li>South Africa</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium text-sm uppercase tracking-[0.05em] mb-4">
              Links
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://www.idc.co.za"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  www.idc.co.za
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs">
          <span>&copy; {new Date().getFullYear()} Industrial Development Corporation. All rights reserved.</span>
          <span className="mt-2 sm:mt-0 text-white/40">
            Powered by ShumelaHire
          </span>
        </div>
      </div>
    </footer>
  );
}
