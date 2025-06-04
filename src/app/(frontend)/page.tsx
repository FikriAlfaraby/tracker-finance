import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Shield, BarChart3, Target } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">FinanceTracker</span>
          </div>
          <div className="space-x-4">
            <Link href="/login">
              <Button variant="ghost">Masuk</Button>
            </Link>
            <Link href="/register">
              <Button>Daftar</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Kelola Keuangan Pribadi dengan <span className="text-blue-600">Lebih Cerdas</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Evaluasi kondisi keuangan Anda, catat transaksi harian, dan pantau perkembangan skor
          keuangan untuk mencapai tujuan finansial yang lebih baik.
        </p>
        <div className="space-x-4">
          <Link href="/register">
            <Button size="lg" className="px-8">
              Mulai Sekarang
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="px-8">
              Sudah Punya Akun?
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Fitur Unggulan</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card>
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Evaluasi Keuangan</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Analisis mendalam kondisi keuangan berdasarkan pemasukan, pengeluaran, aset, dan
                utang
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Target className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Skor Keuangan</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Dapatkan skor keuangan yang dihitung otomatis dan pantau perkembangannya
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Pencatatan Transaksi</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Catat pemasukan dan pengeluaran harian dengan mudah dan terorganisir
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-orange-600 mb-4" />
              <CardTitle>Data Aman</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Keamanan data terjamin dengan enkripsi dan sistem autentikasi yang robust
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Siap Mengambil Kontrol Keuangan Anda?</h2>
          <p className="text-xl mb-8 opacity-90">
            Bergabunglah dengan ribuan pengguna yang telah merasakan manfaatnya
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="px-8">
              Daftar Gratis Sekarang
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <TrendingUp className="h-6 w-6" />
            <span className="text-xl font-bold">FinanceTracker</span>
          </div>
          <p className="text-gray-400">© 2024 FinanceTracker. Semua hak dilindungi.</p>
        </div>
      </footer>
    </div>
  )
}
