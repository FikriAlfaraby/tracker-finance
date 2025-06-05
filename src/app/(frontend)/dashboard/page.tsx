'use client'

import { useAuth } from '@/contexts/auth-context'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScoreGraph } from '@/components/score-graph'
import { RecentTransactions } from '@/components/recent-transactions'
import { ScoreBreakdown } from '@/components/score-breakdown'
import { GoalsList } from '@/components/goals-list'
import { TrendingUp, TrendingDown, DollarSign, Target, Plus, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/dashboard`, {
        headers: {
          Authorization: `JWT ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch dashboard data')
      return response.json()
    },
    enabled: !!user,
  })

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) return null

  const netIncome = (dashboardData?.monthlyIncome || 0) - (dashboardData?.monthlyExpenses || 0)
  const hasFinancialData = !!dashboardData?.financialData

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Selamat datang kembali, {user.name}!</p>
            </div>
            <div className="space-x-4">
              <Link href="/transactions/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Transaksi
                </Button>
              </Link>
              <Button variant="outline" onClick={() => router.push('/profile')}>
                Profile
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {!hasFinancialData && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">
              Mulai Evaluasi Keuangan Anda
            </h2>
            <p className="text-blue-700 mb-4">
              Untuk mendapatkan skor keuangan dan rekomendasi yang sesuai, silakan isi data keuangan
              awal Anda.
            </p>
            <Link href="/evaluation">
              <Button>Isi Evaluasi Keuangan</Button>
            </Link>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Skor Keuangan</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.currentScore || 0}</div>
              <p className="text-xs text-muted-foreground">dari 100 poin maksimal</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pemasukan Bulan Ini</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {(dashboardData?.monthlyIncome || 0).toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-muted-foreground">
                {hasFinancialData
                  ? `${((dashboardData.monthlyIncome / dashboardData.financialData.monthlyIncome - 1) * 100).toFixed(1)}% dari rata-rata`
                  : 'Belum ada data pembanding'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pengeluaran Bulan Ini</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {(dashboardData?.monthlyExpenses || 0).toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-muted-foreground">
                {hasFinancialData
                  ? `${((dashboardData.monthlyExpenses / dashboardData.financialData.monthlyExpenses - 1) * 100).toFixed(1)}% dari rata-rata`
                  : 'Belum ada data pembanding'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Bersih</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                Rp {netIncome.toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-muted-foreground">pemasukan - pengeluaran</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Skor Keuangan</CardTitle>
              <CardDescription>Perkembangan skor keuangan dalam 6 bulan terakhir</CardDescription>
            </CardHeader>
            <CardContent>
              <ScoreGraph data={dashboardData?.scoreHistory || []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Komponen Skor Keuangan</CardTitle>
                <CardDescription>Breakdown skor keuangan Anda</CardDescription>
              </div>
              <Link href="/evaluation">
                <Button variant="outline" size="sm">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Update Data
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <ScoreBreakdown scoreComponents={dashboardData?.scoreComponents} />
            </CardContent>
          </Card>
        </div>

        {/* Financial Goals */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Tujuan Keuangan</CardTitle>
              <CardDescription>Progres tujuan keuangan Anda</CardDescription>
            </div>
            <Link href="/goals/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Tujuan
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <GoalsList goals={dashboardData?.goals || []} />
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Transaksi Terbaru</CardTitle>
              <CardDescription>5 transaksi terakhir yang Anda catat</CardDescription>
            </div>
            {/* <Link href="/transactions">
              <Button variant="outline">Lihat Semua</Button>
            </Link> */}
          </CardHeader>
          <CardContent>
            <RecentTransactions transactions={dashboardData?.recentTransactions || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
