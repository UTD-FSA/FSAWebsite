// ── page.tsx ─────────────────────────────────────────────
// terms of service — fully static; no data fetching.
// sections: agreement, the service, eligibility, accounts, acceptable use,
//   your content, payments, intellectual property, termination, disclaimer
//   of warranties, limitation of liability, indemnity, third-party services,
//   governing law, changes, contact.
// notes: mirrors app/privacy/page.tsx structure/styling. no AI features on
//   this site, so no AI disclaimer/output-ownership sections. update the
//   "last updated" date manually whenever a material section changes.
// ─────────────────────────────────────────────────────────

import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Terms of Service',
  description: "Read UTD FSA's Terms of Service covering membership, payments, acceptable use, and eligibility for the Filipino Student Association at UT Dallas.",
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <main className="bg-brand-bg min-h-screen text-white">
      <div className="max-w-[760px] mx-auto px-6 py-16 md:py-20">

        {/* ── HEADER ────────────────────────────────────────────────── */}
        <p className="font-display font-bold text-[12px] tracking-[0.2em] text-text-muted uppercase mb-4">
          UTD FSA
        </p>
        <h1 className="font-display font-black text-[clamp(36px,5vw,64px)] leading-[0.94] tracking-[-0.03em] text-white mb-4">
          Terms of Service
        </h1>
        <p className="font-sans text-[14px] text-[#6a6a6a] mb-14">
          Last updated: July 2026
        </p>

        {/* ── UI ────────────────────────────────────────────────────── */}
        {/* available data: none — fully static content */}
        {/* change classnames and typography freely */}
        {/* do not add data fetching without converting to a server component */}
        <div className="flex flex-col gap-12">

          {/* 1 — agreement */}
          <section>
            <h2 className="font-display font-black text-[17px] text-white uppercase tracking-[0.06em] mb-4 pb-3 border-b border-white/[0.07]">
              Agreement
            </h2>
            <div className="font-sans text-[15px] text-[#a8a8a8] leading-[1.72] flex flex-col gap-3">
              <p>
                By accessing or using this website, you agree to be bound by these Terms of Service. If you do not agree, please do not use the site. These Terms incorporate our{' '}
                <a href="/privacy" className="text-accent-green underline underline-offset-2 hover:opacity-80 transition-opacity">
                  Privacy Policy
                </a>{' '}
                by reference.
              </p>
            </div>
          </section>

          {/* 2 — the service */}
          <section>
            <h2 className="font-display font-black text-[17px] text-white uppercase tracking-[0.06em] mb-4 pb-3 border-b border-white/[0.07]">
              The service
            </h2>
            <div className="font-sans text-[15px] text-[#a8a8a8] leading-[1.72] flex flex-col gap-3">
              <p>
                This website is the member portal for the Filipino Student Association at UTD (&ldquo;FSA,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;). It supports membership management, pamilya matching, event registration and ticketing, attendance and points tracking, and officer administrative tools.
              </p>
              <p>
                Browsing the site is free. Certain features — including membership dues and paid event tickets — require payment as described in the Payments section below.
              </p>
            </div>
          </section>

          {/* 3 — eligibility */}
          <section>
            <h2 className="font-display font-black text-[17px] text-white uppercase tracking-[0.06em] mb-4 pb-3 border-b border-white/[0.07]">
              Eligibility
            </h2>
            <div className="font-sans text-[15px] text-[#a8a8a8] leading-[1.72] flex flex-col gap-3">
              <p>
                You must be at least 16 years old to use this website. By using it, you confirm that you meet this age requirement. Formal membership in FSA — as opposed to guest access such as event ticket purchases — is generally intended for current UTD students, in accordance with FSA&rsquo;s organizational bylaws.
              </p>
            </div>
          </section>

          {/* 4 — accounts */}
          <section>
            <h2 className="font-display font-black text-[17px] text-white uppercase tracking-[0.06em] mb-4 pb-3 border-b border-white/[0.07]">
              Accounts
            </h2>
            <div className="font-sans text-[15px] text-[#a8a8a8] leading-[1.72] flex flex-col gap-3">
              <p>
                Signing in creates your account automatically via Google OAuth. You are responsible for the security of the Google account used to sign in, and for the accuracy of the information you submit in your member profile and applications. Notify us promptly if you believe your account has been accessed without authorization.
              </p>
              <p>
                Guests purchasing event tickets without signing in are not required to create an account. Guest checkout is described further in our Privacy Policy.
              </p>
            </div>
          </section>

          {/* 5 — acceptable use */}
          <section>
            <h2 className="font-display font-black text-[17px] text-white uppercase tracking-[0.06em] mb-4 pb-3 border-b border-white/[0.07]">
              Acceptable use
            </h2>
            <div className="font-sans text-[15px] text-[#a8a8a8] leading-[1.72] flex flex-col gap-3">
              <p>You agree not to:</p>
              <ul className="list-disc pl-5 flex flex-col gap-2.5">
                <li>Scrape, crawl, or automate access to the site beyond normal browser use.</li>
                <li>Attempt to access officer- or admin-only routes, features, or data without authorization.</li>
                <li>Submit false or misleading information in your profile, applications, or event registrations.</li>
                <li>Harass, threaten, or target other members using information obtained through the site — including information disclosed through the pamilya-matching process.</li>
                <li>Attempt to bypass, disable, or interfere with security measures, rate limits, or access controls.</li>
                <li>Use the site for any unlawful purpose.</li>
              </ul>
              <p>
                We may investigate suspected violations and, where warranted, suspend or revoke access to the site.
              </p>
            </div>
          </section>

          {/* 6 — your content */}
          <section>
            <h2 className="font-display font-black text-[17px] text-white uppercase tracking-[0.06em] mb-4 pb-3 border-b border-white/[0.07]">
              Your content
            </h2>
            <div className="font-sans text-[15px] text-[#a8a8a8] leading-[1.72] flex flex-col gap-3">
              <p>
                You retain ownership of the information and photos you submit — including profile data, application responses, and uploaded images. You grant FSA a limited, non-exclusive license to use this content solely to operate the organization: managing membership, conducting pamilya matching, running events, and maintaining organizational records.
              </p>
              <p>
                You are responsible for ensuring you have the right to submit any content you provide, including photos of other people. See our{' '}
                <a href="/privacy" className="text-accent-green underline underline-offset-2 hover:opacity-80 transition-opacity">
                  Privacy Policy
                </a>{' '}
                for detail on how sensitive application fields and pamilya-matching disclosures are handled.
              </p>
            </div>
          </section>

          {/* 7 — payments */}
          <section>
            <h2 className="font-display font-black text-[17px] text-white uppercase tracking-[0.06em] mb-4 pb-3 border-b border-white/[0.07]">
              Payments
            </h2>
            <div className="font-sans text-[15px] text-[#a8a8a8] leading-[1.72] flex flex-col gap-3">
              <p>
                Membership dues and event ticket payments are processed through Stripe. By submitting a payment, you agree to Stripe&rsquo;s terms governing the transaction. Certain payments may alternatively be recorded manually by an officer (for example, cash, Venmo, or Zelle) at officer discretion.
              </p>
              <p>
                All payments are generally non-refundable, except where an officer determines a refund is warranted on a case-by-case basis. FSA is a volunteer-run student organization; the site is provided on a best-effort basis without an uptime or availability guarantee.
              </p>
            </div>
          </section>

          {/* 8 — intellectual property */}
          <section>
            <h2 className="font-display font-black text-[17px] text-white uppercase tracking-[0.06em] mb-4 pb-3 border-b border-white/[0.07]">
              Intellectual property
            </h2>
            <div className="font-sans text-[15px] text-[#a8a8a8] leading-[1.72] flex flex-col gap-3">
              <p>
                The FSA name, logo, website design, and source code are owned by or licensed to FSA and may not be copied, modified, or redistributed without permission. This does not include content you submit yourself, which remains yours as described in Your Content above.
              </p>
            </div>
          </section>

          {/* 9 — termination */}
          <section>
            <h2 className="font-display font-black text-[17px] text-white uppercase tracking-[0.06em] mb-4 pb-3 border-b border-white/[0.07]">
              Termination
            </h2>
            <div className="font-sans text-[15px] text-[#a8a8a8] leading-[1.72] flex flex-col gap-3">
              <p>
                We may suspend or terminate your access to the site for violating these Terms, or in connection with a change in your membership status. Provisions that by their nature should survive termination — including Disclaimer of Warranties, Limitation of Liability, Indemnity, and Governing Law — remain in effect.
              </p>
            </div>
          </section>

          {/* 10 — disclaimer of warranties */}
          <section>
            <h2 className="font-display font-black text-[17px] text-white uppercase tracking-[0.06em] mb-4 pb-3 border-b border-white/[0.07]">
              Disclaimer of warranties
            </h2>
            <div className="font-sans text-[15px] text-[#a8a8a8] leading-[1.72] flex flex-col gap-3">
              <p>
                THE SERVICE IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. FSA DOES NOT WARRANT THAT THE SITE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
              </p>
            </div>
          </section>

          {/* 11 — limitation of liability */}
          <section>
            <h2 className="font-display font-black text-[17px] text-white uppercase tracking-[0.06em] mb-4 pb-3 border-b border-white/[0.07]">
              Limitation of liability
            </h2>
            <div className="font-sans text-[15px] text-[#a8a8a8] leading-[1.72] flex flex-col gap-3">
              <p>
                To the maximum extent permitted by law, FSA and its officers are not liable for indirect, incidental, special, consequential, or punitive damages arising from your use of the site. Our total liability for any claim is limited to the amount of dues or fees you paid to FSA in the 12 months preceding the claim.
              </p>
              <p>
                Some jurisdictions do not allow the exclusion or limitation of certain warranties or liabilities. In those jurisdictions, our liability is limited to the maximum extent permitted by law, and the above limitations may not apply to you.
              </p>
            </div>
          </section>

          {/* 12 — indemnity */}
          <section>
            <h2 className="font-display font-black text-[17px] text-white uppercase tracking-[0.06em] mb-4 pb-3 border-b border-white/[0.07]">
              Indemnity
            </h2>
            <div className="font-sans text-[15px] text-[#a8a8a8] leading-[1.72] flex flex-col gap-3">
              <p>
                You agree to indemnify and hold FSA and its officers harmless from any claims, damages, liabilities, and reasonable expenses arising from your submitted content, your use of the site, or your violation of these Terms or applicable law.
              </p>
            </div>
          </section>

          {/* 13 — third-party services */}
          <section>
            <h2 className="font-display font-black text-[17px] text-white uppercase tracking-[0.06em] mb-4 pb-3 border-b border-white/[0.07]">
              Third-party services
            </h2>
            <div className="font-sans text-[15px] text-[#a8a8a8] leading-[1.72] flex flex-col gap-3">
              <p>
                This site relies on Stripe, Resend, Supabase, Google, Amazon Web Services, and Vercel Analytics and Speed Insights to operate. Each provider operates under its own terms and privacy practices, which govern how it handles the data it receives. See our{' '}
                <a href="/privacy" className="text-accent-green underline underline-offset-2 hover:opacity-80 transition-opacity">
                  Privacy Policy
                </a>{' '}
                for detail on what each provider is used for.
              </p>
            </div>
          </section>

          {/* 14 — governing law */}
          <section>
            <h2 className="font-display font-black text-[17px] text-white uppercase tracking-[0.06em] mb-4 pb-3 border-b border-white/[0.07]">
              Governing law
            </h2>
            <div className="font-sans text-[15px] text-[#a8a8a8] leading-[1.72] flex flex-col gap-3">
              <p>
                These Terms are governed by the laws of the State of Texas, without regard to conflict-of-law principles. Any dispute arising from these Terms or your use of the site will be brought exclusively in the state or federal courts located in Dallas County or Collin County, Texas.
              </p>
            </div>
          </section>

          {/* 15 — changes */}
          <section>
            <h2 className="font-display font-black text-[17px] text-white uppercase tracking-[0.06em] mb-4 pb-3 border-b border-white/[0.07]">
              Changes
            </h2>
            <div className="font-sans text-[15px] text-[#a8a8a8] leading-[1.72] flex flex-col gap-3">
              <p>
                We may update these Terms from time to time. Material changes will be posted here with a new &ldquo;Last updated&rdquo; date. Your continued use of the site after changes are posted constitutes acceptance of the revised Terms.
              </p>
            </div>
          </section>

          {/* 16 — contact */}
          <section>
            <h2 className="font-display font-black text-[17px] text-white uppercase tracking-[0.06em] mb-4 pb-3 border-b border-white/[0.07]">
              Contact
            </h2>
            <div className="font-sans text-[15px] text-[#a8a8a8] leading-[1.72]">
              <p>
                For questions about these Terms, email us at{' '}
                <a
                  href="mailto:fsautd@gmail.com"
                  className="text-accent-green underline underline-offset-2 hover:opacity-80 transition-opacity"
                >
                  fsautd@gmail.com
                </a>
                . Please include your name and the nature of your request so we can route it to the right officer.
              </p>
            </div>
          </section>

        </div>
      </div>
    </main>
  )
}
