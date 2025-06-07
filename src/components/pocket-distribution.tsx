'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface PocketDistributionProps {
  pockets: any[]
}

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#8dd1e1',
]

export function PocketDistribution({ pockets }: PocketDistributionProps) {
  // Filter out pockets with zero balance
  const pocketsWithBalance = pockets.filter((pocket) => pocket.balance > 0)

  // Format data for pie chart
  const data = pocketsWithBalance.map((pocket, index) => ({
    name: pocket.name,
    value: pocket.balance,
    color: COLORS[index % COLORS.length],
    icon: pocket.icon,
  }))

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const totalBalance = pockets.reduce((sum, pocket) => sum + (pocket.balance || 0), 0)

  if (pockets.length === 0 || totalBalance === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-center">
        <p className="text-muted-foreground">Belum ada data kantong untuk ditampilkan</p>
      </div>
    )
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            labelFormatter={(name) => `Kantong: ${name}`}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
