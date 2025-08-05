import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'SoulTrip - Transformational Travel Platform',
    template: '%s | SoulTrip'
  },
  description: 'Discover and organize transformational travel experiences. Connect with conscious travelers and spiritual guides for meaningful journeys.',
  keywords: [
    'transformational travel',
    'spiritual journeys', 
    'conscious travel',
    'retreats',
    'pilgrimages',
    'wellness travel',
    'mindful tourism'
  ],
  authors: [{ name: 'SoulTrip Team' }],
  creator: 'SoulTrip',
  publisher: 'SoulTrip',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://soultrip.com',
    siteName: 'SoulTrip',
    title: 'SoulTrip - Transformational Travel Platform',
    description: 'Discover and organize transformational travel experiences. Connect with conscious travelers and spiritual guides for meaningful journeys.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SoulTrip - Transformational Travel Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SoulTrip - Transformational Travel Platform',
    description: 'Discover and organize transformational travel experiences. Connect with conscious travelers and spiritual guides for meaningful journeys.',
    images: ['/og-image.jpg'],
    creator: '@soultrip',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="relative flex min-h-screen flex-col">
          <div className="flex-1">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}