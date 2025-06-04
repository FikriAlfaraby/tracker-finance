import type { CollectionConfig } from 'payload'
import { recalculateFinancialScore } from '../utils/scoreCalculator'

export const Transactions: CollectionConfig = {
  slug: 'transactions',
  admin: {
    useAsTitle: 'category',
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
        { label: 'Lainnya', value: 'other-income' },
        // Expense categories
        { label: 'Makanan', value: 'food' },
        { label: 'Transportasi', value: 'transportation' },
        { label: 'Belanja', value: 'shopping' },
        { label: 'Tagihan', value: 'bills' },
        { label: 'Hiburan', value: 'entertainment' },
        { label: 'Kesehatan', value: 'health' },
        { label: 'Pendidikan', value: 'education' },
        { label: 'Lainnya', value: 'other-expense' },
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
      type: 'textarea',
      admin: {
        description: 'Deskripsi opsional untuk transaksi',
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === 'create' || operation === 'update') {
          await recalculateFinancialScore(doc.user, req.payload)
        }
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        await recalculateFinancialScore(doc.user, req.payload)
      },
    ],
  },
}
