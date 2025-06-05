interface FinancialData {
  monthlyIncome: number
  monthlyExpenses: number
  totalAssets: number
  totalLiabilities: number
}

interface ScoreComponents {
  debtToIncomeRatio: number
  savingsToIncomeRatio: number
  expensesToIncomeRatio: number
  netWorthRatio: number
  debtToIncomeScore: number
  savingsToIncomeScore: number
  expensesToIncomeScore: number
  netWorthScore: number
}

export function calculateFinancialScore(data: FinancialData): number {
  const { monthlyIncome, monthlyExpenses, totalAssets, totalLiabilities } = data
  const annualIncome = monthlyIncome * 12

  // Calculate ratios
  const debtToIncomeRatio = annualIncome > 0 ? (totalLiabilities / annualIncome) * 100 : 100
  const savingsToIncomeRatio = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0
  const expensesToIncomeRatio = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 100
  const netWorthRatio = annualIncome > 0 ? (totalAssets - totalLiabilities) / annualIncome : 0

  // Calculate scores for each component
  // 1. Debt-to-Income Ratio (30 points) - lower is better
  // Ideal: < 30%
  const debtToIncomeScore = debtToIncomeRatio <= 30 ? 30 : Math.max(0, 30 - (debtToIncomeRatio - 30) / 3)

  // 2. Savings-to-Income Ratio (30 points) - higher is better
  // Ideal: > 20%
  const savingsToIncomeScore = savingsToIncomeRatio >= 20 ? 30 : Math.max(0, (savingsToIncomeRatio / 20) * 30)

  // 3. Expenses-to-Income Ratio (20 points) - lower is better
  // Ideal: < 60%
  const expensesToIncomeScore =
    expensesToIncomeRatio <= 60 ? 20 : Math.max(0, 20 - ((expensesToIncomeRatio - 60) / 40) * 20)

  // 4. Net Worth Ratio (20 points) - higher is better
  // Ideal: > 1 year of income
  const netWorthScore = netWorthRatio >= 1 ? 20 : Math.max(0, netWorthRatio * 20)

  // Calculate total score (0-100)
  const totalScore = Math.round(debtToIncomeScore + savingsToIncomeScore + expensesToIncomeScore + netWorthScore)

  return Math.max(0, Math.min(100, totalScore))
}

export function getScoreComponents(data: FinancialData): ScoreComponents {
  const { monthlyIncome, monthlyExpenses, totalAssets, totalLiabilities } = data
  const annualIncome = monthlyIncome * 12

  // Calculate ratios
  const debtToIncomeRatio = annualIncome > 0 ? (totalLiabilities / annualIncome) * 100 : 100
  const savingsToIncomeRatio = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0
  const expensesToIncomeRatio = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 100
  const netWorthRatio = annualIncome > 0 ? (totalAssets - totalLiabilities) / annualIncome : 0

  // Calculate scores for each component
  const debtToIncomeScore = debtToIncomeRatio <= 30 ? 30 : Math.max(0, 30 - (debtToIncomeRatio - 30) / 3)
  const savingsToIncomeScore = savingsToIncomeRatio >= 20 ? 30 : Math.max(0, (savingsToIncomeRatio / 20) * 30)
  const expensesToIncomeScore =
    expensesToIncomeRatio <= 60 ? 20 : Math.max(0, 20 - ((expensesToIncomeRatio - 60) / 40) * 20)
  const netWorthScore = netWorthRatio >= 1 ? 20 : Math.max(0, netWorthRatio * 20)

  return {
    debtToIncomeRatio,
    savingsToIncomeRatio,
    expensesToIncomeRatio,
    netWorthRatio,
    debtToIncomeScore,
    savingsToIncomeScore,
    expensesToIncomeScore,
    netWorthScore,
  }
}

export async function recalculateFinancialData(userId: string, payload: any) {
  try {
    // Get latest financial data
    const financialData = await payload.find({
      collection: "financial-data",
      where: {
        user: {
          equals: userId,
        },
      },
      sort: "-createdAt",
      limit: 1,
    })

    if (!financialData.docs.length) return

    const latestData = financialData.docs[0]

    // Get all transactions for this user
    const transactions = await payload.find({
      collection: "transactions",
      where: {
        user: {
          equals: userId,
        },
      },
      limit: 1000,
    })

    // Calculate updated financial data based on transactions
    const totalIncome = latestData.monthlyIncome
    const totalExpenses = latestData.monthlyExpenses
    let totalAssets = latestData.totalAssets
    const totalLiabilities = latestData.totalLiabilities

    // Only consider transactions after the latest financial data snapshot
    const latestDataDate = new Date(latestData.createdAt)
    const relevantTransactions = transactions.docs.filter(
      (transaction: any) => new Date(transaction.date) > latestDataDate,
    )

    relevantTransactions.forEach((transaction: any) => {
      if (transaction.type === "income") {
        totalAssets += transaction.amount
      } else {
        totalAssets -= transaction.amount
      }
    })

    // Create new financial data record
    const newData = {
      user: userId,
      monthlyIncome: totalIncome,
      monthlyExpenses: totalExpenses,
      totalAssets: totalAssets,
      totalLiabilities: totalLiabilities,
    }

    // Calculate score components
    const scoreComponents = getScoreComponents(newData)
    const newScore = calculateFinancialScore(newData)

    // Create new financial score record
    await payload.create({
      collection: "financial-scores",
      data: {
        user: userId,
        score: newScore,
        evaluatedAt: new Date(),
        debtToIncomeRatio: scoreComponents.debtToIncomeRatio,
        savingsToIncomeRatio: scoreComponents.savingsToIncomeRatio,
        expensesToIncomeRatio: scoreComponents.expensesToIncomeRatio,
        netWorthRatio: scoreComponents.netWorthRatio,
      },
    })

    // Update financial data
    await payload.create({
      collection: "financial-data",
      data: {
        ...newData,
        netWorth: totalAssets - totalLiabilities,
        score: newScore,
      },
    })
  } catch (error) {
    console.error("Error recalculating financial data:", error)
  }
}
