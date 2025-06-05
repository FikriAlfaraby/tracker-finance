// src/collections/Users.ts
import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',

  auth: {
    tokenExpiration: 60 * 60 * 24,
    verify: false,
    maxLoginAttempts: 10,
    lockTime: 10 * 60 * 1000, // 10 menit
  },

  /* ---------- ADMIN PANEL ---------- */
  admin: {
    useAsTitle: 'email',
  },

  /* ---------- ACCESS ---------- */
  access: {
    // admin bisa baca semua, user biasa hanya dirinya sendiri
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return {
        id: { equals: user?.id },
      }
    },
    create: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    {
      name: 'role',
      type: 'select',
      options: [
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'User',
          value: 'user',
        },
      ],
      defaultValue: 'user',
      required: true,
      admin: {
        condition: (data) => data?.role === 'admin',
      },
    },
  ],
}
