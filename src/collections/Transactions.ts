import type { CollectionConfig } from 'payload'
import { recalculateFinancialData } from '../utils/scoreCalculator'

export const Transactions: CollectionConfig = {
  slug: 'transactions',
  admin: {
    useAsTitle: 'description',
    defaultColumns: ['user', 'type', 'category', 'amount', 'sourcePocket', 'date'],
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
      name: 'sourcePocket',
      type: 'relationship',
      relationTo: 'pockets',
      required: true,
      admin: {
        description: 'Kantong sumber dana untuk transaksi ini',
      },
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
  ],
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        // Validate pocket balance for expenses
        if (data.type === 'expense' && data.sourcePocket && data.amount) {
          try {
            const pocket = await req.payload.findByID({
              collection: 'pockets',
              id: data.sourcePocket,
            })

            if (pocket?.balance !== undefined && (pocket?.balance || 0) < data.amount) {
              throw new Error(
                `Saldo kantong ${pocket?.name || 'unknown'} tidak mencukupi. Saldo: Rp ${pocket?.balance?.toLocaleString('id-ID') || '0'}, Dibutuhkan: Rp ${data.amount.toLocaleString('id-ID')}`,
              )
            }
          } catch (error) {
            throw error
          }
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === 'create') {
          try {
            // Update source pocket balance
            if (doc.sourcePocket) {
              const pocket = await req.payload.findByID({
                collection: 'pockets',
                id: doc.sourcePocket.id,
              })

              if (pocket) {
                let newBalance = pocket?.balance || 0

                if (doc.type === 'income') {
                  // Add to pocket for income
                  newBalance = (pocket?.balance || 0) + doc.amount
                } else if (doc.type === 'expense') {
                  // Subtract from pocket for expense
                  newBalance = Math.max(0, (pocket?.balance || 0) - doc.amount)
                }

                await req.payload.update({
                  collection: 'pockets',
                  id: doc.sourcePocket.id,
                  data: {
                    balance: newBalance,
                  },
                })
              }
            }

            // Recalculate financial data
            await recalculateFinancialData(doc.user, req.payload)
          } catch (error) {
            console.error('Error updating balances after transaction:', error)
          }
        }
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        try {
          // Reverse the pocket balance change
          if (doc.sourcePocket) {
            const pocket = await req.payload.findByID({
              collection: 'pockets',
              id: doc.sourcePocket.id,
            })

            if (pocket) {
              let newBalance = pocket?.balance || 0

              if (doc.type === 'income') {
                // Subtract back the income
                newBalance = Math.max(0, (pocket?.balance || 0) - doc.amount)
              } else if (doc.type === 'expense') {
                // Add back the expense
                newBalance = pocket.balance + doc.amount
              }

              await req.payload.update({
                collection: 'pockets',
                id: doc.sourcePocket.id,
                data: {
                  balance: newBalance,
                },
              })
            }
          }

          await recalculateFinancialData(doc.user, req.payload)
        } catch (error) {
          console.error('Error reversing balances after transaction deletion:', error)
        }
      },
    ],
  },
}
