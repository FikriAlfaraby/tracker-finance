interface GoalProgressParams {
  targetAmount: number
  currentAmount: number
  targetDate: Date | null
}

interface GoalProgressResult {
  progress: number
  requiredMonthlySavings: number | null
  estimatedCompletionDate: Date | null
}

export function calculateGoalProgress({
  targetAmount,
  currentAmount,
  targetDate,
}: GoalProgressParams): GoalProgressResult {
  // Calculate progress percentage
  const progress = targetAmount > 0 ? Math.min(100, (currentAmount / targetAmount) * 100) : 0

  // Calculate required monthly savings if target date exists
  let requiredMonthlySavings = null
  if (targetDate) {
    const now = new Date()
    const monthsRemaining = (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44) // Average month in days

    if (monthsRemaining > 0) {
      const amountRemaining = targetAmount - currentAmount
      requiredMonthlySavings = amountRemaining / monthsRemaining
    }
  }

  // Calculate estimated completion date based on current allocation
  let estimatedCompletionDate = null
  if (currentAmount > 0 && currentAmount < targetAmount) {
    // Assume average monthly savings is 10% of current amount if we don't have historical data
    const assumedMonthlySavings = currentAmount * 0.1

    if (assumedMonthlySavings > 0) {
      const monthsToComplete = (targetAmount - currentAmount) / assumedMonthlySavings
      const now = new Date()
      estimatedCompletionDate = new Date(now.setMonth(now.getMonth() + monthsToComplete))
    }
  } else if (currentAmount >= targetAmount) {
    estimatedCompletionDate = new Date() // Goal already completed
  }

  return {
    progress,
    requiredMonthlySavings,
    estimatedCompletionDate,
  }
}
