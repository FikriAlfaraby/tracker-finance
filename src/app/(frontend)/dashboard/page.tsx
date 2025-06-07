'use client'

import { useAuth } from '@/contexts/auth-context'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScoreGraph } from '@/components/score-graph'
import { RecentTransactions } from '@/components/recent-transactions'
import { ScoreBreakdown } from '@/components/score-breakdown'
import { PocketSummary } from '@/components/pocket-summary'
import { PocketDistribution } from '@/components/pocket-distribution'
import {
  TrendingUp,
  TrendingDown,
  Target,
  Plus,
  BarChart3,
  Wallet,
  ArrowUpDown,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [_activeTab, setActiveTab] = useState('overview')

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

  // Fetch pockets data
  const { data: pocketsData, isLoading: isLoadingPockets } = useQuery({
    queryKey: ['pockets'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/pockets`, {
        headers: {
          Authorization: `JWT ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch pockets')
      return response.json()
    },
    enabled: !!user,
  })

  if (loading || isLoading || isLoadingPockets) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) return null

  // const netIncome = (dashboardData?.monthlyIncome || 0) - (dashboardData?.monthlyExpenses || 0)
  const hasFinancialData = !!dashboardData?.financialData

  // Filter active pockets
  const activePockets = pocketsData?.docs?.filter((pocket: any) => pocket.isActive) || []
  const totalPocketBalance = activePockets.reduce(
    (sum: number, pocket: any) => sum + (pocket.balance || 0),
    0,
  )

  // Check for low balance pockets (less than 10% of target or less than 100k)
  const lowBalancePockets = activePockets.filter((pocket: any) => {
    if (pocket.targetAmount && pocket.targetAmount > 0) {
      return pocket.balance / pocket.targetAmount < 0.1
    }
    return pocket.balance < 100000
  })

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

        {/* Pocket Alert */}
        {activePockets.length === 0 && (
          <Alert className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Anda belum memiliki kantong aktif. Kantong membantu Anda mengatur alokasi dana dan
              mencatat transaksi dengan lebih baik.
              <div className="mt-2">
                <Link href="/pockets/new">
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Buat Kantong
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Low Balance Alert */}
        {lowBalancePockets.length > 0 && (
          <Alert className="mb-8 bg-yellow-50 border-yellow-300">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              <span className="font-medium text-yellow-800">Perhatian:</span>{' '}
              {lowBalancePockets.length} kantong memiliki saldo rendah.
              <div className="mt-2">
                <Link href="/pockets">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-yellow-500 text-yellow-700 hover:bg-yellow-100"
                  >
                    Lihat Kantong
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
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
              <CardTitle className="text-sm font-medium">Total Kantong</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {totalPocketBalance.toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-muted-foreground">{activePockets.length} kantong aktif</p>
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
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="mb-8" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="overview">Ringkasan</TabsTrigger>
            <TabsTrigger value="pockets">Kantong</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Riwayat Skor Keuangan</CardTitle>
                  <CardDescription>
                    Perkembangan skor keuangan dalam 6 bulan terakhir
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboardData?.scoreHistory && dashboardData.scoreHistory.length > 0 ? (
                    <ScoreGraph data={dashboardData.scoreHistory} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] text-center">
                      <div className="text-muted-foreground mb-4">
                        <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Belum ada data riwayat skor keuangan</p>
                        <p className="text-sm">
                          Data akan muncul setelah Anda melakukan evaluasi keuangan dan mencatat
                          transaksi
                        </p>
                      </div>
                      {!hasFinancialData && (
                        <Link href="/evaluation">
                          <Button size="sm">Mulai Evaluasi Keuangan</Button>
                        </Link>
                      )}
                    </div>
                  )}
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

            {/* Recent Transactions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Transaksi Terbaru</CardTitle>
                  <CardDescription>5 transaksi terakhir yang Anda catat</CardDescription>
                </div>
                <Link href="/transactions">
                  <Button variant="outline">Lihat Semua</Button>
                </Link>
              </CardHeader>
              <CardContent>
                <RecentTransactions transactions={dashboardData?.recentTransactions || []} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pockets Tab */}
          <TabsContent value="pockets">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Kantong Aktif</CardTitle>
                      <CardDescription>Ringkasan kantong dan saldo</CardDescription>
                    </div>
                    <div className="space-x-2">
                      <Link href="/pockets/transfer">
                        <Button variant="outline" size="sm">
                          <ArrowUpDown className="mr-2 h-4 w-4" />
                          Transfer
                        </Button>
                      </Link>
                      <Link href="/pockets/new">
                        <Button size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Buat Kantong
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <PocketSummary pockets={activePockets} />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Distribusi Dana</CardTitle>
                  <CardDescription>Alokasi dana antar kantong</CardDescription>
                </CardHeader>
                <CardContent>
                  <PocketDistribution pockets={activePockets} />
                </CardContent>
              </Card>
            </div>

            {/* Recent Pocket Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Transaksi Kantong Terbaru</CardTitle>
                <CardDescription>Mutasi terbaru antar kantong</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData?.recentPocketTransactions &&
                dashboardData.recentPocketTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.recentPocketTransactions.map((transaction: any) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-3 h-3 rounded-full ${transaction.transactionType === 'topup' ? 'bg-green-500' : transaction.transactionType === 'withdraw' ? 'bg-red-500' : 'bg-blue-500'}`}
                          />
                          <div>
                            <div className="font-medium">
                              {transaction.transactionType === 'transfer'
                                ? `Transfer: ${transaction.fromPocketName} → ${transaction.toPocketName}`
                                : transaction.transactionType === 'topup'
                                  ? `Top Up: ${transaction.toPocketName}`
                                  : `Withdraw: ${transaction.fromPocketName}`}
                            </div>
                            {transaction.description && (
                              <div className="text-sm text-muted-foreground">
                                {transaction.description}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              {new Date(transaction.date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">
                            Rp {transaction.amount.toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Belum ada transaksi antar kantong
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
