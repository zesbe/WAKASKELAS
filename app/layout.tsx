import type { Metadata } from 'next'
import './globals.css'
import ErrorBoundary from '../components/ErrorBoundary'
import PWAProvider from '../components/PWAProvider'
import AuthProvider from '../components/AuthProvider'
import ClientOnly from '../components/ClientOnly'

export const metadata: Metadata = {
  title: 'Kas Kelas - Ibnu Sina',
  description: 'Aplikasi modern untuk kelola kas kelas dan reminder tagihan wali murid via WhatsApp',
  manifest: '/manifest.json',
  metadataBase: new URL('http://localhost:3000'),
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kas Kelas',
    startupImage: [
      '/icons/icon-192x192.png'
    ]
  },
  openGraph: {
    title: 'Kas Kelas - Ibnu Sina',
    description: 'Aplikasi modern untuk kelola kas kelas dan reminder tagihan wali murid',
    type: 'website',
    locale: 'id_ID',
    siteName: 'Kas Kelas Ibnu Sina'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kas Kelas - Ibnu Sina',
    description: 'Aplikasi modern untuk kelola kas kelas dan reminder tagihan wali murid'
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png'
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#3b82f6',
  colorScheme: 'light'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className="scroll-smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Kas Kelas" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className="min-h-screen overflow-x-hidden">
        <ErrorBoundary>
          <AuthProvider>
            <ClientOnly>
              <PWAProvider>
                <div className="min-h-screen">
                  {children}
                </div>
              </PWAProvider>
            </ClientOnly>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
