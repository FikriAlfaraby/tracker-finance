'use client'

import type React from 'react'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Plus, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface TransactionFormData {
  type: 'income' | 'expense'
  sourcePocket: string
  category: string
  amount: number
  date: string
  description?: string
}

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

export default function NewTransaction() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'expense',
    sourcePocket: '',
    category: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
  })

  // Fetch pockets for dropdown
  const { data: pockets, isLoading: isLoadingPockets } = useQuery({
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

  const createTransactionMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const token = localStorage.getItem('token')

      const cleanData = {
        ...data,
        user: user?.id,
      }

      const response = await fetch(`/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify(cleanData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create transaction')
      }

      return response.json()
    },
    onSuccess: () => {
      toast({
        title: 'Berhasil!',
        description: 'Transaksi berhasil dicatat dan saldo kantong telah diperbarui',
      })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['pockets'] })
      router.push('/dashboard')
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.sourcePocket || !formData.category || !formData.amount || formData.amount <= 0) {
      toast({
        title: 'Error',
        description: 'Mohon lengkapi semua field yang diperlukan',
        variant: 'destructive',
      })
      return
    }

    // Validate pocket balance for expenses
    if (formData.type === 'expense') {
      const selectedPocket = activePockets?.find((p: any) => p.id === formData.sourcePocket)
      if (selectedPocket && selectedPocket.balance < formData.amount) {
        toast({
          title: 'Saldo Tidak Mencukupi',
          description: `Saldo kantong ${selectedPocket.name} tidak mencukupi. Saldo: Rp ${selectedPocket.balance.toLocaleString('id-ID')}`,
          variant: 'destructive',
        })
        return
      }
    }

    createTransactionMutation.mutate(formData)
  }

  const incomeCategories = [
    { value: 'salary', label: 'Gaji' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'investment', label: 'Investasi' },
    { value: 'bonus', label: 'Bonus' },
    { value: 'other-income', label: 'Lainnya' },
  ]

  const expenseCategories = [
    { value: 'food', label: 'Makanan' },
    { value: 'transportation', label: 'Transportasi' },
    { value: 'shopping', label: 'Belanja' },
    { value: 'bills', label: 'Tagihan' },
    { value: 'entertainment', label: 'Hiburan' },
    { value: 'health', label: 'Kesehatan' },
    { value: 'education', label: 'Pendidikan' },
    { value: 'other-expense', label: 'Lainnya' },
  ]

  const categories = formData.type === 'income' ? incomeCategories : expenseCategories

  // Filter active pockets only
  const activePockets = pockets?.docs?.filter((pocket: any) => pocket.isActive) || []
  const selectedPocket = activePockets.find((p: any) => p.id === formData.sourcePocket)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoadingPockets) {
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

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Tambah Transaksi Baru</CardTitle>
            <CardDescription>
              Catat pemasukan atau pengeluaran dari kantong yang Anda pilih
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* No Pockets Warning */}
            {activePockets.length === 0 && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Anda belum memiliki kantong aktif. Silakan buat kantong terlebih dahulu untuk
                  dapat mencatat transaksi.
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

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Jenis Transaksi</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'income' | 'expense') =>
                      setFormData({ ...formData, type: value, category: '' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Pemasukan</SelectItem>
                      <SelectItem value="expense">Pengeluaran</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Source Pocket Selection */}
              <div className="space-y-2">
                <Label htmlFor="sourcePocket">
                  {formData.type === 'income' ? 'Kantong Tujuan' : 'Sumber Dana'}
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select
                  value={formData.sourcePocket}
                  onValueChange={(value) => setFormData({ ...formData, sourcePocket: value })}
                  disabled={activePockets.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kantong" />
                  </SelectTrigger>
                  <SelectContent>
                    {activePockets.map((pocket: any) => (
                      <SelectItem key={pocket.id} value={pocket.id}>
                        <div className="flex items-center space-x-2">
                          <span>{pocketIcons[pocket.icon] || '💰'}</span>
                          <span>{pocket.name}</span>
                          <span className="text-sm text-muted-foreground">
                            ({formatCurrency(pocket.balance || 0)})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {activePockets.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Tidak ada kantong aktif. Silakan buat kantong terlebih dahulu.
                  </p>
                )}
              </div>

              {/* Selected Pocket Info */}
              {selectedPocket && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{pocketIcons[selectedPocket.icon] || '💰'}</div>
                    <div>
                      <h3 className="font-medium">{selectedPocket.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Saldo:{' '}
                        <span className="font-medium">
                          {formatCurrency(selectedPocket.balance || 0)}
                        </span>
                      </p>
                      {selectedPocket.description && (
                        <p className="text-xs text-muted-foreground">
                          {selectedPocket.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {formData.type === 'expense' &&
                    formData.amount > 0 &&
                    selectedPocket.balance < formData.amount && (
                      <div className="mt-2 text-sm text-red-600">
                        ⚠️ Saldo tidak mencukupi untuk transaksi ini
                      </div>
                    )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Jumlah (Rp)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    placeholder="0"
                  />
                  {formData.amount > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(formData.amount)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Tanggal</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi (Opsional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tambahkan catatan untuk transaksi ini..."
                  rows={3}
                />
              </div>

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={createTransactionMutation.isPending || activePockets.length === 0}
                  className="flex-1"
                >
                  {createTransactionMutation.isPending ? 'Menyimpan...' : 'Simpan Transaksi'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  className="flex-1"
                >
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
