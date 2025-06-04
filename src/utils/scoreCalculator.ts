interface FinancialData {
  income: number
  expenses: number
  assets: number
  liabilities: number
}

export function calculateFinancialScore(data: FinancialData): number {
  const { income, expenses, assets, liabilities } = data

  // Formula skor keuangan (0-100)
  // 1. Rasio tabungan (30%): (income - expenses) / income
  // 2. Rasio utang terhadap aset (25%): liabilities / assets
  // 3. Rasio pengeluaran terhadap pemasukan (25%): expenses / income
  // 4. Net worth relatif (20%): (assets - liabilities) / income

  let score = 0

  // 1. Savings ratio (30 points max)
  const savingsRatio = income > 0 ? (income - expenses) / income : 0
  const savingsScore = Math.max(0, Math.min(30, savingsRatio * 30))
  score += savingsScore

  // 2. Debt to asset ratio (25 points max) - lower is better
  const debtRatio = assets > 0 ? liabilities / assets : 1
  const debtScore = Math.max(0, 25 - debtRatio * 25)
  score += debtScore

  // 3. Expense ratio (25 points max) - lower is better
  const expenseRatio = income > 0 ? expenses / income : 1
  const expenseScore = Math.max(0, 25 - expenseRatio * 25)
  score += expenseScore

  // 4. Net worth relative to income (20 points max)
  const netWorth = assets - liabilities
  const netWorthRatio = income > 0 ? netWorth / (income * 12) : 0 // Annual income
  const netWorthScore = Math.max(0, Math.min(20, netWorthRatio * 20))
  score += netWorthScore

  return Math.round(Math.max(0, Math.min(100, score)))
}

export async function recalculateFinancialScore(userId: string, payload: any) {
  try {
    // Get latest evaluation
    const evaluation = await payload.find({
      collection: 'initial-evaluations',
      where: {
        user: {
          equals: userId,
        },
      },
      limit: 1,
    })

    if (!evaluation.docs.length) return

    const evalData = evaluation.docs[0]

    // Get all transactions for this user
    const transactions = await payload.find({
      collection: 'transactions',
      where: {
        user: {
          equals: userId,
        },
      },
      limit: 1000, // Adjust as needed
    })

    // Calculate updated financial data based on transactions
    let totalIncome = evalData.income
    let totalExpenses = evalData.expenses

    transactions.docs.forEach((transaction: any) => {
      if (transaction.type === 'income') {
        totalIncome += transaction.amount
      } else {
        totalExpenses += transaction.amount
      }
    })

    // Recalculate score with updated data
    const newScore = calculateFinancialScore({
      income: totalIncome,
      expenses: totalExpenses,
      assets: evalData.assets,
      liabilities: evalData.liabilities,
    })

    // Create new financial score record
    await payload.create({
      collection: 'financial-scores',
      data: {
        user: userId,
        score: newScore,
        evaluatedAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Error recalculating financial score:', error)
  }
}
