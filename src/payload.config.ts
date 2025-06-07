// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Transactions } from './collections/Transactions'
import { FinancialScores } from './collections/FinancialScores'
import { FinancialData } from './collections/FinancialData'
import { Pockets } from './collections/Pockets'
import { PocketTransactions } from './collections/PocketTransaction'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, FinancialData, Transactions, FinancialScores, Pockets, PocketTransactions],
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
        const { user } = req
        const payload = req.payload // instance Payload

        if (!user) {
          return Response.json({ message: 'Unauthorized' })
        }

        try {
          // Get latest financial data
          const financialDataResult = await payload.find({
            collection: 'financial-data',
            where: {
              user: {
                equals: user.id,
              },
            },
            sort: '-createdAt',
            limit: 1,
          })

          // Get financial scores with better error handling
          const scoresResult = await payload.find({
            collection: 'financial-scores',
            where: {
              user: {
                equals: user.id,
              },
            },
            sort: '-evaluatedAt',
            limit: 12, // Get more data points
          })

          console.log('Raw scores data:', scoresResult.docs)

          // Format score history data with better date formatting
          let scoreHistory = []
          if (scoresResult.docs && scoresResult.docs.length > 0) {
            scoreHistory = scoresResult.docs
              .map((score: any) => {
                const date = new Date(score.evaluatedAt)
                return {
                  date: date.toLocaleDateString('id-ID', {
                    month: 'short',
                    day: 'numeric',
                  }),
                  score: score.score || 0,
                  fullDate: score.evaluatedAt,
                }
              })
              .reverse() // Show oldest to newest
          } else {
            // If no scores exist, create sample data points
            const now = new Date()
            for (let i = 5; i >= 0; i--) {
              const date = new Date(now)
              date.setMonth(date.getMonth() - i)
              scoreHistory.push({
                date: date.toLocaleDateString('id-ID', {
                  month: 'short',
                  day: 'numeric',
                }),
                score: 0,
                fullDate: date.toISOString(),
              })
            }
          }

          console.log('Formatted score history:', scoreHistory)

          // Get current score with fallback
          const currentScore = scoresResult.docs.length > 0 ? scoresResult.docs[0].score : 0

          const scoreComponents =
            scoresResult.docs.length > 0
              ? {
                  debtToIncomeRatio: scoresResult.docs[0].debtToIncomeRatio,
                  savingsToIncomeRatio: scoresResult.docs[0].savingsToIncomeRatio,
                  expensesToIncomeRatio: scoresResult.docs[0].expensesToIncomeRatio,
                  netWorthRatio: scoresResult.docs[0].netWorthRatio,
                }
              : null

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

          // Get recent pocket transactions
          const pocketTransactionsResult = await payload.find({
            collection: 'pocket-transactions',
            where: {
              user: {
                equals: user.id,
              },
            },
            sort: '-date',
            limit: 5,
          })

          // Process pocket transactions to include pocket names
          const pocketTransactions = await Promise.all(
            pocketTransactionsResult.docs.map(async (transaction: any) => {
              let fromPocketName = ''
              let toPocketName = ''

              if (transaction.fromPocket) {
                // Handle both object and string ID
                const fromPocketId =
                  typeof transaction.fromPocket === 'object'
                    ? transaction.fromPocket.id
                    : transaction.fromPocket

                try {
                  const fromPocket = await payload.findByID({
                    collection: 'pockets',
                    id: fromPocketId,
                  })
                  fromPocketName = fromPocket?.name || 'Unknown'
                } catch (error) {
                  console.error('Error fetching fromPocket:', error)
                  fromPocketName = 'Unknown'
                }
              }

              if (transaction.toPocket) {
                // Handle both object and string ID
                const toPocketId =
                  typeof transaction.toPocket === 'object'
                    ? transaction.toPocket.id
                    : transaction.toPocket

                try {
                  const toPocket = await payload.findByID({
                    collection: 'pockets',
                    id: toPocketId,
                  })
                  toPocketName = toPocket?.name || 'Unknown'
                } catch (error) {
                  console.error('Error fetching toPocket:', error)
                  toPocketName = 'Unknown'
                }
              }

              return {
                ...transaction,
                fromPocketName,
                toPocketName,
              }
            }),
          )

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

          // Get financial data
          const financialData =
            financialDataResult.docs.length > 0
              ? {
                  monthlyIncome: financialDataResult.docs[0].monthlyIncome,
                  monthlyExpenses: financialDataResult.docs[0].monthlyExpenses,
                  totalAssets: financialDataResult.docs[0].totalAssets,
                  totalLiabilities: financialDataResult.docs[0].totalLiabilities,
                  netWorth: financialDataResult.docs[0].netWorth,
                }
              : null

          // Process transactions to include pocket names
          const transactions = await Promise.all(
            transactionsResult.docs.map(async (transaction: any) => {
              let sourcePocketName = ''

              if (transaction.sourcePocket) {
                // Handle both object and string ID
                const sourcePocketId =
                  typeof transaction.sourcePocket === 'object'
                    ? transaction.sourcePocket.id
                    : transaction.sourcePocket

                try {
                  const sourcePocket = await payload.findByID({
                    collection: 'pockets',
                    id: sourcePocketId,
                  })
                  sourcePocketName = sourcePocket?.name || 'Unknown'
                } catch (error) {
                  console.error('Error fetching sourcePocket:', error)
                  sourcePocketName = 'Unknown'
                }
              }

              return {
                id: transaction.id,
                type: transaction.type,
                category: transaction.category,
                amount: transaction.amount,
                date: transaction.date,
                description: transaction.description,
                relatedGoal: transaction.relatedGoal,
                relatedSubGoal: transaction.relatedSubGoal,
                sourcePocket: transaction.sourcePocket,
                sourcePocketName,
              }
            }),
          )

          return Response.json({
            currentScore,
            scoreComponents,
            scoreHistory,
            financialData,
            monthlyIncome,
            monthlyExpenses,
            totalTransactions: transactionsResult.totalDocs,
            recentTransactions: transactions,
            recentPocketTransactions: pocketTransactions,
          })
        } catch (error) {
          console.error('Dashboard error:', error)
          return Response.json({ message: 'Internal server error' })
        }
      },
    },
  ],
})
