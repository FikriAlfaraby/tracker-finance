"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface SubGoalFormData {
  name: string
  description: string
  allocatedAmount: number
  assetType: string
  notes: string
}

export default function NewSubGoalPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const goalId = params.id as string
  const { toast } = useToast()

  const [formData, setFormData] = useState<SubGoalFormData>({
    name: "",
    description: "",
    allocatedAmount: 0,
    assetType: "savings",
    notes: "",
  })

  // Fetch parent goal data
  const { data: goalData, isLoading: isLoadingGoal } = useQuery({
    queryKey: ["goal", goalId],
    queryFn: async () => {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/financial-goals/${goalId}`, {
        headers: {
          Authorization: `JWT ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error("Failed to fetch goal data")
      }
      return response.json()
    },
    enabled: !!user && !!goalId,
  })

  const createSubGoalMutation = useMutation({
    mutationFn: async (data: SubGoalFormData) => {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/sub-goals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({
          ...data,
          user: user?.id,
          goal: goalId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create sub-goal")
      }

      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "Berhasil!",
        description: "Kantong berhasil dibuat",
      })
      router.push(`/goals/${goalId}`)
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) {
      toast({
        title: "Error",
        description: "Nama kantong harus diisi",
        variant: "destructive",
      })
      return
    }

    createSubGoalMutation.mutate(formData)
  }

  if (isLoadingGoal) {
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
          <Link href={`/goals/${goalId}`} className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Detail Tujuan
          </Link>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Tambah Kantong Baru</CardTitle>
            <CardDescription>
              Tambahkan kantong untuk tujuan: <span className="font-medium">{goalData?.name}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Kantong</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Tabungan BCA, Reksa Dana, Saham BBCA"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi (Opsional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Jelaskan kantong ini..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="allocatedAmount">Jumlah Alokasi (Rp)</Label>
                  <Input
                    id="allocatedAmount"
                    type="number"
                    min="0"
                    step="100000"
                    value={formData.allocatedAmount || ""}
                    onChange={(e) => setFormData({ ...formData, allocatedAmount: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assetType">Jenis Aset</Label>
                  <Select
                    value={formData.assetType}
                    onValueChange={(value) => setFormData({ ...formData, assetType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis aset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="savings">Tabungan</SelectItem>
                      <SelectItem value="stocks">Saham</SelectItem>
                      <SelectItem value="mutual_funds">Reksa Dana</SelectItem>
                      <SelectItem value="gold">Emas</SelectItem>
                      <SelectItem value="property">Properti</SelectItem>
                      <SelectItem value="crypto">Kripto</SelectItem>
                      <SelectItem value="other">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Catatan Tambahan (Opsional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Tambahkan catatan lain..."
                  rows={2}
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <Button type="submit" disabled={createSubGoalMutation.isPending} className="flex-1">
                  {createSubGoalMutation.isPending ? "Menyimpan..." : "Simpan Kantong"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/goals/${goalId}`)}
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
