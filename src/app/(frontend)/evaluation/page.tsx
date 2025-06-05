'use client'

import type React from 'react'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, ArrowRight, HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface EvaluationFormData {
  monthlyIncome: number
  monthlyExpenses: number
  totalAssets: number
  totalLiabilities: number
}

export default function EvaluationPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState<EvaluationFormData>({
    monthlyIncome: 0,
    monthlyExpenses: 0,
    totalAssets: 0,
    totalLiabilities: 0,
  })

  // Fetch existing financial data if available
  const { data: existingData, isLoading: isLoadingData } = useQuery({
    queryKey: ['financialData'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/financial-data/latest`, {
        headers: {
          Authorization: `JWT ${token}`,
        },
      })
      if (!response.ok) {
        if (response.status === 404) {
          return null // No data found, not an error
        }
        throw new Error('Failed to fetch financial data')
      }
      return response.json()
    },
    enabled: !!user,
  })

  useEffect(() => {
    if (existingData) {
      setFormData({
        monthlyIncome: existingData.monthlyIncome,
        monthlyExpenses: existingData.monthlyExpenses,
        totalAssets: existingData.totalAssets,
        totalLiabilities: existingData.totalLiabilities,
      })
    }
  }, [existingData])

  const createEvaluationMutation = useMutation({
    mutationFn: async (data: EvaluationFormData) => {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/financial-data`, {
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
        description: 'Evaluasi keuangan berhasil disimpan',
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

    if (formData.monthlyIncome <= 0) {
      toast({
        title: 'Error',
        description: 'Pemasukan bulanan harus lebih dari 0',
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

  if (isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Evaluasi Keuangan</CardTitle>
            <CardDescription>
              {existingData
                ? 'Perbarui data keuangan Anda'
                : 'Isi data keuangan Anda untuk mendapatkan skor keuangan dan rekomendasi yang sesuai'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label htmlFor="monthlyIncome" className="mr-2">
                      Pemasukan Bulanan (Rp)
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Total pemasukan bulanan termasuk gaji, bonus, dividen, atau pendapatan
                            lainnya.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="monthlyIncome"
                    type="number"
                    min="0"
                    step="100000"
                    value={formData.monthlyIncome || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, monthlyIncome: Number(e.target.value) })
                    }
                    placeholder="0"
                    required
                  />
                  {formData.monthlyIncome > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(formData.monthlyIncome)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label htmlFor="monthlyExpenses" className="mr-2">
                      Pengeluaran Bulanan (Rp)
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Total pengeluaran bulanan termasuk biaya hidup, cicilan, dan pengeluaran
                            rutin lainnya.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="monthlyExpenses"
                    type="number"
                    min="0"
                    step="100000"
                    value={formData.monthlyExpenses || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, monthlyExpenses: Number(e.target.value) })
                    }
                    placeholder="0"
                    required
                  />
                  {formData.monthlyExpenses > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(formData.monthlyExpenses)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label htmlFor="totalAssets" className="mr-2">
                      Total Aset (Rp)
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Total nilai aset yang Anda miliki, termasuk tabungan, investasi,
                            properti, kendaraan, dll.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="totalAssets"
                    type="number"
                    min="0"
                    step="1000000"
                    value={formData.totalAssets || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, totalAssets: Number(e.target.value) })
                    }
                    placeholder="0"
                    required
                  />
                  {formData.totalAssets > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(formData.totalAssets)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Termasuk tabungan, investasi, properti, kendaraan, dan aset lainnya
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label htmlFor="totalLiabilities" className="mr-2">
                      Total Utang (Rp)
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Total utang yang Anda miliki, termasuk KPR, KTA, kartu kredit, dll.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="totalLiabilities"
                    type="number"
                    min="0"
                    step="1000000"
                    value={formData.totalLiabilities || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, totalLiabilities: Number(e.target.value) })
                    }
                    placeholder="0"
                    required
                  />
                  {formData.totalLiabilities > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(formData.totalLiabilities)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Termasuk KPR, KTA, kartu kredit, pinjaman pendidikan, dan utang lainnya
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => router.push('/dashboard')}>
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
