'use client'

import type React from 'react'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface EvaluationFormData {
  income: number
  expenses: number
  assets: number
  liabilities: number
}

export default function EvaluationPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState<EvaluationFormData>({
    income: 0,
    expenses: 0,
    assets: 0,
    liabilities: 0,
  })

  const createEvaluationMutation = useMutation({
    mutationFn: async (data: EvaluationFormData) => {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/initial-evaluations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({
          ...data,
          user: user?.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create evaluation')
      }

      return response.json()
    },
    onSuccess: () => {
      toast({
        title: 'Berhasil!',
        description: 'Evaluasi keuangan awal berhasil disimpan',
      })
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

    if (formData.income <= 0) {
      toast({
        title: 'Error',
        description: 'Pemasukan harus lebih dari 0',
        variant: 'destructive',
      })
      return
    }

    createEvaluationMutation.mutate(formData)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Evaluasi Keuangan Awal</CardTitle>
            <CardDescription>
              Isi data keuangan Anda untuk mendapatkan skor keuangan dan rekomendasi yang sesuai
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="income">Pemasukan Bulanan (Rp)</Label>
                  <Input
                    id="income"
                    type="number"
                    min="0"
                    step="100000"
                    value={formData.income || ''}
                    onChange={(e) => setFormData({ ...formData, income: Number(e.target.value) })}
                    placeholder="0"
                    required
                  />
                  {formData.income > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(formData.income)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expenses">Pengeluaran Bulanan (Rp)</Label>
                  <Input
                    id="expenses"
                    type="number"
                    min="0"
                    step="100000"
                    value={formData.expenses || ''}
                    onChange={(e) => setFormData({ ...formData, expenses: Number(e.target.value) })}
                    placeholder="0"
                    required
                  />
                  {formData.expenses > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(formData.expenses)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assets">Total Aset (Rp)</Label>
                  <Input
                    id="assets"
                    type="number"
                    min="0"
                    step="1000000"
                    value={formData.assets || ''}
                    onChange={(e) => setFormData({ ...formData, assets: Number(e.target.value) })}
                    placeholder="0"
                    required
                  />
                  {formData.assets > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(formData.assets)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Termasuk tabungan, investasi, properti, kendaraan, dan aset lainnya
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="liabilities">Total Utang (Rp)</Label>
                  <Input
                    id="liabilities"
                    type="number"
                    min="0"
                    step="1000000"
                    value={formData.liabilities || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, liabilities: Number(e.target.value) })
                    }
                    placeholder="0"
                    required
                  />
                  {formData.liabilities > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(formData.liabilities)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Termasuk KPR, KTA, kartu kredit, pinjaman pendidikan, dan utang lainnya
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => router.push('/')}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                </Button>
                <Button type="submit" disabled={createEvaluationMutation.isPending}>
                  {createEvaluationMutation.isPending ? 'Menyimpan...' : 'Simpan dan Lanjutkan'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
