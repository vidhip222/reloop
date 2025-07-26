"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, Package, XCircle, Clock, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/layout/header"
import { AddReturnForm } from "@/components/returns/add-return-form" // Import the form

interface ReturnItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  return_reason: string
  condition: string
  ai_classification: "relist" | "outlet" | "resale" | "discard" | "manual_review" | null
  confidence_score: number | null
  status: "pending" | "approved" | "denied" | "processed" | "flagged"
  refund_amount: number | null
  ai_reasoning: string | null
  images: string[]
  created_at: string
}

interface ResaleItem {
  id: string
  product_name: string
  platform: string
  listing_price: number
  current_status: "listed" | "sold" | "pending" | "removed"
  sold_price: number | null
  profit_margin: number | null
  platform_listing_id: string | null
  listed_at: string
  sold_at: string | null
}

interface ReturnAnalytics {
  total_returns: number
  pending_classification: number
  eligible_returns: number
  denied_returns: number
  total_refunded_amount: number
  total_recovered_revenue: number
  classification_breakdown: {
    relist: number
    outlet: number
    resale: number
    discard: number
    manual_review: number
    pending: number // Added pending for items not yet classified
  }
  platform_performance: {
    platform: string
    listed: number
    sold: number
    revenue: number
  }[]
}

export default function ReturnsManagerPage() {
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([])
  const [resaleItems, setResaleItems] = useState<ResaleItem[]>([])
  const [analytics, setAnalytics] = useState<ReturnAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingReturnId, setProcessingReturnId] = useState<string | null>(null)
  const [showAddReturnForm, setShowAddReturnForm] = useState(false) // State for showing the form
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      const [returnsRes, resaleRes, analyticsRes] = await Promise.allSettled([
        fetch("/api/returns", { signal: controller.signal }),
        fetch("/api/resale-items", { signal: controller.signal }),
        fetch("/api/returns/analytics", { signal: controller.signal }),
      ])
      clearTimeout(timeoutId)

      const processResponse = async (res: PromiseSettledResult<Response>, name: string) => {
        if (res.status === "fulfilled" && res.value.ok) {
          return await res.value.json()
        } else {
          const errorMsg =
            res.status === "rejected"
              ? res.reason.name === "AbortError"
                ? `${name} fetch timed out.`
                : res.reason.message
              : `HTTP error! status: ${res.value.status} for ${name}`
          console.error(`Error fetching ${name}:`, errorMsg)
          toast({
            title: "Data Load Error",
            description: `Failed to load ${name}. ${errorMsg}`,
            variant: "destructive",
          })
          return []
        }
      }

      setReturnItems(await processResponse(returnsRes, "return items"))
      setResaleItems(await processResponse(resaleRes, "resale items"))
      setAnalytics((await processResponse(analyticsRes, "returns analytics"))[0] || null)
    } catch (error) {
      console.error("Unexpected error during data fetch:", error)
      toast({
        title: "System Error",
        description: "An unexpected error occurred while fetching dashboard data.",
        variant: "destructive",
      })
      setReturnItems([])
      setResaleItems([])
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }

  const handleProcessReturn = async (returnId: string) => {
    setProcessingReturnId(returnId)
    try {
      const response = await fetch(`/api/returns/${returnId}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Return Processed",
          description: `Return ${returnId.substring(0, 8)}... classified as "${result.ai_classification}".`,
        })
        fetchData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
    } catch (error: any) {
      console.error("Error processing return:", error)
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process return. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingReturnId(null)
    }
  }

  const handleAddReturnSubmit = async (data: any) => {
    try {
      const response = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Return item added successfully!",
        })
        setShowAddReturnForm(false)
        fetchData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
    } catch (error: any) {
      console.error("Error adding return item:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add return item. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getClassificationBadge = (classification: string | null) => {
    switch (classification) {
      case "relist":
        return <Badge className="bg-green-100 text-green-800">Relist</Badge>
      case "outlet":
        return <Badge className="bg-blue-100 text-blue-800">Outlet</Badge>
      case "resale":
        return <Badge className="bg-purple-100 text-purple-800">Resale</Badge>
      case "discard":
        return <Badge className="bg-red-100 text-red-800">Discard</Badge>
      case "manual_review":
        return <Badge className="bg-orange-100 text-orange-800">Manual Review</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  const getReturnStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "denied":
        return <Badge variant="destructive">Denied</Badge>
      case "processed":
        return <Badge className="bg-blue-100 text-blue-800">Processed</Badge>
      case "flagged":
        return <Badge className="bg-yellow-100 text-yellow-800">Flagged</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (showAddReturnForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="p-6">
          <AddReturnForm onSubmit={handleAddReturnSubmit} onCancel={() => setShowAddReturnForm(false)} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Returns & Resale Manager</h1>
            <p className="text-gray-600">Turn returns into revenue with smart recovery decisions.</p>
          </div>
          <Button onClick={() => setShowAddReturnForm(true)}>Add Return Item</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Returns</p>
                  <p className="text-2xl font-bold">{analytics?.total_returns || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Classification</p>
                  <p className="text-2xl font-bold">{analytics?.pending_classification || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Revenue Recovered</p>
                  <p className="text-2xl font-bold">${analytics?.total_recovered_revenue.toFixed(2) || "0.00"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Denied Returns</p>
                  <p className="text-2xl font-bold">{analytics?.denied_returns || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Tabs defaultValue="returns" className="space-y-6">
          <TabsList>
            <TabsTrigger value="returns">Return Items</TabsTrigger>
            <TabsTrigger value="resale">Resale Listings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <TabsContent value="returns">
            <Card>
              <CardHeader>
                <CardTitle>Returned Items Awaiting Classification</CardTitle>
                <CardDescription>AI automatically determines the optimal next step for each item.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead>AI Classification</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {returnItems.length > 0 ? (
                        returnItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.order_id}</TableCell>
                            <TableCell>{item.product_name}</TableCell>
                            <TableCell>{item.return_reason}</TableCell>
                            <TableCell>{item.condition}</TableCell>
                            <TableCell>
                              {item.ai_classification ? (
                                getClassificationBadge(item.ai_classification)
                              ) : (
                                <Badge variant="outline">N/A</Badge>
                              )}
                            </TableCell>
                            <TableCell>{getReturnStatusBadge(item.status)}</TableCell>
                            <TableCell>
                              {item.status === "pending" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleProcessReturn(item.id)}
                                  disabled={processingReturnId === item.id}
                                >
                                  {processingReturnId === item.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    "Process"
                                  )}
                                </Button>
                              )}
                              {item.status !== "pending" && (
                                <Button size="sm" variant="outline" disabled>
                                  Processed
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
                            No return items awaiting classification.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="resale">
            <Card>
              <CardHeader>
                <CardTitle>Resale & Recovery Listings</CardTitle>
                <CardDescription>Track items listed on various resale platforms or routed to outlet.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Listing Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sold Price</TableHead>
                        <TableHead>Profit Margin</TableHead>
                        <TableHead>Listed At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resaleItems.length > 0 ? (
                        resaleItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.product_name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{item.platform}</Badge>
                            </TableCell>
                            <TableCell>${item.listing_price.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  item.current_status === "sold"
                                    ? "outline"
                                    : item.current_status === "listed"
                                      ? "default"
                                      : "secondary"
                                }
                              >
                                {item.current_status}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.sold_price ? `$${item.sold_price.toFixed(2)}` : "N/A"}</TableCell>
                            <TableCell>{item.profit_margin ? `${item.profit_margin.toFixed(2)}%` : "N/A"}</TableCell>
                            <TableCell>{new Date(item.listed_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
                            No resale listings available.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Returns & Resale Analytics</CardTitle>
                <CardDescription>Insights into return trends and profit recovery.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : analytics ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Classification Breakdown</h3>
                      <div className="space-y-2">
                        {Object.entries(analytics.classification_breakdown).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center">
                            <span className="capitalize">{key.replace("_", " ")}:</span>
                            <Badge variant="secondary">{value}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Platform Performance</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Platform</TableHead>
                            <TableHead>Listed</TableHead>
                            <TableHead>Sold</TableHead>
                            <TableHead>Revenue</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analytics.platform_performance.map((p) => (
                            <TableRow key={p.platform}>
                              <TableCell className="font-medium">{p.platform}</TableCell>
                              <TableCell>{p.listed}</TableCell>
                              <TableCell>{p.sold}</TableCell>
                              <TableCell>${p.revenue.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">No analytics data available.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
