import type { CollectionConfig } from 'payload'

export const SubGoals: CollectionConfig = {
  slug: 'sub-goals',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'goal', 'allocatedAmount'],
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
      name: 'goal',
      type: 'relationship',
      relationTo: 'financial-goals',
      required: true,
      admin: {
        description: 'Tujuan keuangan utama',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Nama kantong/sub-tujuan',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Deskripsi kantong/sub-tujuan',
      },
    },
    {
      name: 'allocatedAmount',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Jumlah yang dialokasikan untuk kantong ini',
      },
    },
    {
      name: 'assetType',
      type: 'select',
      options: [
        {
          label: 'Tabungan',
          value: 'savings',
        },
        {
          label: 'Investasi Saham',
          value: 'stocks',
        },
        {
          label: 'Reksa Dana',
          value: 'mutual_funds',
        },
        {
          label: 'Emas',
          value: 'gold',
        },
        {
          label: 'Properti',
          value: 'property',
        },
        {
          label: 'Kripto',
          value: 'crypto',
        },
        {
          label: 'Lainnya',
          value: 'other',
        },
      ],
      required: true,
      admin: {
        description: 'Jenis aset untuk kantong ini',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Catatan tambahan',
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
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === 'create' || operation === 'update') {
          // Trigger recalculation of parent goal
          if (doc.goal) {
            const goal = await req.payload.findByID({
              collection: 'financial-goals',
              id: doc.goal,
            })

            if (goal) {
              // This will trigger the afterRead hook on the goal which recalculates everything
              await req.payload.findByID({
                collection: 'financial-goals',
                id: doc.goal,
              })
            }
          }
        }
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        // Trigger recalculation of parent goal
        if (doc.goal) {
          await req.payload.findByID({
            collection: 'financial-goals',
            id: doc.goal,
          })
        }
      },
    ],
  },
}
