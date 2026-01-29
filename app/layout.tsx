import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FuturAIse - AI Problem Solver for Kids',
  description: 'Build AI solutions that solve real problems',
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
