"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface TransactionFormData {
  type: "income" | "expense"
  category: string
  amount: number
  date: string
  description?: string
}

const incomeCategories = [
  { value: "salary", label: "Gaji" },
  { value: "freelance", label: "Freelance" },
  { value: "investment", label: "Investasi" },
  { value: "bonus", label: "Bonus" },
  { value: "other-income", label: "Lainnya" },
]

const expenseCategories = [
  { value: "food", label: "Makanan" },
  { value: "transportation", label: "Transportasi" },
  { value: "shopping", label: "Belanja" },
  { value: "bills", label: "Tagihan" },
  { value: "entertainment", label: "Hiburan" },
  { value: "health", label: "Kesehatan" },
  { value: "education", label: "Pendidikan" },
  { value: "other-expense", label: "Lainnya" },
]

export default function NewTransaction() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<TransactionFormData>({
    type: "expense",
    category: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    description: "",
  })

  const createTransactionMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/transactions`, {
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
        throw new Error(error.message || "Failed to create transaction")
      }

      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "Berhasil!",
        description: "Transaksi berhasil dicatat",
      })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      router.push("/dashboard")
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

    if (!formData.category || !formData.amount || formData.amount <= 0) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua field yang diperlukan",
        variant: "destructive",
      })
      return
    }

    createTransactionMutation.mutate(formData)
  }

  const categories = formData.type === "income" ? incomeCategories : expenseCategories

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
            <CardTitle>Tambah Transaksi Baru</CardTitle>
            <CardDescription>Catat pemasukan atau pengeluaran Anda untuk memperbarui skor keuangan</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Jenis Transaksi</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "income" | "expense") =>
                      setFormData({ ...formData, type: value, category: "" })
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Jumlah (Rp)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.amount || ""}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    placeholder="0"
                  />
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
                <Button type="submit" disabled={createTransactionMutation.isPending} className="flex-1">
                  {createTransactionMutation.isPending ? "Menyimpan..." : "Simpan Transaksi"}
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
