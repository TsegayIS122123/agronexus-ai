
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgroNexus AI - Empowering Ethiopian Farmers',
  description: 'AI-powered platform connecting Ethiopian farmers to agro-industry through disease detection, price prediction, and market access',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
