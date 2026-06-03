import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PassageLab — Biblical Research Platform',
  description:
    'Enter any passage. Get original languages, history, archaeology, theology, commentary, illustrations, and sermon outlines in seconds.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://passagelab.app'),
  openGraph: {
    title: 'PassageLab',
    description: 'The research platform Bible teachers have been waiting for.',
    url: 'https://passagelab.app',
    siteName: 'PassageLab',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PassageLab',
    description: 'The research platform Bible teachers have been waiting for.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body className="bg-ink text-parchment font-sans antialiased">{children}</body>
    </html>
  )
}
