import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Package, RefreshCw, DollarSign } from "lucide-react"

interface StatsCardsProps {
  stats: {
    totalReturns: number
    eligibleReturns: number
    totalRefunds: number
    recoveryRate: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalReturns}</div>
          <p className="text-xs text-muted-foreground">+12% from last month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Eligible Returns</CardTitle>
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.eligibleReturns}</div>
          <p className="text-xs text-muted-foreground">
            {((stats.eligibleReturns / stats.totalReturns) * 100).toFixed(1)}% of total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.totalRefunds.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">-5% from last month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recovery Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(stats.recoveryRate * 100).toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">+3% from last month</p>
        </CardContent>
      </Card>
    </div>
  )
}
