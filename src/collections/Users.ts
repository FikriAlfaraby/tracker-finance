// src/collections/Users.ts
import type { CollectionConfig } from 'payload' // ★ gunakan 'payload/types' di v3

export const Users: CollectionConfig = {
  slug: 'users',

  /* ---------- AUTH ---------- */
  auth: {
    tokenExpiration: 60 * 60 * 2, // 2 jam (dalam detik)
    verify: false,
    maxLoginAttempts: 5,
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

  /* ---------- FIELDS ---------- */
  fields: [
    { name: 'name', type: 'text', required: true },

    { name: 'email', type: 'email', required: true, unique: true },

    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
      ],
      defaultValue: 'user',
      required: true,
      admin: {
        // ★ v3: arg ke-3 = { user }
        condition: (_data, _siblingData, { user }) => user?.role === 'admin',
      },
    },
  ],

  /* ---------- CUSTOM ENDPOINTS ---------- */
  endpoints: [
    {
      path: '/dashboard',
      method: 'get',
      handler: async (req) => {
        const { user, payload } = req
        if (!user) return Response.json({ message: 'Unauthorized' })

        try {
          /* 1 — Latest initial evaluation */
          const evaluation = await payload.find({
            collection: 'initial-evaluations',
            where: { user: { equals: user.id } },
            limit: 1,
          })

          /* 2 — Last 6 financial scores */
          const scores = await payload.find({
            collection: 'financial-scores',
            where: { user: { equals: user.id } },
            sort: '-evaluatedAt',
            limit: 6,
          })

          /* 3 — Last 5 transactions */
          const recentTx = await payload.find({
            collection: 'transactions',
            where: { user: { equals: user.id } },
            sort: '-date',
            limit: 5,
          })

          /* 4 — Income vs expense bulan berjalan */
          const startOfMonth = new Date()
          startOfMonth.setDate(1)
          startOfMonth.setHours(0, 0, 0, 0)

          const monthTx = await payload.find({
            collection: 'transactions',
            where: {
              and: [
                { user: { equals: user.id } },
                { date: { greater_than_equal: startOfMonth.toISOString() } },
              ],
            },
            pagination: false,
          })

          let monthlyIncome = 0,
            monthlyExpenses = 0
          monthTx.docs.forEach((t) =>
            t.type === 'income' ? (monthlyIncome += t.amount) : (monthlyExpenses += t.amount),
          )

          /* 5 — Format score history */
          const scoreHistory = scores.docs
            .map((s) => ({
              date: new Date(s.evaluatedAt).toLocaleDateString('id-ID', {
                month: 'short',
                day: 'numeric',
              }),
              score: s.score,
            }))
            .reverse()

          return Response.json({
            currentScore: scores.docs[0]?.score ?? 0,
            scoreHistory,
            monthlyIncome,
            monthlyExpenses,
            totalTransactions: recentTx.totalDocs,
            recentTransactions: recentTx.docs.map((t) => ({
              id: t.id,
              type: t.type,
              category: t.category,
              amount: t.amount,
              date: t.date,
              description: t.description,
            })),
            latestEvaluation: evaluation.docs[0] ?? null,
          })
        } catch (err) {
          console.error('Dashboard error:', err)
          return Response.json({ message: 'Internal server error' }, { status: 500 })
        }
      },
    },
  ],
}
