'use client'

import type React from 'react'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

interface PocketFormData {
  name: string
  description: string
  pocketType: string
  targetAmount: number
  icon: string
  color: string
  isActive: boolean
}

const pocketTypeOptions = [
  { value: 'main', label: 'Kantong Utama' },
  { value: 'savings', label: 'Tabungan' },
  { value: 'emergency', label: 'Dana Darurat' },
  { value: 'investment', label: 'Investasi' },
  { value: 'shopping', label: 'Belanja' },
  { value: 'vacation', label: 'Liburan' },
  { value: 'education', label: 'Pendidikan' },
  { value: 'health', label: 'Kesehatan' },
  { value: 'other', label: 'Lainnya' },
]

const iconOptions = [
  { value: 'money', label: '💰 Uang' },
  { value: 'bank', label: '🏦 Bank' },
  { value: 'emergency', label: '🚨 Darurat' },
  { value: 'investment', label: '📈 Investasi' },
  { value: 'shopping', label: '🛍️ Belanja' },
  { value: 'vacation', label: '✈️ Liburan' },
  { value: 'education', label: '📚 Pendidikan' },
  { value: 'health', label: '🏥 Kesehatan' },
  { value: 'digital', label: '💳 Digital' },
  { value: 'target', label: '🎯 Target' },
]

const colorOptions = [
  { value: 'green', label: 'Hijau' },
  { value: 'blue', label: 'Biru' },
  { value: 'purple', label: 'Ungu' },
  { value: 'pink', label: 'Pink' },
  { value: 'yellow', label: 'Kuning' },
  { value: 'red', label: 'Merah' },
  { value: 'gray', label: 'Abu-abu' },
]

export default function EditPocketPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const pocketId = params.id as string

  const [formData, setFormData] = useState<PocketFormData>({
    name: '',
    description: '',
    pocketType: 'other',
    targetAmount: 0,
    icon: 'money',
    color: 'green', // Ubah kembali ke "green" sesuai collection
    isActive: true,
  })

  // Fetch pocket data
  const { data: pocket, isLoading } = useQuery({
    queryKey: ['pocket', pocketId],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/pockets/${pocketId}`, {
        headers: {
          Authorization: `JWT ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch pocket')
      return response.json()
    },
    enabled: !!user && !!pocketId,
  })

  // Update form data when pocket is loaded
  useEffect(() => {
    if (pocket) {
      setFormData({
        name: pocket.name || '',
        description: pocket.description || '',
        pocketType: pocket.pocketType || 'other',
        targetAmount: pocket.targetAmount || 0,
        icon: pocket.icon || 'money',
        color: pocket.color || 'green', // Ubah fallback ke "green"
        isActive: pocket.isActive ?? true,
      })
    }
  }, [pocket])

  // Update pocket mutation
  const updatePocketMutation = useMutation({
    mutationFn: async (data: PocketFormData) => {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/pockets/${pocketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update pocket')
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: 'Berhasil!',
        description: 'Kantong berhasil diperbarui',
      })
      queryClient.invalidateQueries({ queryKey: ['pockets'] })
      queryClient.invalidateQueries({ queryKey: ['pocket', pocketId] })
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

    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Nama kantong harus diisi',
        variant: 'destructive',
      })
      return
    }

    updatePocketMutation.mutate(formData)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!pocket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Kantong Tidak Ditemukan</h1>
          <Link href="/pockets">
            <Button>Kembali ke Daftar Kantong</Button>
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
            href="/pockets"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Kantong
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Edit Kantong</CardTitle>
              <p className="text-gray-600">Perbarui informasi kantong Anda</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Current Balance Display */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-blue-700">Saldo Saat Ini</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatCurrency(pocket.balance || 0)}
                      </p>
                    </div>
                    <div className="text-4xl">
                      {iconOptions.find((i) => i.value === formData.icon)?.label || '💰'}
                    </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nama Kantong *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Masukkan nama kantong"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="pocketType">Jenis Kantong</Label>
                    <Select
                      value={formData.pocketType}
                      onValueChange={(value) => setFormData({ ...formData, pocketType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {pocketTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi tujuan kantong ini"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="targetAmount">Target Jumlah (Opsional)</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    value={formData.targetAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, targetAmount: Number(e.target.value) })
                    }
                    placeholder="0"
                    min="0"
                  />
                  {formData.targetAmount > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      Target: {formatCurrency(formData.targetAmount)}
                    </p>
                  )}
                </div>

                {/* Appearance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="icon">Ikon</Label>
                    <Select
                      value={formData.icon}
                      onValueChange={(value) => setFormData({ ...formData, icon: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {iconOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="color">Warna</Label>
                    <Select
                      defaultValue={formData.color}
                      value={formData.color}
                      onValueChange={(value) => setFormData({ ...formData, color: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="isActive">Kantong Aktif</Label>
                </div>

                {/* Submit Button */}
                <div className="flex space-x-4">
                  <Button
                    type="submit"
                    disabled={updatePocketMutation.isPending}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updatePocketMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                  <Link href="/pockets">
                    <Button type="button" variant="outline">
                      Batal
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
