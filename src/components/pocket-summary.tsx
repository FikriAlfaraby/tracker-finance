'use client'

import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ArrowUp, ArrowDown } from 'lucide-react'
import Link from 'next/link'

interface PocketSummaryProps {
  pockets: any[]
}

const pocketIcons: Record<string, string> = {
  money: '💰',
  bank: '🏦',
  emergency: '🚨',
  investment: '📈',
  shopping: '🛍️',
  vacation: '✈️',
  education: '📚',
  health: '🏥',
  digital: '💳',
  target: '🎯',
}

const pocketColors: Record<string, string> = {
  green: 'bg-green-100 border-green-300 text-green-800',
  blue: 'bg-blue-100 border-blue-300 text-blue-800',
  purple: 'bg-purple-100 border-purple-300 text-purple-800',
  pink: 'bg-pink-100 border-pink-300 text-pink-800',
  yellow: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  red: 'bg-red-100 border-red-300 text-red-800',
  gray: 'bg-gray-100 border-gray-300 text-gray-800',
}

const pocketTypeLabels: Record<string, string> = {
  main: 'Kantong Utama',
  savings: 'Tabungan',
  emergency: 'Dana Darurat',
  investment: 'Investasi',
  shopping: 'Belanja',
  vacation: 'Liburan',
  education: 'Pendidikan',
  health: 'Kesehatan',
  other: 'Lainnya',
}

export function PocketSummary({ pockets }: PocketSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const calculateProgress = (balance: number, target?: number) => {
    if (!target || target === 0) return 0
    return Math.min(100, (balance / target) * 100)
  }

  if (pockets.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">Anda belum memiliki kantong aktif.</p>
        <Link href="/pockets/new">
          <Button>Buat Kantong Pertama</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {pockets.map((pocket) => (
        <div
          key={pocket.id}
          className={`p-4 rounded-lg border-2 ${pocketColors[pocket.color] || 'bg-green-100 border-green-300'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{pocketIcons[pocket.icon] || '💰'}</span>
              <div>
                <h3 className="font-semibold">{pocket.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {pocketTypeLabels[pocket.pocketType] || pocket.pocketType}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold">{formatCurrency(pocket.balance || 0)}</div>
              {pocket.targetAmount > 0 && (
                <p className="text-xs text-muted-foreground">
                  dari target {formatCurrency(pocket.targetAmount)}
                </p>
              )}
            </div>
          </div>

          {pocket.targetAmount > 0 && (
            <div className="space-y-1 mt-2">
              <div className="flex justify-between text-xs">
                <span>{calculateProgress(pocket.balance, pocket.targetAmount).toFixed(1)}%</span>
                <span>{formatCurrency(pocket.targetAmount - pocket.balance)} lagi</span>
              </div>
              <Progress
                value={calculateProgress(pocket.balance, pocket.targetAmount)}
                className="h-1.5"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
