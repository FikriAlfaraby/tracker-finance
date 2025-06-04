import type { CollectionConfig } from 'payload'
import { calculateFinancialScore } from '../utils/scoreCalculator'

export const InitialEvaluations: CollectionConfig = {
  slug: 'initial-evaluations',
  admin: {
    useAsTitle: 'user',
    defaultColumns: ['user', 'income', 'expenses', 'score'],
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
      unique: true,
      admin: {
        condition: () => false,
      },
    },
    {
      name: 'income',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Pemasukan bulanan dalam Rupiah',
      },
    },
    {
      name: 'expenses',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Pengeluaran bulanan dalam Rupiah',
      },
    },
    {
      name: 'assets',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Total aset yang dimiliki dalam Rupiah',
      },
    },
    {
      name: 'liabilities',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Total utang yang dimiliki dalam Rupiah',
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
  ],
  hooks: {
    beforeChange: [
      async ({ data }) => {
        if (data.income && data.expenses && data.assets && data.liabilities) {
          data.score = calculateFinancialScore({
            income: data.income,
            expenses: data.expenses,
            assets: data.assets,
            liabilities: data.liabilities,
          })
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === 'create' || operation === 'update') {
          // Create or update financial score record
          await req.payload.create({
            collection: 'financial-scores',
            data: {
              user: doc.user,
              score: doc.score,
              evaluatedAt: new Date().toISOString(),
            },
          })
        }
      },
    ],
  },
}
