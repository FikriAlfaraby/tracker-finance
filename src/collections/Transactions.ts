import type { CollectionConfig } from 'payload'
import { recalculateFinancialData } from '../utils/scoreCalculator'

export const Transactions: CollectionConfig = {
  slug: 'transactions',
  admin: {
    useAsTitle: 'description',
    defaultColumns: ['user', 'type', 'category', 'amount', 'date'],
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
    delete: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return {
        user: {
          equals: user?.id,
        },
      }
    },
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
      name: 'type',
      type: 'select',
      options: [
        {
          label: 'Pemasukan',
          value: 'income',
        },
        {
          label: 'Pengeluaran',
          value: 'expense',
        },
      ],
      required: true,
    },
    {
      name: 'category',
      type: 'select',
      options: [
        // Income categories
        { label: 'Gaji', value: 'salary' },
        { label: 'Freelance', value: 'freelance' },
        { label: 'Investasi', value: 'investment' },
        { label: 'Bonus', value: 'bonus' },
        { label: 'Lainnya (Pemasukan)', value: 'other-income' },
        // Expense categories
        { label: 'Makanan', value: 'food' },
        { label: 'Transportasi', value: 'transportation' },
        { label: 'Belanja', value: 'shopping' },
        { label: 'Tagihan', value: 'bills' },
        { label: 'Hiburan', value: 'entertainment' },
        { label: 'Kesehatan', value: 'health' },
        { label: 'Pendidikan', value: 'education' },
        { label: 'Lainnya (Pengeluaran)', value: 'other-expense' },
      ],
      required: true,
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      defaultValue: () => new Date(),
    },
    {
      name: 'description',
      type: 'text',
      admin: {
        description: 'Deskripsi transaksi',
      },
    },
    {
      name: 'relatedGoal',
      type: 'relationship',
      relationTo: 'financial-goals',
      admin: {
        description: 'Tujuan keuangan terkait (opsional)',
      },
    },
    {
      name: 'relatedSubGoal',
      type: 'relationship',
      relationTo: 'sub-goals',
      admin: {
        description: 'Kantong/sub-tujuan terkait (opsional)',
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === 'create' || operation === 'update') {
          await recalculateFinancialData(doc.user, req.payload)

          // Update goal and sub-goal if related
          if (doc.relatedSubGoal) {
            const subGoal = await req.payload.findByID({
              collection: 'sub-goals',
              id: doc.relatedSubGoal,
            })

            if (subGoal) {
              let newAllocatedAmount = subGoal.allocatedAmount || 0

              if (doc.type === 'income') {
                newAllocatedAmount += doc.amount
              } else if (doc.type === 'expense') {
                newAllocatedAmount = Math.max(0, newAllocatedAmount - doc.amount)
              }

              await req.payload.update({
                collection: 'sub-goals',
                id: doc.relatedSubGoal,
                data: {
                  allocatedAmount: newAllocatedAmount,
                },
              })
            }
          }
        }
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        await recalculateFinancialData(doc.user, req.payload)
      },
    ],
  },
}
