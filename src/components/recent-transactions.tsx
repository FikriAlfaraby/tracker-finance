import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"

interface Transaction {
  id: string
  type: "income" | "expense"
  category: string
  amount: number
  date: string
  description?: string
}

interface RecentTransactionsProps {
  transactions: Transaction[]
}

const categoryLabels: Record<string, string> = {
  salary: "Gaji",
  freelance: "Freelance",
  investment: "Investasi",
  bonus: "Bonus",
  "other-income": "Lainnya",
  food: "Makanan",
  transportation: "Transportasi",
  shopping: "Belanja",
  bills: "Tagihan",
  entertainment: "Hiburan",
  health: "Kesehatan",
  education: "Pendidikan",
  "other-expense": "Lainnya",
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">Belum ada transaksi yang dicatat</div>
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-4">
            <div className={`w-3 h-3 rounded-full ${transaction.type === "income" ? "bg-green-500" : "bg-red-500"}`} />
            <div>
              <div className="font-medium">{categoryLabels[transaction.category] || transaction.category}</div>
              {transaction.description && (
                <div className="text-sm text-muted-foreground">{transaction.description}</div>
              )}
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(transaction.date), {
                  addSuffix: true,
                  locale: id,
                })}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`font-bold ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
              {transaction.type === "income" ? "+" : "-"}Rp {transaction.amount.toLocaleString("id-ID")}
            </div>
            <Badge variant={transaction.type === "income" ? "default" : "destructive"}>
              {transaction.type === "income" ? "Pemasukan" : "Pengeluaran"}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}
