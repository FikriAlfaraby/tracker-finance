import type { CollectionConfig } from 'payload'
import { calculateFinancialScore, getScoreComponents } from '../utils/scoreCalculator'

export const FinancialData: CollectionConfig = {
  slug: 'financial-data',
  admin: {
    useAsTitle: 'user',
    defaultColumns: [
      'user',
      'monthlyIncome',
      'monthlyExpenses',
      'totalAssets',
      'totalLiabilities',
      'score',
    ],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return {
        user: {
          equals: user?.id,
        },
      }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return {
        user: {
          equals: user?.id,
        },
      }
    },
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        condition: () => false,
      },
    },
    {
      name: 'monthlyIncome',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Pemasukan bulanan',
      },
    },
    {
      name: 'monthlyExpenses',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Pengeluaran bulanan',
      },
    },
    {
      name: 'totalAssets',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Total aset yang dimiliki',
      },
    },
    {
      name: 'totalLiabilities',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Total utang yang dimiliki',
      },
    },
    {
      name: 'netWorth',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Kekayaan bersih (total aset - total utang)',
      },
    },
    {
      name: 'score',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Skor keuangan yang dihitung otomatis',
      },
    },
    {
      name: 'createdAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data }) => {
        if (data.totalAssets && data.totalLiabilities) {
          data.netWorth = data.totalAssets - data.totalLiabilities
        }

        if (
          data.monthlyIncome &&
          data.monthlyExpenses &&
          data.totalAssets &&
          data.totalLiabilities
        ) {
          data.score = calculateFinancialScore({
            monthlyIncome: data.monthlyIncome,
            monthlyExpenses: data.monthlyExpenses,
            totalAssets: data.totalAssets,
            totalLiabilities: data.totalLiabilities,
          })
        }

        if (!data.createdAt) {
          data.createdAt = new Date()
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === 'create' || operation === 'update') {
          // Get score components
          const scoreComponents = getScoreComponents({
            monthlyIncome: doc.monthlyIncome,
            monthlyExpenses: doc.monthlyExpenses,
            totalAssets: doc.totalAssets,
            totalLiabilities: doc.totalLiabilities,
          })

          // Create or update financial score record with all components
          await req.payload.create({
            collection: 'financial-scores',
            data: {
              user: doc.user,
              score: doc.score,
              evaluatedAt: new Date().toISOString(),
              debtToIncomeRatio: scoreComponents.debtToIncomeRatio,
              savingsToIncomeRatio: scoreComponents.savingsToIncomeRatio,
              expensesToIncomeRatio: scoreComponents.expensesToIncomeRatio,
              netWorthRatio: scoreComponents.netWorthRatio,
            },
          })
        }
      },
    ],
  },
}
