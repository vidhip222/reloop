"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { TrendingUp, TrendingDown, DollarSign, Package, Recycle, AlertTriangle } from "lucide-react"

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("30d")

  // Mock data - in production, fetch from database
  const returnFunnelData = [
    { name: "Approved", value: 245, color: "#10B981" },
    { name: "Flagged", value: 32, color: "#F59E0B" },
    { name: "Denied", value: 18, color: "#EF4444" },
  ]

  const trendData = [
    { category: "Electronics", trend: "Hot", confidence: 92, volume: 156 },
    { category: "Clothing", trend: "Cold", confidence: 78, volume: 89 },
    { category: "Home & Garden", trend: "Niche", confidence: 85, volume: 34 },
    { category: "Sports", trend: "Hot", confidence: 88, volume: 67 },
  ]

  const resalePerformance = [
    { platform: "eBay", listed: 45, sold: 32, revenue: 1240 },
    { platform: "ThredUp", listed: 23, sold: 18, revenue: 560 },
    { platform: "Depop", listed: 12, sold: 8, revenue: 320 },
    { platform: "Facebook", listed: 8, sold: 5, revenue: 180 },
  ]

  const recoveryData = [
    { month: "Jan", recovered: 78, landfill: 22 },
    { month: "Feb", recovered: 82, landfill: 18 },
    { month: "Mar", recovered: 85, landfill: 15 },
    { month: "Apr", recovered: 88, landfill: 12 },
    { month: "May", recovered: 91, landfill: 9 },
    { month: "Jun", recovered: 94, landfill: 6 },
  ]

  const getTrendColor = (trend: string) => {
    const colors: { [key: string]: string } = {
      Hot: "bg-red-100 text-red-800",
      Cold: "bg-blue-100 text-blue-800",
      Niche: "bg-purple-100 text-purple-800",
    }
    return colors[trend] || "bg-gray-100 text-gray-800"
  }

  const getTrendIcon = (trend: string) => {
    return trend === "Hot" ? (
      <TrendingUp className="h-4 w-4 text-red-500" />
    ) : trend === "Cold" ? (
      <TrendingDown className="h-4 w-4 text-blue-500" />
    ) : (
      <Package className="h-4 w-4 text-purple-500" />
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recovery Rate</CardTitle>
            <Recycle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">+6% from last month</p>
            <Progress value={94} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,500</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Processed</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">295</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">Classification accuracy</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Product Trends</TabsTrigger>
          <TabsTrigger value="funnel">Return Funnel</TabsTrigger>
          <TabsTrigger value="resale">Resale Performance</TabsTrigger>
          <TabsTrigger value="recovery">Recovery Impact</TabsTrigger>
        </TabsList>

        {/* Product Trends */}
        <TabsContent value="trends">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Trend Analysis</CardTitle>
                <CardDescription>Gemini-powered trend detection across categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trendData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTrendIcon(item.trend)}
                        <div>
                          <div className="font-medium">{item.category}</div>
                          <div className="text-sm text-gray-500">{item.volume} items</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getTrendColor(item.trend)}>{item.trend}</Badge>
                        <span className="text-sm text-gray-600">{item.confidence}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gemini Insights</CardTitle>
                <CardDescription>AI-generated market intelligence</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-900">Hot Trend Alert</h4>
                        <p className="text-red-800 text-sm mt-1">
                          Electronics returns are trending up 45% - likely due to back-to-school season. Consider
                          increasing resale pricing by 15%.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <TrendingDown className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900">Seasonal Decline</h4>
                        <p className="text-blue-800 text-sm mt-1">
                          Summer clothing returns dropping 30%. Route to outlet or third-world shops for better recovery
                          rates.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Package className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-purple-900">Niche Opportunity</h4>
                        <p className="text-purple-800 text-sm mt-1">
                          Home & Garden items showing strong niche demand. Focus on specialty resale platforms for
                          higher margins.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Return Funnel */}
        <TabsContent value="funnel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Return Processing Funnel</CardTitle>
                <CardDescription>Breakdown of return approval status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={returnFunnelData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {returnFunnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Processing Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Approval Rate</span>
                  <span className="text-2xl font-bold text-green-600">83%</span>
                </div>
                <Progress value={83} className="h-2" />

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">AI Override Rate</span>
                  <span className="text-2xl font-bold text-blue-600">12%</span>
                </div>
                <Progress value={12} className="h-2" />

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Fraud Detection</span>
                  <span className="text-2xl font-bold text-red-600">3%</span>
                </div>
                <Progress value={3} className="h-2" />

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      Review Queue: 8 items pending manual review
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Resale Performance */}
        <TabsContent value="resale">
          <Card>
            <CardHeader>
              <CardTitle>Resale Platform Performance</CardTitle>
              <CardDescription>Revenue and conversion rates by platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Platform</th>
                      <th className="text-left p-2">Listed</th>
                      <th className="text-left p-2">Sold</th>
                      <th className="text-left p-2">Conversion</th>
                      <th className="text-left p-2">Revenue</th>
                      <th className="text-left p-2">Avg. Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resalePerformance.map((platform, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{platform.platform}</td>
                        <td className="p-2">{platform.listed}</td>
                        <td className="p-2">{platform.sold}</td>
                        <td className="p-2">
                          <Badge variant="secondary">{Math.round((platform.sold / platform.listed) * 100)}%</Badge>
                        </td>
                        <td className="p-2 font-semibold">${platform.revenue}</td>
                        <td className="p-2">${Math.round(platform.revenue / platform.sold)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">71%</div>
                  <div className="text-sm text-green-600">Overall Conversion Rate</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">$39</div>
                  <div className="text-sm text-blue-600">Average Sale Price</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-700">5.2</div>
                  <div className="text-sm text-purple-600">Days to Sale (Avg)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recovery Impact */}
        <TabsContent value="recovery">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Environmental Impact</CardTitle>
                <CardDescription>Items diverted from landfill over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={recoveryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="recovered" stroke="#10B981" strokeWidth={2} name="Recovered (%)" />
                    <Line type="monotone" dataKey="landfill" stroke="#EF4444" strokeWidth={2} name="Landfill (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Social Impact Metrics</CardTitle>
                <CardDescription>Community benefit and waste reduction</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">2,847</div>
                  <div className="text-sm text-gray-600">Items diverted from landfill this month</div>
                </div>

                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">1,234</div>
                  <div className="text-sm text-gray-600">Items donated to communities</div>
                </div>

                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-600 mb-2">$45,600</div>
                  <div className="text-sm text-gray-600">Value provided to underserved communities</div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Environmental Savings</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• 12.3 tons CO₂ emissions prevented</li>
                    <li>• 8,900 gallons water saved</li>
                    <li>• 2.1 tons textile waste diverted</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
