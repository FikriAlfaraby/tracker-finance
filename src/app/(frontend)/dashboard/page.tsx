'use client'

import { useAuth } from '@/contexts/auth-context'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScoreGraph } from '@/components/score-graph'
import { IncomeExpenseChart } from '@/components/income-expense-chart'
import { RecentTransactions } from '@/components/recent-transactions'
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface DashboardData {
  currentScore: number
  scoreHistory: Array<{ date: string; score: number }>
  monthlyIncome: number
  monthlyExpenses: number
  totalTransactions: number
  recentTransactions: Array<{
    id: string
    type: 'income' | 'expense'
    category: string
    amount: number
    date: string
    description?: string
  }>
}

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
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
                <Button>Tambah Transaksi</Button>
              </Link>
              <Button variant="outline" onClick={() => router.push('/profile')}>
                Profile
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
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
              <p className="text-xs text-muted-foreground">+20.1% dari bulan lalu</p>
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
              <p className="text-xs text-muted-foreground">+4% dari bulan lalu</p>
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
            <CardHeader>
              <CardTitle>Pemasukan vs Pengeluaran</CardTitle>
              <CardDescription>Perbandingan pemasukan dan pengeluaran per kategori</CardDescription>
            </CardHeader>
            <CardContent>
              <IncomeExpenseChart
                income={dashboardData?.monthlyIncome || 0}
                expenses={dashboardData?.monthlyExpenses || 0}
              />
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Transaksi Terbaru</CardTitle>
            <CardDescription>5 transaksi terakhir yang Anda catat</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentTransactions transactions={dashboardData?.recentTransactions || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
