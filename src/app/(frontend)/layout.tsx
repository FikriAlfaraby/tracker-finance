import React from 'react'
import './styles.css'
import { AuthProvider } from '../../contexts/auth-context'
import { Toaster } from '../../components/ui/sonner'
import { QueryProvider } from '../../providers/query-provider'

export const metadata = {
  description: 'A blank template using Payload in a Next.js app.',
  title: 'Payload Blank Template',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>
          <QueryProvider>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </QueryProvider>
        </main>
      </body>
    </html>
  )
}
