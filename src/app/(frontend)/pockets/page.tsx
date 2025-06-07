'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Plus, ArrowLeft, Eye, EyeOff, Edit, Trash2, ArrowUpDown } from 'lucide-react'
import Link from 'next/link'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const pocketIcons: Record<string, string> = {
  money: '💰',
  bank: '🏦',
  emergency: '🚨',
  investment: '📈',
  shopping: '🛍️',
  vacation: '✈️',
  education: '📚',
  health: '🏥',
  digital: '💳',
  target: '🎯',
}

const pocketColors: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
  gray: 'bg-gray-500',
}

const pocketTypeLabels: Record<string, string> = {
  main: 'Kantong Utama',
  savings: 'Tabungan',
  emergency: 'Dana Darurat',
  investment: 'Investasi',
  shopping: 'Belanja',
  vacation: 'Liburan',
  education: 'Pendidikan',
  health: 'Kesehatan',
  other: 'Lainnya',
}

export default function PocketsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showBalances, setShowBalances] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')

  // Fetch pockets
  const { data: pockets, isLoading } = useQuery({
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

  // Delete pocket mutation
  const deletePocketMutation = useMutation({
    mutationFn: async (pocketId: string) => {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/pockets/${pocketId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `JWT ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to delete pocket')
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: 'Berhasil!',
        description: 'Kantong berhasil dihapus',
      })
      queryClient.invalidateQueries({ queryKey: ['pockets'] })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Toggle pocket status mutation
  const togglePocketMutation = useMutation({
    mutationFn: async ({ pocketId, isActive }: { pocketId: string; isActive: boolean }) => {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/pockets/${pocketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({ isActive }),
      })
      if (!response.ok) throw new Error('Failed to update pocket')
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: 'Berhasil!',
        description: 'Status kantong berhasil diperbarui',
      })
      queryClient.invalidateQueries({ queryKey: ['pockets'] })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const filteredPockets =
    pockets?.docs?.filter((pocket: any) => {
      if (filterType === 'all') return true
      if (filterType === 'active') return pocket.isActive
      if (filterType === 'inactive') return !pocket.isActive
      return pocket.pocketType === filterType
    }) || []

  const totalBalance = filteredPockets.reduce(
    (sum: number, pocket: any) => sum + (pocket.balance || 0),
    0,
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Dashboard
          </Link>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kelola Kantong</h1>
            <p className="text-gray-600">Atur dan pantau kantong keuangan Anda</p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowBalances(!showBalances)}
              className="flex items-center space-x-2"
            >
              {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{showBalances ? 'Sembunyikan' : 'Tampilkan'} Saldo</span>
            </Button>
            <Link href="/pockets/new">
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Buat Kantong Baru</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Kantong</p>
                <p className="text-2xl font-bold">{pockets?.totalDocs || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Kantong Aktif</p>
                <p className="text-2xl font-bold text-green-600">
                  {pockets?.docs?.filter((p: any) => p.isActive).length || 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Saldo</p>
                <p className="text-2xl font-bold">
                  {showBalances ? formatCurrency(totalBalance) : '••••••'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Kantong Terbesar</p>
                <p className="text-lg font-semibold">
                  {filteredPockets.length > 0
                    ? filteredPockets.reduce((max: any, pocket: any) =>
                        pocket.balance > max.balance ? pocket : max,
                      ).name
                    : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter Buttons */}
        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterType('all')}
            size="sm"
          >
            Semua
          </Button>
          <Button
            variant={filterType === 'active' ? 'default' : 'outline'}
            onClick={() => setFilterType('active')}
            size="sm"
          >
            Aktif
          </Button>
          <Button
            variant={filterType === 'inactive' ? 'default' : 'outline'}
            onClick={() => setFilterType('inactive')}
            size="sm"
          >
            Tidak Aktif
          </Button>
          <Button
            variant={filterType === 'main' ? 'default' : 'outline'}
            onClick={() => setFilterType('main')}
            size="sm"
          >
            Kantong Utama
          </Button>
          <Button
            variant={filterType === 'savings' ? 'default' : 'outline'}
            onClick={() => setFilterType('savings')}
            size="sm"
          >
            Tabungan
          </Button>
          <Button
            variant={filterType === 'emergency' ? 'default' : 'outline'}
            onClick={() => setFilterType('emergency')}
            size="sm"
          >
            Dana Darurat
          </Button>
          <Button
            variant={filterType === 'investment' ? 'default' : 'outline'}
            onClick={() => setFilterType('investment')}
            size="sm"
          >
            Investasi
          </Button>
          <Button
            variant={filterType === 'shopping' ? 'default' : 'outline'}
            onClick={() => setFilterType('shopping')}
            size="sm"
          >
            Belanja
          </Button>
          <Button
            variant={filterType === 'vacation' ? 'default' : 'outline'}
            onClick={() => setFilterType('vacation')}
            size="sm"
          >
            Liburan
          </Button>
          <Button
            variant={filterType === 'education' ? 'default' : 'outline'}
            onClick={() => setFilterType('education')}
            size="sm"
          >
            Pendidikan
          </Button>
          <Button
            variant={filterType === 'health' ? 'default' : 'outline'}
            onClick={() => setFilterType('health')}
            size="sm"
          >
            Kesehatan
          </Button>
          <Button
            variant={filterType === 'other' ? 'default' : 'outline'}
            onClick={() => setFilterType('other')}
            size="sm"
          >
            Lainnya
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900">Transaksi Baru</h3>
                  <p className="text-sm text-blue-700">Catat pemasukan atau pengeluaran</p>
                </div>
                <Link href="/transactions/new">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-900">Transfer Antar Kantong</h3>
                  <p className="text-sm text-green-700">Pindahkan dana antar kantong</p>
                </div>
                <Link href="/pockets/transfer">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Transfer
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pockets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPockets.map((pocket: any) => (
            <Card key={pocket.id} className={`relative ${!pocket.isActive ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-12 h-12 rounded-full ${pocketColors[pocket.color]} flex items-center justify-center text-white text-xl`}
                    >
                      {pocketIcons[pocket.icon] || '💰'}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{pocket.name}</CardTitle>
                      <Badge variant={pocket.isActive ? 'default' : 'secondary'}>
                        {pocketTypeLabels[pocket.pocketType] || pocket.pocketType}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Link href={`/pockets/${pocket.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Kantong</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus kantong "{pocket.name}"? Tindakan ini
                            tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deletePocketMutation.mutate(pocket.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Saldo Saat Ini</p>
                    <p className="text-2xl font-bold">
                      {showBalances ? formatCurrency(pocket.balance || 0) : '••••••'}
                    </p>
                  </div>

                  {pocket.targetAmount && (
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Target</span>
                        <span>{showBalances ? formatCurrency(pocket.targetAmount) : '••••••'}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${pocketColors[pocket.color]} h-2 rounded-full transition-all duration-300`}
                          style={{
                            width: `${Math.min((pocket.balance / pocket.targetAmount) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {((pocket.balance / pocket.targetAmount) * 100).toFixed(1)}% tercapai
                      </p>
                    </div>
                  )}

                  {pocket.description && (
                    <p className="text-sm text-gray-600">{pocket.description}</p>
                  )}

                  <div className="flex space-x-2">
                    <Button
                      variant={pocket.isActive ? 'outline' : 'default'}
                      size="sm"
                      onClick={() =>
                        togglePocketMutation.mutate({
                          pocketId: pocket.id,
                          isActive: !pocket.isActive,
                        })
                      }
                      className="flex-1"
                    >
                      {pocket.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPockets.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-2">Belum Ada Kantong</h3>
              <p className="text-gray-600 mb-4">
                Mulai dengan membuat kantong pertama Anda untuk mengatur keuangan dengan lebih baik.
              </p>
              <Link href="/pockets/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Kantong Pertama
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
