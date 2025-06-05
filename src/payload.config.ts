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
import { SubGoals } from './collections/SubGoals'
import { FinancialGoals } from './collections/FinancialGoals'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, FinancialData, Transactions, FinancialScores, FinancialGoals, SubGoals],
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
          /* 1 — Latest financial-data */
          const financialDataResult = await payload.find({
            collection: 'financial-data',
            where: { user: { equals: user.id } },
            sort: '-createdAt',
            limit: 1,
          })

          /* 2 — Last 6 financial scores */
          const scoresResult = await payload.find({
            collection: 'financial-scores',
            where: { user: { equals: user.id } },
            sort: '-evaluatedAt',
            limit: 6,
          })

          /* 3 — Last 5 transactions */
          const transactionsResult = await payload.find({
            collection: 'transactions',
            where: { user: { equals: user.id } },
            sort: '-date',
            limit: 5,
          })

          /* 4 — User goals */
          const goalsResult = await payload.find({
            collection: 'financial-goals',
            where: { user: { equals: user.id } },
            sort: '-priority',
          })

          /* 5 — Income vs expense (current month) */
          const now = new Date()
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

          const monthlyTransactions = await payload.find({
            collection: 'transactions',
            where: {
              and: [
                { user: { equals: user.id } },
                { date: { greater_than_equal: firstDayOfMonth.toISOString() } },
              ],
            },
            pagination: false,
          })

          let monthlyIncome = 0
          let monthlyExpenses = 0
          monthlyTransactions.docs.forEach((t: any) =>
            t.type === 'income' ? (monthlyIncome += t.amount) : (monthlyExpenses += t.amount),
          )

          /* 6 — Score helpers */
          const scoreHistory = scoresResult.docs
            .map((s: any) => ({
              date: new Date(s.evaluatedAt).toLocaleDateString('id-ID', {
                month: 'short',
                day: 'numeric',
              }),
              score: s.score,
            }))
            .reverse()

          const currentScore = scoresResult.docs[0]?.score ?? 0
          const scoreComponents = scoresResult.docs[0]
            ? {
                debtToIncomeRatio: scoresResult.docs[0].debtToIncomeRatio,
                savingsToIncomeRatio: scoresResult.docs[0].savingsToIncomeRatio,
                expensesToIncomeRatio: scoresResult.docs[0].expensesToIncomeRatio,
                netWorthRatio: scoresResult.docs[0].netWorthRatio,
              }
            : null

          /* 7 — Flatten latest “financial-data” */
          const financialData = financialDataResult.docs[0]
            ? {
                monthlyIncome: financialDataResult.docs[0].monthlyIncome,
                monthlyExpenses: financialDataResult.docs[0].monthlyExpenses,
                totalAssets: financialDataResult.docs[0].totalAssets,
                totalLiabilities: financialDataResult.docs[0].totalLiabilities,
                netWorth: financialDataResult.docs[0].netWorth,
              }
            : null

          /* 8 — Goals ↔ sub-goals */
          const goals = await Promise.all(
            goalsResult.docs.map(async (goal: any) => {
              const subGoalsResult = await payload.find({
                collection: 'sub-goals',
                where: { goal: { equals: goal.id } },
                pagination: false,
              })

              return {
                id: goal.id,
                name: goal.name,
                description: goal.description,
                targetAmount: goal.targetAmount,
                targetDate: goal.targetDate,
                priority: goal.priority,
                currentTotalAllocation: goal.currentTotalAllocation,
                progress: goal.progress,
                requiredMonthlySavings: goal.requiredMonthlySavings,
                estimatedCompletionDate: goal.estimatedCompletionDate,
                subGoals: subGoalsResult.docs.map((sg: any) => ({
                  id: sg.id,
                  name: sg.name,
                  description: sg.description,
                  allocatedAmount: sg.allocatedAmount,
                  assetType: sg.assetType,
                  notes: sg.notes,
                })),
              }
            }),
          )

          /* 9 — Final response */
          return Response.json({
            currentScore,
            scoreComponents,
            scoreHistory,
            financialData,
            monthlyIncome,
            monthlyExpenses,
            totalTransactions: transactionsResult.totalDocs,
            recentTransactions: transactionsResult.docs.map((t: any) => ({
              id: t.id,
              type: t.type,
              category: t.category,
              amount: t.amount,
              date: t.date,
              description: t.description,
              relatedGoal: t.relatedGoal,
              relatedSubGoal: t.relatedSubGoal,
            })),
            goals,
          })
        } catch (error) {
          console.error('Dashboard error:', error)
          return Response.json({ message: 'Internal server error' })
        }
      },
    },
  ],
})
