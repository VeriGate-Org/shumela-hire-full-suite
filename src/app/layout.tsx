import type { Metadata, Viewport } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LayoutProvider } from '@/contexts/LayoutContext';

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
  title: "TalentGate",
  description: "Comprehensive recruitment and hiring management platform",
  manifest: "/manifest.json",
  keywords: ["recruitment", "hiring", "HR", "job", "dashboard", "management"],
  authors: [{ name: "Arthmatic DevWorks" }],
  creator: "TalentGate",
  publisher: "Arthmatic DevWorks",
  metadataBase: new URL('https://talentgate.co.za'),
  openGraph: {
    title: "TalentGate",
    description: "Comprehensive recruitment and hiring management platform",
    url: "https://talentgate.co.za",
    siteName: "TalentGate",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "TalentGate"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "TalentGate",
    description: "Comprehensive recruitment and hiring management platform",
    images: ["/twitter-image.jpg"]
  },
  appleWebApp: {
    title: "TalentGate",
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
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#05527E' },
    { media: '(prefers-color-scheme: dark)', color: '#04466B' }
  ],
  colorScheme: 'light'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
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
        <ThemeProvider>
          <AuthProvider>
            <LayoutProvider>
              {children}
            </LayoutProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
