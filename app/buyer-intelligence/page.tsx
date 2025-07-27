"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, Package, AlertTriangle, CheckCircle, Clock, DollarSign, Loader2, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/layout/header"

interface RestockRecommendation {
  id: string
  product_id: string
  product_name: string
  current_stock: number
  recommended_quantity: number
  confidence_score: number
  urgency: "low" | "medium" | "high"
  predicted_stockout_date: string
  supplier_id: string
  supplier_name: string
  ai_reasoning: string
  status: string
}

interface Supplier {
  id: string
  name: string
  rating: number
  avg_delivery_days: number
  price_competitiveness: number
  reliability_score: number
  total_orders: number
}

interface PurchaseOrder {
  id: string
  po_number: string
  supplier_name: string
  total_amount: number
  status: "draft" | "pending" | "sent" | "received" | "cancelled"
  created_at: string
  items_count: number
}

export default function BuyerIntelligencePage() {
  const [restockRecommendations, setRestockRecommendations] = useState<RestockRecommendation[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingPO, setGeneratingPO] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      const [restockRes, suppliersRes, ordersRes] = await Promise.allSettled([
        fetch("/api/restock-recommendations", { signal: controller.signal }),
        fetch("/api/suppliers", { signal: controller.signal }),
        fetch("/api/purchase-orders", { signal: controller.signal }),
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

      setRestockRecommendations(await processResponse(restockRes, "restock recommendations"))
      setSuppliers(await processResponse(suppliersRes, "suppliers"))
      setPurchaseOrders(await processResponse(ordersRes, "purchase orders"))
    } catch (error) {
      console.error("Unexpected error during data fetch:", error)
      toast({
        title: "System Error",
        description: "An unexpected error occurred while fetching dashboard data.",
        variant: "destructive",
      })
      setRestockRecommendations([])
      setSuppliers([])
      setPurchaseOrders([])
    } finally {
      setLoading(false)
    }
  }

  const generatePurchaseOrder = async (
    recommendationId: string,
    productId: string,
    productName: string,
    recommendedQuantity: number,
    supplierId: string,
  ) => {
    setGeneratingPO(true)
    try {
      const response = await fetch("/api/purchase-orders/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendation_id: recommendationId, // Keep for context if needed by API
          product_id: productId,
          product_name: productName,
          recommended_quantity: recommendedQuantity,
          supplier_id: supplierId,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Success",
          description: `Purchase order ${result.po.po_number} generated successfully!`,
        })
        fetchData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
    } catch (error: any) {
      console.error("Error generating PO:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to generate purchase order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setGeneratingPO(false)
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <Clock className="h-4 w-4" />
      case "pending":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "sent":
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case "received":
        return <Package className="h-4 w-4 text-green-500" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Buyer & Supplier Intelligence</h1>
          <p className="text-gray-600">AI-powered inventory optimization and supplier management</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Recommendations</p>
                  <p className="text-2xl font-bold">{restockRecommendations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Suppliers</p>
                  <p className="text-2xl font-bold">{suppliers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">High Priority Items</p>
                  <p className="text-2xl font-bold">
                    {restockRecommendations.filter((r) => r.urgency === "high").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-bold">
                    {purchaseOrders.filter((po) => po.status !== "received" && po.status !== "cancelled").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Tabs defaultValue="recommendations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="recommendations">Restock Recommendations</TabsTrigger>
            <TabsTrigger value="suppliers">Supplier Rankings</TabsTrigger>
            <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          </TabsList>
          <TabsContent value="recommendations">
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Restock Recommendations</CardTitle>
                <CardDescription>Based on sales history, seasonality, and current inventory levels</CardDescription>
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
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Recommended Qty</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Urgency</TableHead>
                        <TableHead>Predicted Stockout</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {restockRecommendations.length > 0 ? (
                        restockRecommendations.map((rec) => (
                          <TableRow key={rec.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{rec.product_name}</p>
                                <p className="text-sm text-gray-500">Product ID: {rec.product_id.substring(0, 8)}...</p>
                              </div>
                            </TableCell>
                            <TableCell>{rec.current_stock}</TableCell>
                            <TableCell className="font-medium">{rec.recommended_quantity}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Progress value={rec.confidence_score * 100} className="w-16" />
                                <span className="text-sm">{(rec.confidence_score * 100).toFixed(0)}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getUrgencyColor(rec.urgency)}>{rec.urgency}</Badge>
                            </TableCell>
                            <TableCell>{new Date(rec.predicted_stockout_date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() =>
                                  generatePurchaseOrder(
                                    rec.id,
                                    rec.product_id,
                                    rec.product_name,
                                    rec.recommended_quantity,
                                    rec.supplier_id,
                                  )
                                }
                                disabled={generatingPO || rec.status !== "active"}
                              >
                                {generatingPO ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate PO"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
                            No restock recommendations available.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="suppliers">
            <Card>
              <CardHeader>
                <CardTitle>Supplier Performance Rankings</CardTitle>
                <CardDescription>Compare suppliers based on pricing, delivery, and reliability</CardDescription>
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
                        <TableHead>Supplier</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Avg Delivery</TableHead>
                        <TableHead>Price Competitiveness</TableHead>
                        <TableHead>Reliability</TableHead>
                        <TableHead>Total Orders</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suppliers.length > 0 ? (
                        suppliers.map((supplier) => (
                          <TableRow key={supplier.id}>
                            <TableCell className="font-medium">{supplier.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <span>{supplier.rating.toFixed(1)}</span>
                                <span className="text-yellow-500">★</span>
                              </div>
                            </TableCell>
                            <TableCell>{supplier.avg_delivery_days} days</TableCell>
                            <TableCell>
                              <Progress value={supplier.price_competitiveness} className="w-16" />
                            </TableCell>
                            <TableCell>
                              <Progress value={supplier.reliability_score} className="w-16" />
                            </TableCell>
                            <TableCell>{supplier.total_orders}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                            No suppliers available.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Purchase Orders</CardTitle>
                <CardDescription>Track and manage purchase orders across all suppliers</CardDescription>
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
                        <TableHead>Supplier</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseOrders.length > 0 ? (
                        purchaseOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">#{order.po_number}</TableCell>
                            <TableCell>{order.supplier_name}</TableCell>
                            <TableCell>{order.items_count} items</TableCell>
                            <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(order.status)}
                                <span className="capitalize">{order.status}</span>
                              </div>
                            </TableCell>
                            <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                            No purchase orders available.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
