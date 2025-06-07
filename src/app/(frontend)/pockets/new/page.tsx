'use client'

import type React from 'react'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface PocketFormData {
  name: string
  description: string
  balance: number
  pocketType: string
  targetAmount: number
  icon: string
  color: string
}

const pocketIcons = [
  { value: 'money', label: '💰 Uang', icon: '💰' },
  { value: 'bank', label: '🏦 Bank', icon: '🏦' },
  { value: 'emergency', label: '🚨 Darurat', icon: '🚨' },
  { value: 'investment', label: '📈 Investasi', icon: '📈' },
  { value: 'shopping', label: '🛍️ Belanja', icon: '🛍️' },
  { value: 'vacation', label: '✈️ Liburan', icon: '✈️' },
  { value: 'education', label: '📚 Pendidikan', icon: '📚' },
  { value: 'health', label: '🏥 Kesehatan', icon: '🏥' },
  { value: 'digital', label: '💳 Digital', icon: '💳' },
  { value: 'target', label: '🎯 Target', icon: '🎯' },
]

const pocketColors = [
  { value: 'green', label: 'Hijau', class: 'bg-green-100 border-green-300' },
  { value: 'blue', label: 'Biru', class: 'bg-blue-100 border-blue-300' },
  { value: 'purple', label: 'Ungu', class: 'bg-purple-100 border-purple-300' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-100 border-pink-300' },
  { value: 'yellow', label: 'Kuning', class: 'bg-yellow-100 border-yellow-300' },
  { value: 'red', label: 'Merah', class: 'bg-red-100 border-red-300' },
  { value: 'gray', label: 'Abu-abu', class: 'bg-gray-100 border-gray-300' },
]

export default function NewPocketPage() {
  const { user } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [formData, setFormData] = useState<PocketFormData>({
    name: '',
    description: '',
    balance: 0,
    pocketType: 'other',
    targetAmount: 0,
    icon: 'money',
    color: 'green',
  })

  const createPocketMutation = useMutation({
    mutationFn: async (data: PocketFormData) => {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/pockets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({
          ...data,
          user: user?.id,
          isActive: true,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create pocket')
      }

      return response.json()
    },
    onSuccess: () => {
      toast({
        title: 'Berhasil!',
        description: 'Kantong berhasil dibuat',
      })
      queryClient.invalidateQueries({ queryKey: ['pockets'] })
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

    if (!formData.name) {
      toast({
        title: 'Error',
        description: 'Nama kantong harus diisi',
        variant: 'destructive',
      })
      return
    }

    createPocketMutation.mutate(formData)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const selectedIcon = pocketIcons.find((icon) => icon.value === formData.icon)
  const selectedColor = pocketColors.find((color) => color.value === formData.color)

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
            <CardTitle>Buat Kantong Baru</CardTitle>
            <CardDescription>
              Buat kantong untuk mengatur alokasi dana dan memudahkan pencatatan transaksi
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Preview */}
            <div className="mb-6">
              <Label className="text-sm font-medium mb-2 block">Preview Kantong</Label>
              <div
                className={`p-4 rounded-lg border-2 ${selectedColor?.class || 'bg-green-100 border-green-300'}`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{selectedIcon?.icon || '💰'}</span>
                  <div>
                    <h3 className="font-semibold">{formData.name || 'Nama Kantong'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formData.balance > 0 ? formatCurrency(formData.balance) : 'Rp 0'}
                    </p>
                  </div>
                </div>
                {formData.description && (
                  <p className="text-sm text-muted-foreground mt-2">{formData.description}</p>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Kantong</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Dana Darurat, Liburan, Belanja Bulanan"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi (Opsional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Jelaskan tujuan kantong ini..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pocketType">Jenis Kantong</Label>
                  <Select
                    value={formData.pocketType}
                    onValueChange={(value) => setFormData({ ...formData, pocketType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">Kantong Utama</SelectItem>
                      <SelectItem value="savings">Tabungan</SelectItem>
                      <SelectItem value="emergency">Dana Darurat</SelectItem>
                      <SelectItem value="investment">Investasi</SelectItem>
                      <SelectItem value="shopping">Belanja</SelectItem>
                      <SelectItem value="vacation">Liburan</SelectItem>
                      <SelectItem value="education">Pendidikan</SelectItem>
                      <SelectItem value="health">Kesehatan</SelectItem>
                      <SelectItem value="other">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="balance">Saldo Awal (Rp)</Label>
                  <Input
                    id="balance"
                    type="number"
                    min="0"
                    step="10000"
                    value={formData.balance || ''}
                    onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAmount">Target Jumlah (Opsional)</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  min="0"
                  step="100000"
                  value={formData.targetAmount || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, targetAmount: Number(e.target.value) })
                  }
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Set target untuk kantong ini jika ingin memantau progress
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="icon">Ikon</Label>
                  <Select
                    value={formData.icon}
                    onValueChange={(value) => setFormData({ ...formData, icon: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pocketIcons.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value}>
                          {icon.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Warna</Label>
                  <Select
                    value={formData.color}
                    onValueChange={(value) => setFormData({ ...formData, color: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pocketColors.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center space-x-2">
                            <div className={`w-4 h-4 rounded ${color.class}`} />
                            <span>{color.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button type="submit" disabled={createPocketMutation.isPending} className="flex-1">
                  {createPocketMutation.isPending ? 'Membuat...' : 'Buat Kantong'}
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
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
