"use client"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, Plus } from "lucide-react"
import Link from "next/link"

interface SubGoal {
  id: string
  name: string
  description?: string
  allocatedAmount: number
  assetType: string
}

interface Goal {
  id: string
  name: string
  description?: string
  targetAmount: number
  targetDate?: string
  priority: "low" | "medium" | "high"
  currentTotalAllocation: number
  progress: number
  requiredMonthlySavings?: number
  estimatedCompletionDate?: string
  subGoals: SubGoal[]
}

interface GoalsListProps {
  goals: Goal[]
}

const priorityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
}

const assetTypeLabels: Record<string, string> = {
  savings: "Tabungan",
  stocks: "Saham",
  mutual_funds: "Reksa Dana",
  gold: "Emas",
  property: "Properti",
  crypto: "Kripto",
  other: "Lainnya",
}

export function GoalsList({ goals }: GoalsListProps) {
  if (goals.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">Anda belum memiliki tujuan keuangan.</p>
        <Link href="/goals/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Tujuan Keuangan
          </Button>
        </Link>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {goals.map((goal) => (
        <Card key={goal.id} className="overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{goal.name}</h3>
                {goal.description && <p className="text-sm text-muted-foreground">{goal.description}</p>}
              </div>
              <Badge className={priorityColors[goal.priority]}>
                {goal.priority === "low" && "Prioritas Rendah"}
                {goal.priority === "medium" && "Prioritas Sedang"}
                {goal.priority === "high" && "Prioritas Tinggi"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Target</p>
                <p className="font-medium">{formatCurrency(goal.targetAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Alokasi Saat Ini</p>
                <p className="font-medium">{formatCurrency(goal.currentTotalAllocation)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Target Selesai</p>
                <p className="font-medium">{formatDate(goal.targetDate)}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-sm">Progress</span>
                <span className="text-sm font-medium">{goal.progress.toFixed(1)}%</span>
              </div>
              <Progress value={goal.progress} className="h-2" />
            </div>

            {goal.requiredMonthlySavings && (
              <div className="text-sm text-muted-foreground mb-4">
                Tabungan bulanan yang diperlukan:{" "}
                <span className="font-medium">{formatCurrency(goal.requiredMonthlySavings)}</span>
              </div>
            )}

            {goal.estimatedCompletionDate && (
              <div className="text-sm text-muted-foreground">
                Estimasi selesai: <span className="font-medium">{formatDate(goal.estimatedCompletionDate)}</span>
              </div>
            )}

            {goal.subGoals.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Kantong ({goal.subGoals.length})</h4>
                <div className="space-y-2">
                  {goal.subGoals.map((subGoal) => (
                    <div key={subGoal.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                      <div>
                        <p className="font-medium">{subGoal.name}</p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Badge variant="outline" className="mr-2">
                            {assetTypeLabels[subGoal.assetType] || subGoal.assetType}
                          </Badge>
                          {formatCurrency(subGoal.allocatedAmount)}
                        </div>
                      </div>
                      <Link href={`/goals/${goal.id}/sub-goals/${subGoal.id}`}>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end space-x-2">
              <Link href={`/goals/${goal.id}/sub-goals/new`}>
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Kantong
                </Button>
              </Link>
              <Link href={`/goals/${goal.id}`}>
                <Button size="sm">Detail</Button>
              </Link>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
