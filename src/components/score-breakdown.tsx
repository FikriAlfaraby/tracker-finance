'use client'

import { Progress } from '@/components/ui/progress'

interface ScoreComponentsProps {
  scoreComponents: {
    debtToIncomeRatio: number
    savingsToIncomeRatio: number
    expensesToIncomeRatio: number
    netWorthRatio: number
  } | null
}

export function ScoreBreakdown({ scoreComponents }: ScoreComponentsProps) {
  if (!scoreComponents) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Belum ada data skor keuangan. Silakan isi evaluasi keuangan terlebih dahulu.
      </div>
    )
  }

  // Calculate scores based on ratios
  const debtToIncomeScore =
    scoreComponents.debtToIncomeRatio <= 30
      ? 30
      : Math.max(0, 30 - (scoreComponents.debtToIncomeRatio - 30) / 3)
  const savingsToIncomeScore =
    scoreComponents.savingsToIncomeRatio >= 20
      ? 30
      : Math.max(0, (scoreComponents.savingsToIncomeRatio / 20) * 30)
  const expensesToIncomeScore =
    scoreComponents.expensesToIncomeRatio <= 60
      ? 20
      : Math.max(0, 20 - ((scoreComponents.expensesToIncomeRatio - 60) / 40) * 20)
  const netWorthScore =
    scoreComponents.netWorthRatio >= 1 ? 20 : Math.max(0, scoreComponents.netWorthRatio * 20)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm font-medium">Rasio Utang terhadap Pendapatan</span>
          <span className="text-sm font-medium">{Math.round(debtToIncomeScore)}/30</span>
        </div>
        <Progress value={(debtToIncomeScore / 30) * 100} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{scoreComponents.debtToIncomeRatio.toFixed(1)}%</span>
          <span>Target: &lt;30%</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm font-medium">Rasio Tabungan terhadap Pendapatan</span>
          <span className="text-sm font-medium">{Math.round(savingsToIncomeScore)}/30</span>
        </div>
        <Progress value={(savingsToIncomeScore / 30) * 100} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{scoreComponents.savingsToIncomeRatio.toFixed(1)}%</span>
          <span>Target: &gt;20%</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm font-medium">Rasio Pengeluaran terhadap Pendapatan</span>
          <span className="text-sm font-medium">{Math.round(expensesToIncomeScore)}/20</span>
        </div>
        <Progress value={(expensesToIncomeScore / 20) * 100} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{scoreComponents.expensesToIncomeRatio.toFixed(1)}%</span>
          <span>Target: &lt;60%</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm font-medium">Rasio Kekayaan Bersih</span>
          <span className="text-sm font-medium">{Math.round(netWorthScore)}/20</span>
        </div>
        <Progress value={(netWorthScore / 20) * 100} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{scoreComponents.netWorthRatio.toFixed(2)}x pendapatan tahunan</span>
          <span>Target: &gt;1x</span>
        </div>
      </div>
    </div>
  )
}
