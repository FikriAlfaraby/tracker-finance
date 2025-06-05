'use client'

import { useAuth } from '@/contexts/auth-context'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Calendar, Edit, Plus, Trash2 } from 'lucide-react'
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
import { useState } from 'react'

const priorityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
}

const assetTypeLabels: Record<string, string> = {
  savings: 'Tabungan',
  stocks: 'Saham',
  mutual_funds: 'Reksa Dana',
  gold: 'Emas',
  property: 'Properti',
  crypto: 'Kripto',
  other: 'Lainnya',
}

const assetTypeIcons: Record<string, string> = {
  savings: '💰',
  stocks: '📈',
  mutual_funds: '📊',
  gold: '🪙',
  property: '🏠',
  crypto: '₿',
  other: '📦',
}

export default function GoalDetailPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const goalId = params.id as string
  const { toast } = useToast()
  const [subGoalToDelete, setSubGoalToDelete] = useState<string | null>(null)

  const { data: goalData, isLoading } = useQuery({
    queryKey: ['goal', goalId],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/financial-goals/${goalId}`, {
        headers: {
          Authorization: `JWT ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch goal data')
      }
      return response.json()
    },
    enabled: !!user && !!goalId,
  })

  const { data: subGoalsData, isLoading: isLoadingSubGoals } = useQuery({
    queryKey: ['subGoals', goalId],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/sub-goals?goal=${goalId}`, {
        headers: {
          Authorization: `JWT ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch sub-goals')
      }
      return response.json()
    },
    enabled: !!user && !!goalId,
  })

  const deleteSubGoalMutation = useMutation({
    mutationFn: async (subGoalId: string) => {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/sub-goals/${subGoalId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `JWT ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to delete sub-goal')
      }
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: 'Berhasil!',
        description: 'Kantong berhasil dihapus',
      })
      // Refetch data
      router.refresh()
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const deleteGoalMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/financial-goals/${goalId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `JWT ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to delete goal')
      }
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: 'Berhasil!',
        description: 'Tujuan keuangan berhasil dihapus',
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

  const handleDeleteSubGoal = (subGoalId: string) => {
    setSubGoalToDelete(null)
    deleteSubGoalMutation.mutate(subGoalId)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading || isLoading || isLoadingSubGoals) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!goalData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Tujuan tidak ditemukan</h1>
          <Link href="/dashboard">
            <Button>Kembali ke Dashboard</Button>
          </Link>
        </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <CardTitle>{goalData.name}</CardTitle>
                    <Badge
                      className={priorityColors[goalData.priority as keyof typeof priorityColors]}
                    >
                      {goalData.priority === 'low' && 'Prioritas Rendah'}
                      {goalData.priority === 'medium' && 'Prioritas Sedang'}
                      {goalData.priority === 'high' && 'Prioritas Tinggi'}
                    </Badge>
                  </div>
                  <CardDescription>{goalData.description}</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Link href={`/goals/${goalId}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hapus
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Tujuan Keuangan</AlertDialogTitle>
                        <AlertDialogDescription>
                          Apakah Anda yakin ingin menghapus tujuan keuangan ini? Semua kantong yang
                          terkait juga akan dihapus. Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteGoalMutation.mutate()}>
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Target</p>
                    <p className="font-medium">{formatCurrency(goalData.targetAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Alokasi Saat Ini</p>
                    <p className="font-medium">{formatCurrency(goalData.currentTotalAllocation)}</p>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Target Selesai</p>
                      <p className="font-medium">{formatDate(goalData.targetDate)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span className="text-sm">Progress</span>
                    <span className="text-sm font-medium">{goalData.progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={goalData.progress} className="h-2" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {goalData.requiredMonthlySavings && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-800 font-medium">
                        Tabungan bulanan yang diperlukan
                      </p>
                      <p className="text-lg font-bold text-blue-900">
                        {formatCurrency(goalData.requiredMonthlySavings)}
                      </p>
                    </div>
                  )}
                  {goalData.estimatedCompletionDate && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-800 font-medium">Estimasi selesai</p>
                      <p className="text-lg font-bold text-green-900">
                        {formatDate(goalData.estimatedCompletionDate)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Link href={`/goals/${goalId}/sub-goals/new`}>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Kantong
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Sub-goals list */}
            <div className="mt-6">
              <h2 className="text-xl font-bold mb-4">Kantong</h2>
              {subGoalsData?.docs?.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Belum ada kantong untuk tujuan ini.
                    </p>
                    <Link href={`/goals/${goalId}/sub-goals/new`}>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Kantong
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subGoalsData?.docs?.map((subGoal: any) => (
                    <Card key={subGoal.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <div className="text-2xl mr-3">
                              {assetTypeIcons[subGoal.assetType] || '📦'}
                            </div>
                            <div>
                              <h3 className="font-semibold">{subGoal.name}</h3>
                              <Badge variant="outline">
                                {assetTypeLabels[subGoal.assetType] || subGoal.assetType}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <Link href={`/goals/${goalId}/sub-goals/${subGoal.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                            </Link>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hapus Kantong</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Apakah Anda yakin ingin menghapus kantong ini? Tindakan ini
                                    tidak dapat dibatalkan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteSubGoal(subGoal.id)}
                                  >
                                    Hapus
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>

                        {subGoal.description && (
                          <p className="text-sm text-muted-foreground mb-4">
                            {subGoal.description}
                          </p>
                        )}

                        <div className="bg-gray-50 p-3 rounded-md mb-3">
                          <p className="text-sm text-muted-foreground">Jumlah Alokasi</p>
                          <p className="text-lg font-bold">
                            {formatCurrency(subGoal.allocatedAmount)}
                          </p>
                        </div>

                        {subGoal.notes && (
                          <div className="text-sm">
                            <p className="font-medium">Catatan:</p>
                            <p className="text-muted-foreground">{subGoal.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Kantong</p>
                    <p className="text-xl font-bold">{subGoalsData?.docs?.length || 0}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Total Alokasi</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(goalData.currentTotalAllocation)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Sisa Target</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(
                        Math.max(0, goalData.targetAmount - goalData.currentTotalAllocation),
                      )}
                    </p>
                  </div>

                  <div className="pt-4">
                    <Progress value={goalData.progress} className="h-2 mb-2" />
                    <p className="text-sm text-center">
                      {goalData.progress.toFixed(1)}% dari target{' '}
                      {formatCurrency(goalData.targetAmount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Tindakan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href={`/goals/${goalId}/sub-goals/new`} className="w-full">
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Kantong
                  </Button>
                </Link>
                <Link href={`/transactions/new?goalId=${goalId}`} className="w-full">
                  <Button variant="outline" className="w-full">
                    Catat Transaksi
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
