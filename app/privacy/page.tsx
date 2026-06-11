// PassageLab — app/privacy/page.tsx
// NOTE: This is a starting-point privacy policy. Have it reviewed by a
// lawyer before relying on it.

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — PassageLab',
}

const SERIF = "'Playfair Display', Georgia, serif"
const SLATE = '#8892A4'

function H({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, margin: '32px 0 10px' }}>{children}</h2>
}

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px', lineHeight: 1.8, fontSize: 14 }}>
      <Link href="/" style={{ color: '#C9973A', textDecoration: 'none', fontSize: 13 }}>← Back to PassageLab</Link>
      <h1 style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 700, margin: '20px 0 6px' }}>Privacy Policy</h1>
      <p style={{ color: SLATE, fontSize: 13 }}>Last updated: June 2026</p>

      <H>What we collect</H>
      <p>Account data (email, name, password hash), the passages and roles you study, usage records for billing, and your monthly spending preferences. If you join the waitlist, we store your email address.</p>

      <H>Payments</H>
      <p>Card details are collected and stored by <a href="https://stripe.com/privacy" style={{ color: '#C9973A' }}>Stripe</a>; we never see or store your full card number — only the brand and last four digits for display, and a Stripe token used to charge your monthly bill.</p>

      <H>How we use it</H>
      <p>To generate your studies, bill you accurately, enforce your spending limit, prevent abuse, and improve the product. Passages you study are sent to Anthropic&apos;s API to generate content. We do not sell your data, and we do not use your personal data to train AI models.</p>

      <H>Cookies</H>
      <p>We use cookies only for authentication (keeping you signed in via Supabase). No third-party advertising or tracking cookies.</p>

      <H>Service providers</H>
      <p>Supabase (database and authentication), Stripe (payments), Vercel (hosting), and Anthropic (AI generation). Each processes only the data needed for its function.</p>

      <H>Retention &amp; deletion</H>
      <p>Account and billing data are kept while your account is active and as required for tax and accounting. To delete your account and associated personal data, email us and we will complete the deletion within 30 days, except records we are legally required to keep.</p>

      <H>Your rights</H>
      <p>You may request a copy of your data, correct it, or delete it. EU/UK residents have rights under GDPR; California residents under CCPA. Contact us to exercise them.</p>

      <H>Contact</H>
      <p><a href="mailto:privacy@passagelab.app" style={{ color: '#C9973A' }}>privacy@passagelab.app</a></p>
    </div>
  )
}
