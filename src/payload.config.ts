// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Transactions } from './collections/Transactions'
import { InitialEvaluations } from './collections/InitialEvaluations'
import { FinancialScores } from './collections/FinancialScores'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Transactions, InitialEvaluations, FinancialScores],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
  ],
  endpoints: [
    {
      path: '/dashboard',
      method: 'get',
      handler: async (req) => {
        try {
          const user = req.user
          if (!user) {
            return Response.json({ message: 'Unauthorized', status: 401 })
          }

          const payload = req.payload

          const evaluationResult = await payload.find({
            collection: 'initial-evaluations',
            where: {
              user: {
                equals: user.id,
              },
            },
            limit: 1,
          })

          const scoresResult = await payload.find({
            collection: 'financial-scores',
            where: {
              user: {
                equals: user.id,
              },
            },
            sort: '-evaluatedAt',
            limit: 6,
          })

          // Get recent transactions
          const transactionsResult = await payload.find({
            collection: 'transactions',
            where: {
              user: {
                equals: user.id,
              },
            },
            sort: '-date',
            limit: 5,
          })

          // Calculate monthly income and expenses
          const now = new Date()
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

          const monthlyTransactions = await payload.find({
            collection: 'transactions',
            where: {
              and: [
                {
                  user: {
                    equals: user.id,
                  },
                },
                {
                  date: {
                    greater_than_equal: firstDayOfMonth.toISOString(),
                  },
                },
              ],
            },
          })

          let monthlyIncome = 0
          let monthlyExpenses = 0

          monthlyTransactions.docs.forEach((transaction: any) => {
            if (transaction.type === 'income') {
              monthlyIncome += transaction.amount
            } else {
              monthlyExpenses += transaction.amount
            }
          })

          // Format score history data
          const scoreHistory = scoresResult.docs
            .map((score: any) => ({
              date: new Date(score.evaluatedAt).toLocaleDateString('id-ID', {
                month: 'short',
                day: 'numeric',
              }),
              score: score.score,
            }))
            .reverse()

          // Get current score
          const currentScore = scoresResult.docs.length > 0 ? scoresResult.docs[0].score : 0

          // Return response
          return Response.json({
            currentScore,
            scoreHistory,
            monthlyIncome,
            monthlyExpenses,
            totalTransactions: transactionsResult.totalDocs,
            recentTransactions: transactionsResult.docs.map((transaction: any) => ({
              id: transaction.id,
              type: transaction.type,
              category: transaction.category,
              amount: transaction.amount,
              date: transaction.date,
              description: transaction.description,
            })),
          })
        } catch (error) {
          console.error('Dashboard error:', error)
          return Response.json({ message: 'Internal server error' })
        }
      },
    },
  ],
})
