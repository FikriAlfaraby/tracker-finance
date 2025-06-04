import type { CollectionConfig } from 'payload'

export const FinancialScores: CollectionConfig = {
  slug: 'financial-scores',
  admin: {
    useAsTitle: 'score',
    defaultColumns: ['user', 'score', 'evaluatedAt'],
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
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'score',
      type: 'number',
      required: true,
      min: 0,
      max: 100,
    },
    {
      name: 'evaluatedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date(),
    },
  ],
}
