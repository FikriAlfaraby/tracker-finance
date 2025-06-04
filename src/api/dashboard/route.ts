import { type NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayloadHMR({ config: configPromise })

    // Get user from JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('JWT ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(4)
    const user = await payload.verifyToken(token)

    if (!user) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
    }

    // Get latest evaluation
    const evaluationResult = await payload.find({
      collection: 'initial-evaluations',
      where: {
        user: {
          equals: user.id,
        },
      },
      limit: 1,
    })

    // Get financial scores
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

    return NextResponse.json({
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
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
