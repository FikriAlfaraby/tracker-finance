"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface GoalFormData {
  name: string
  description: string
  targetAmount: number
  targetDate: string
  priority: string
}

export default function NewGoalPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState<GoalFormData>({
    name: "",
    description: "",
    targetAmount: 0,
    targetDate: "",
    priority: "medium",
  })

  const createGoalMutation = useMutation({
    mutationFn: async (data: GoalFormData) => {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/financial-goals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({
          ...data,
          user: user?.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create goal")
      }

      return response.json()
    },
    onSuccess: (data) => {
      toast({
        title: "Berhasil!",
        description: "Tujuan keuangan berhasil dibuat",
      })
      router.push(`/goals/${data.id}`)
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

    if (!formData.name || formData.targetAmount <= 0) {
      toast({
        title: "Error",
        description: "Nama dan jumlah target harus diisi",
        variant: "destructive",
      })
      return
    }

    createGoalMutation.mutate(formData)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Dashboard
          </Link>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Tambah Tujuan Keuangan Baru</CardTitle>
            <CardDescription>Buat tujuan keuangan untuk membantu Anda mencapai target finansial</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Tujuan</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Beli Rumah, Dana Pendidikan, Dana Pensiun"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi (Opsional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Jelaskan tujuan keuangan Anda..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetAmount">Jumlah Target (Rp)</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    min="0"
                    step="1000000"
                    value={formData.targetAmount || ""}
                    onChange={(e) => setFormData({ ...formData, targetAmount: Number(e.target.value) })}
                    placeholder="0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetDate">Tanggal Target (Opsional)</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioritas</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih prioritas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Rendah</SelectItem>
                    <SelectItem value="medium">Sedang</SelectItem>
                    <SelectItem value="high">Tinggi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-4 pt-4">
                <Button type="submit" disabled={createGoalMutation.isPending} className="flex-1">
                  {createGoalMutation.isPending ? "Menyimpan..." : "Simpan Tujuan"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard")} className="flex-1">
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
