'use client'

import type React from 'react'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, ArrowRight, TrendingUp, Target, CheckCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface EvaluationData {
  monthlyIncome: number
  monthlyExpenses: number
  totalAssets: number
  totalLiabilities: number
}

interface UserData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export default function EvaluationFlow() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [calculatedScore, setCalculatedScore] = useState<number | null>(null)

  const [evaluationData, setEvaluationData] = useState<EvaluationData>({
    monthlyIncome: 0,
    monthlyExpenses: 0,
    totalAssets: 0,
    totalLiabilities: 0,
  })

  const [userData, setUserData] = useState<UserData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  // Calculate financial score locally
  const calculateFinancialScore = (data: EvaluationData): number => {
    const { monthlyIncome, monthlyExpenses, totalAssets, totalLiabilities } = data
    const annualIncome = monthlyIncome * 12

    if (annualIncome === 0) return 0

    // Calculate ratios
    const debtToIncomeRatio = (totalLiabilities / annualIncome) * 100
    const savingsToIncomeRatio = ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
    const expensesToIncomeRatio = (monthlyExpenses / monthlyIncome) * 100
    const netWorthRatio = (totalAssets - totalLiabilities) / annualIncome

    // Calculate scores
    const debtToIncomeScore =
      debtToIncomeRatio <= 30 ? 30 : Math.max(0, 30 - (debtToIncomeRatio - 30) / 3)
    const savingsToIncomeScore =
      savingsToIncomeRatio >= 20 ? 30 : Math.max(0, (savingsToIncomeRatio / 20) * 30)
    const expensesToIncomeScore =
      expensesToIncomeRatio <= 60 ? 20 : Math.max(0, 20 - ((expensesToIncomeRatio - 60) / 40) * 20)
    const netWorthScore = netWorthRatio >= 1 ? 20 : Math.max(0, netWorthRatio * 20)

    const totalScore = Math.round(
      debtToIncomeScore + savingsToIncomeScore + expensesToIncomeScore + netWorthScore,
    )
    return Math.max(0, Math.min(100, totalScore))
  }

  const handleEvaluationSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (evaluationData.monthlyIncome <= 0) {
      toast({
        title: 'Error',
        description: 'Pemasukan bulanan harus lebih dari 0',
        variant: 'destructive',
      })
      return
    }

    // Calculate score
    const score = calculateFinancialScore(evaluationData)
    setCalculatedScore(score)
    setCurrentStep(2)
  }

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (userData.password !== userData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Password dan konfirmasi password tidak sama',
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    if (userData.password.length < 8) {
      toast({
        title: 'Error',
        description: 'Password minimal 8 karakter',
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    try {
      // Register user
      const registerResponse = await fetch(`/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password,
        }),
      })

      if (!registerResponse.ok) {
        const error = await registerResponse.json()
        throw new Error(error.message || 'Registration failed')
      }

      const registerData = await registerResponse.json()

      // Login to get token
      const loginResponse = await fetch(`/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
        }),
      })

      if (!loginResponse.ok) {
        throw new Error('Login failed after registration')
      }

      const loginData = await loginResponse.json()
      localStorage.setItem('token', loginData.token)

      // Create financial data
      const financialResponse = await fetch(`/api/financial-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${loginData.token}`,
        },
        body: JSON.stringify({
          ...evaluationData,
          user: registerData.doc.id,
        }),
      })

      if (!financialResponse.ok) {
        throw new Error('Failed to save financial data')
      }

      // Create default main pocket
      await fetch(`/api/pockets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${loginData.token}`,
        },
        body: JSON.stringify({
          user: registerData.doc.id,
          name: 'Kantong Utama',
          description: 'Kantong utama untuk dana sehari-hari',
          balance: evaluationData.totalAssets,
          pocketType: 'main',
          isActive: true,
          icon: 'money',
          color: 'green',
        }),
      })

      setCurrentStep(3)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Sangat Baik'
    if (score >= 80) return 'Baik Sekali'
    if (score >= 70) return 'Baik'
    if (score >= 60) return 'Cukup'
    if (score >= 50) return 'Kurang'
    return 'Sangat Kurang'
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Langkah {currentStep} dari 3</span>
            <span className="text-sm text-muted-foreground">
              {Math.round((currentStep / 3) * 100)}%
            </span>
          </div>
          <Progress value={(currentStep / 3) * 100} className="h-2" />
        </div>

        {/* Step 1: Financial Evaluation */}
        {currentStep === 1 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">FinanceTracker</span>
              </div>
              <CardTitle>Evaluasi Keuangan Awal</CardTitle>
              <CardDescription>
                Mari mulai dengan mengevaluasi kondisi keuangan Anda saat ini untuk mendapatkan skor
                keuangan personal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEvaluationSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthlyIncome">Pemasukan Bulanan (Rp)</Label>
                    <Input
                      id="monthlyIncome"
                      type="number"
                      min="0"
                      step="100000"
                      value={evaluationData.monthlyIncome || ''}
                      onChange={(e) =>
                        setEvaluationData({
                          ...evaluationData,
                          monthlyIncome: Number(e.target.value),
                        })
                      }
                      placeholder="0"
                      required
                    />
                    {evaluationData.monthlyIncome > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(evaluationData.monthlyIncome)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthlyExpenses">Pengeluaran Bulanan (Rp)</Label>
                    <Input
                      id="monthlyExpenses"
                      type="number"
                      min="0"
                      step="100000"
                      value={evaluationData.monthlyExpenses || ''}
                      onChange={(e) =>
                        setEvaluationData({
                          ...evaluationData,
                          monthlyExpenses: Number(e.target.value),
                        })
                      }
                      placeholder="0"
                      required
                    />
                    {evaluationData.monthlyExpenses > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(evaluationData.monthlyExpenses)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalAssets">Total Aset (Rp)</Label>
                    <Input
                      id="totalAssets"
                      type="number"
                      min="0"
                      step="1000000"
                      value={evaluationData.totalAssets || ''}
                      onChange={(e) =>
                        setEvaluationData({
                          ...evaluationData,
                          totalAssets: Number(e.target.value),
                        })
                      }
                      placeholder="0"
                      required
                    />
                    {evaluationData.totalAssets > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(evaluationData.totalAssets)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalLiabilities">Total Utang (Rp)</Label>
                    <Input
                      id="totalLiabilities"
                      type="number"
                      min="0"
                      step="1000000"
                      value={evaluationData.totalLiabilities || ''}
                      onChange={(e) =>
                        setEvaluationData({
                          ...evaluationData,
                          totalLiabilities: Number(e.target.value),
                        })
                      }
                      placeholder="0"
                      required
                    />
                    {evaluationData.totalLiabilities > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(evaluationData.totalLiabilities)}
                      </p>
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  Hitung Skor Keuangan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Score Result & Registration */}
        {currentStep === 2 && calculatedScore !== null && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <Target className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Skor Keuangan Anda</CardTitle>
              <CardDescription>Berikut adalah hasil evaluasi kondisi keuangan Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-8">
                <div className={`text-6xl font-bold mb-2 ${getScoreColor(calculatedScore)}`}>
                  {calculatedScore}
                </div>
                <div className="text-xl text-muted-foreground mb-4">dari 100 poin</div>
                <div className={`text-lg font-semibold ${getScoreColor(calculatedScore)}`}>
                  {getScoreLabel(calculatedScore)}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold mb-2">Ringkasan Evaluasi:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Pemasukan:</span>
                    <div className="font-medium">
                      {formatCurrency(evaluationData.monthlyIncome)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pengeluaran:</span>
                    <div className="font-medium">
                      {formatCurrency(evaluationData.monthlyExpenses)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Aset:</span>
                    <div className="font-medium">{formatCurrency(evaluationData.totalAssets)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Utang:</span>
                    <div className="font-medium">
                      {formatCurrency(evaluationData.totalLiabilities)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Daftar untuk Menyimpan Data Anda</h3>
                <form onSubmit={handleRegistration} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input
                      id="name"
                      type="text"
                      value={userData.name}
                      onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                      placeholder="Masukkan nama lengkap"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userData.email}
                      onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                      placeholder="nama@email.com"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={userData.password}
                        onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                        placeholder="Minimal 8 karakter"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={userData.confirmPassword}
                        onChange={(e) =>
                          setUserData({ ...userData, confirmPassword: e.target.value })
                        }
                        placeholder="Ulangi password"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      className="flex-1"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Kembali
                    </Button>
                    <Button type="submit" disabled={isLoading} className="flex-1">
                      {isLoading ? 'Mendaftar...' : 'Daftar & Simpan'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Success */}
        {currentStep === 3 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Selamat! Akun Berhasil Dibuat</CardTitle>
              <CardDescription>
                Data keuangan Anda telah tersimpan dan kantong utama telah dibuat secara otomatis
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="bg-green-50 p-6 rounded-lg mb-6">
                <h3 className="font-semibold text-green-800 mb-2">Yang Telah Dibuat:</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✓ Akun pengguna dengan skor keuangan {calculatedScore}</li>
                  <li>✓ Kantong Utama dengan saldo {formatCurrency(evaluationData.totalAssets)}</li>
                  <li>✓ Kantong Dana Darurat (kosong)</li>
                  <li>✓ Kantong Tabungan (kosong)</li>
                </ul>
              </div>

              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Anda sekarang dapat mulai mengelola keuangan dengan sistem kantong, mencatat
                  transaksi, dan memantau perkembangan skor keuangan Anda.
                </p>

                <Button onClick={() => router.push('/dashboard')} className="w-full" size="lg">
                  Masuk ke Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
