import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Irish Rent Tracker",
  description:
    "Explore real Irish rental trends by county, property type, and bedroom count. Data sourced from the RTB via CSO PxStat.",
  openGraph: {
    title: "Irish Rent Tracker",
    description:
      "Explore real Irish rental trends by county, property type, and bedroom count.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}
      >
        <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span className="text-emerald-600 text-xl font-bold tracking-tight">
                IrishRent
              </span>
              <span className="text-gray-400 text-xl font-light">.ie</span>
            </a>
            <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
              <a href="/" className="hover:text-emerald-600 transition-colors">
                Map
              </a>
              <a
                href="/checker"
                className="hover:text-emerald-600 transition-colors"
              >
                Rent Checker
              </a>
              <a
                href="/checker"
                className="bg-emerald-600 text-white px-4 py-2 rounded-full hover:bg-emerald-700 transition-colors"
              >
                Is my rent fair?
              </a>
            </nav>
          </div>
        </header>
        {children}
        <footer className="border-t border-gray-200 bg-white mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>
              Data sourced from the{" "}
              <a
                href="https://data.cso.ie/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-emerald-600"
              >
                CSO PxStat API
              </a>{" "}
              (RTB Rent Index, RIA02). Updates quarterly.
            </p>
            <p>Built with Next.js &amp; Tailwind CSS</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
