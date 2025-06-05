import React from 'react'
import './styles.css'
import { AuthProvider } from '../../contexts/auth-context'
import { Toaster } from '../../components/ui/sonner'
import { QueryProvider } from '../../providers/query-provider'

export const metadata = {
  title: 'Financial Tracker - Kelola Keuangan Pribadi',
  description:
    'Aplikasi pencatatan dan evaluasi keuangan pribadi yang membantu Anda mengelola keuangan dengan lebih baik',
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
