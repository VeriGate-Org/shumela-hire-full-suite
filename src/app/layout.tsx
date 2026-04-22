import type { Metadata, Viewport } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ShumelaHire — Structured Talent Acquisition for Institutions",
    template: "%s | ShumelaHire",
  },
  description: "ShumelaHire brings order, transparency, and measurable outcomes to every stage of the hiring process. Purpose-built for corporates, DFIs, and government agencies.",
  manifest: "/manifest.json",
  keywords: ["recruitment", "hiring", "talent acquisition", "HR", "enterprise", "South Africa", "POPIA", "structured hiring"],
  authors: [{ name: "Arthmatic DevWorks" }],
  creator: "ShumelaHire",
  publisher: "Arthmatic DevWorks",
  metadataBase: new URL('https://shumelahire.co.za'),
  openGraph: {
    title: "ShumelaHire — Structured Talent Acquisition for Institutions",
    description: "ShumelaHire brings order, transparency, and measurable outcomes to every stage of the hiring process.",
    url: "https://shumelahire.co.za",
    siteName: "ShumelaHire",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ShumelaHire — Structured Talent Acquisition"
      }
    ],
    locale: "en_ZA",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "ShumelaHire — Structured Talent Acquisition for Institutions",
    description: "ShumelaHire brings order, transparency, and measurable outcomes to every stage of the hiring process.",
    images: ["/og-image.jpg"]
  },
  appleWebApp: {
    title: "ShumelaHire",
    statusBarStyle: "default",
    capable: true
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#05527E' },
    { media: '(prefers-color-scheme: dark)', color: '#0B1120' },
  ],
  colorScheme: 'light dark'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('color-mode');if(m==='dark'||(m!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark'}}catch(e){}})()`,
          }}
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="msapplication-TileColor" content="#05527E" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body
        className={`${manrope.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
