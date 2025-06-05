import type { CollectionConfig } from 'payload'
import { calculateGoalProgress } from '../utils/goalCalculator'

export const FinancialGoals: CollectionConfig = {
  slug: 'financial-goals',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'targetAmount', 'targetDate', 'progress'],
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
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Nama tujuan keuangan',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Deskripsi tujuan keuangan',
      },
    },
    {
      name: 'targetAmount',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Jumlah target yang ingin dicapai',
      },
    },
    {
      name: 'targetDate',
      type: 'date',
      admin: {
        description: 'Tanggal target pencapaian (opsional)',
      },
    },
    {
      name: 'priority',
      type: 'select',
      options: [
        {
          label: 'Rendah',
          value: 'low',
        },
        {
          label: 'Sedang',
          value: 'medium',
        },
        {
          label: 'Tinggi',
          value: 'high',
        },
      ],
      defaultValue: 'medium',
      required: true,
    },
    {
      name: 'currentTotalAllocation',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Total alokasi saat ini dari semua kantong',
      },
    },
    {
      name: 'progress',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Persentase kemajuan (0-100)',
      },
    },
    {
      name: 'requiredMonthlySavings',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Tabungan bulanan yang diperlukan untuk mencapai tujuan',
      },
    },
    {
      name: 'estimatedCompletionDate',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Perkiraan tanggal pencapaian berdasarkan alokasi saat ini',
      },
    },
    {
      name: 'createdAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
      defaultValue: () => new Date(),
    },
  ],
  hooks: {
    afterRead: [
      async ({ doc, req }) => {
        if (req) {
          try {
            // Calculate total allocation from sub-goals
            const subGoals = await req.payload.find({
              collection: 'sub-goals',
              where: {
                goal: {
                  equals: doc.id,
                },
              },
            })

            let totalAllocation = 0
            if (subGoals.docs && subGoals.docs.length > 0) {
              totalAllocation = subGoals.docs.reduce(
                (sum, subGoal) => sum + (subGoal.allocatedAmount || 0),
                0,
              )
            }

            // Calculate progress and other metrics
            const { progress, requiredMonthlySavings, estimatedCompletionDate } =
              calculateGoalProgress({
                targetAmount: doc.targetAmount,
                currentAmount: totalAllocation,
                targetDate: doc.targetDate ? new Date(doc.targetDate) : null,
              })

            // Update the document with calculated values
            await req.payload.update({
              collection: 'financial-goals',
              id: doc.id,
              data: {
                currentTotalAllocation: totalAllocation,
                progress,
                requiredMonthlySavings,
                estimatedCompletionDate: estimatedCompletionDate?.toISOString(),
              },
            })

            // Return updated values
            return {
              ...doc,
              currentTotalAllocation: totalAllocation,
              progress,
              requiredMonthlySavings,
              estimatedCompletionDate,
            }
          } catch (error) {
            console.error('Error calculating goal progress:', error)
          }
        }
        return doc
      },
    ],
  },
}
