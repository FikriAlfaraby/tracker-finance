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
import { ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface TransferFormData {
  fromPocket: string
  toPocket: string
  amount: number
  description: string
  notes: string
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

export default function TransferPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<TransferFormData>({
    fromPocket: '',
    toPocket: '',
    amount: 0,
    description: '',
    notes: '',
  })

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

  const transferMutation = useMutation({
    mutationFn: async (data: TransferFormData) => {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/pocket-transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({
          transactionType: 'transfer',
          fromPocket: data.fromPocket,
          toPocket: data.toPocket,
          amount: data.amount,
          description:
            data.description ||
            `Transfer dari ${getSelectedPocket(data.fromPocket)?.name} ke ${getSelectedPocket(data.toPocket)?.name}`,
          notes: data.notes,
          date: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to transfer')
      }

      return response.json()
    },
    onSuccess: () => {
      toast({
        title: 'Berhasil!',
        description: 'Transfer antar kantong berhasil dilakukan',
      })
      queryClient.invalidateQueries({ queryKey: ['pockets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      router.push('/pockets')
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

    if (!formData.fromPocket || !formData.toPocket || !formData.amount || formData.amount <= 0) {
      toast({
        title: 'Error',
        description: 'Mohon lengkapi semua field yang diperlukan',
        variant: 'destructive',
      })
      return
    }

    if (formData.fromPocket === formData.toPocket) {
      toast({
        title: 'Error',
        description: 'Kantong sumber dan tujuan tidak boleh sama',
        variant: 'destructive',
      })
      return
    }

    // Validate source pocket balance
    const sourcePocket = getSelectedPocket(formData.fromPocket)
    if (sourcePocket && sourcePocket.balance < formData.amount) {
      toast({
        title: 'Saldo Tidak Mencukupi',
        description: `Saldo kantong ${sourcePocket.name} tidak mencukupi. Saldo: Rp ${sourcePocket.balance.toLocaleString('id-ID')}`,
        variant: 'destructive',
      })
      return
    }

    transferMutation.mutate(formData)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getSelectedPocket = (pocketId: string) => {
    return activePockets.find((pocket: any) => pocket.id === pocketId)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const activePockets = pockets?.docs?.filter((pocket: any) => pocket.isActive) || []
  const sourcePocket = getSelectedPocket(formData.fromPocket)
  const targetPocket = getSelectedPocket(formData.toPocket)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/pockets"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Kantong
          </Link>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Transfer Antar Kantong</CardTitle>
            <CardDescription>Pindahkan dana dari satu kantong ke kantong lainnya</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromPocket">Dari Kantong</Label>
                  <Select
                    value={formData.fromPocket}
                    onValueChange={(value) => setFormData({ ...formData, fromPocket: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kantong sumber" />
                    </SelectTrigger>
                    <SelectContent>
                      {activePockets.map((pocket: any) => (
                        <SelectItem
                          key={pocket.id}
                          value={pocket.id}
                          disabled={pocket.id === formData.toPocket}
                        >
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="toPocket">Ke Kantong</Label>
                  <Select
                    value={formData.toPocket}
                    onValueChange={(value) => setFormData({ ...formData, toPocket: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kantong tujuan" />
                    </SelectTrigger>
                    <SelectContent>
                      {activePockets.map((pocket: any) => (
                        <SelectItem
                          key={pocket.id}
                          value={pocket.id}
                          disabled={pocket.id === formData.fromPocket}
                        >
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
                </div>
              </div>

              {/* Transfer Preview */}
              {sourcePocket && targetPocket && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-medium mb-3">Preview Transfer</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-center">
                        <div className="text-2xl">{pocketIcons[sourcePocket.icon] || '💰'}</div>
                        <div className="text-sm font-medium">{sourcePocket.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(sourcePocket.balance || 0)}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-6 w-6 text-blue-600" />
                    <div className="flex items-center space-x-3">
                      <div className="text-center">
                        <div className="text-2xl">{pocketIcons[targetPocket.icon] || '💰'}</div>
                        <div className="text-sm font-medium">{targetPocket.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(targetPocket.balance || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                  {formData.amount > 0 && (
                    <div className="mt-3 text-center">
                      <div className="text-lg font-bold text-blue-800">
                        Transfer: {formatCurrency(formData.amount)}
                      </div>
                      {sourcePocket.balance < formData.amount && (
                        <div className="text-sm text-red-600 mt-1">⚠️ Saldo tidak mencukupi</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">Jumlah Transfer (Rp)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  placeholder="0"
                  required
                />
                {sourcePocket && formData.amount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Sisa saldo:{' '}
                    {formatCurrency(Math.max(0, sourcePocket.balance - formData.amount))}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi (Opsional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Contoh: Transfer untuk belanja bulanan"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Catatan Tambahan (Opsional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Tambahkan catatan jika diperlukan..."
                  rows={3}
                />
              </div>

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={transferMutation.isPending || activePockets.length < 2}
                  className="flex-1"
                >
                  {transferMutation.isPending ? 'Memproses...' : 'Transfer Dana'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/pockets')}
                  className="flex-1"
                >
                  Batal
                </Button>
              </div>

              {activePockets.length < 2 && (
                <p className="text-sm text-muted-foreground text-center">
                  Anda memerlukan minimal 2 kantong aktif untuk melakukan transfer
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
