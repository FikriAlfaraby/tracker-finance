import type { CollectionConfig } from 'payload'

export const Pockets: CollectionConfig = {
  slug: 'pockets',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'user', 'balance', 'pocketType', 'isActive'],
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
        description: 'Nama kantong (contoh: Kantong Utama, Tabungan, Dana Darurat)',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Deskripsi tujuan kantong ini',
      },
    },
    {
      name: 'balance',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Saldo saat ini dalam kantong',
      },
    },
    {
      name: 'pocketType',
      type: 'select',
      options: [
        {
          label: 'Kantong Utama',
          value: 'main',
        },
        {
          label: 'Tabungan',
          value: 'savings',
        },
        {
          label: 'Dana Darurat',
          value: 'emergency',
        },
        {
          label: 'Investasi',
          value: 'investment',
        },
        {
          label: 'Belanja',
          value: 'shopping',
        },
        {
          label: 'Liburan',
          value: 'vacation',
        },
        {
          label: 'Pendidikan',
          value: 'education',
        },
        {
          label: 'Kesehatan',
          value: 'health',
        },
        {
          label: 'Lainnya',
          value: 'other',
        },
      ],
      required: true,
      defaultValue: 'other',
    },
    {
      name: 'targetAmount',
      type: 'number',
      min: 0,
      admin: {
        description: 'Target jumlah untuk kantong ini (opsional)',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Apakah kantong ini aktif',
      },
    },
    {
      name: 'icon',
      type: 'select',
      options: [
        { label: '💰 Uang', value: 'money' },
        { label: '🏦 Bank', value: 'bank' },
        { label: '🚨 Darurat', value: 'emergency' },
        { label: '📈 Investasi', value: 'investment' },
        { label: '🛍️ Belanja', value: 'shopping' },
        { label: '✈️ Liburan', value: 'vacation' },
        { label: '📚 Pendidikan', value: 'education' },
        { label: '🏥 Kesehatan', value: 'health' },
        { label: '💳 Digital', value: 'digital' },
        { label: '🎯 Target', value: 'target' },
      ],
      defaultValue: 'money',
    },
    {
      name: 'color',
      type: 'select',
      options: [
        { label: 'Hijau', value: 'green' },
        { label: 'Biru', value: 'blue' },
        { label: 'Ungu', value: 'purple' },
        { label: 'Pink', value: 'pink' },
        { label: 'Kuning', value: 'yellow' },
        { label: 'Merah', value: 'red' },
        { label: 'Abu-abu', value: 'gray' },
      ],
      defaultValue: 'green',
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
        // Create default pockets for new users
        if (operation === 'create' && doc.pocketType === 'main') {
          try {
            // Create default emergency fund pocket
            await req.payload.create({
              collection: 'pockets',
              data: {
                user: doc.user,
                name: 'Dana Darurat',
                description: 'Kantong untuk dana darurat dan kebutuhan mendesak',
                balance: 0,
                pocketType: 'emergency',
                targetAmount: 50000000, // 50 juta default
                isActive: true,
                icon: 'emergency',
                color: 'red',
              },
            })

            // Create default savings pocket
            await req.payload.create({
              collection: 'pockets',
              data: {
                user: doc.user,
                name: 'Tabungan',
                description: 'Kantong untuk tabungan umum',
                balance: 0,
                pocketType: 'savings',
                isActive: true,
                icon: 'bank',
                color: 'blue',
              },
            })
          } catch (error) {
            console.error('Error creating default pockets:', error)
          }
        }
      },
    ],
  },
}
