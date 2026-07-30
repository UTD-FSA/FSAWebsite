// ── layout.tsx ───────────────────────────────────────────────
// root layout — wraps every page with Navbar, Footer, and fonts
//
// deps:  @vercel/analytics, @vercel/speed-insights
// notes: deliberately reads no request-time APIs (no cookies()/headers()) so this
//        layout, and any page under it that also avoids them, can be statically
//        prerendered — see proxy.ts's STATIC_CSP_ROUTES for which routes qualify.
//        Navbar resolves the signed-in member client-side instead (browser
//        supabase client + auth listener) rather than being seeded here.
//        the four google fonts are registered as CSS custom properties via @theme
// ─────────────────────────────────────────────────────────────
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Unbounded, Noto_Sans_Tagalog } from "next/font/google"
import "./globals.css"
import SiteChrome from "@/components/SiteChrome"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" })
const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
  weight: ["600", "700", "900"],
  display: "swap",
})
const notoTagalog = Noto_Sans_Tagalog({
  variable: "--font-tagalog",
  subsets: ["tagalog"],
  weight: "400",
  display: "swap",
})

export const viewport: Viewport = {
  viewportFit: 'cover',
}

const SITE_URL = "https://www.utdfsa.org"
const SITE_DESCRIPTION = "The Filipino Student Association at The University of Texas at Dallas. Join events, become a member, explore pamilyas, cultural programs, and connect with the Filipino-American community at UTD."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "UTD FSA — Filipino Student Association at UT Dallas",
    template: "%s | UTD FSA",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "UTD FSA",
    locale: "en_US",
    images: [{ url: "/og/home.jpg", width: 1200, height: 630, alt: "UTD FSA members" }],
  },
  twitter: {
    card: "summary_large_image",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${unbounded.variable} ${notoTagalog.variable} h-full antialiased`}>
      <head>
        {supabaseOrigin && <link rel="preconnect" href={supabaseOrigin} />}
        <link rel="preconnect" href="https://api.stripe.com" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
      </head>
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[400] focus:px-4 focus:py-2 focus:bg-accent-green focus:text-black focus:font-semibold focus:rounded-lg focus:text-sm"
        >
          Skip to main content
        </a>
        <SiteChrome>
          <div id="main-content" tabIndex={-1} className="outline-none flex-1 flex flex-col">
            {children}
          </div>
        </SiteChrome>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}