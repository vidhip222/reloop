"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, Search, FileText, Lightbulb, ChevronDown } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export default function OrderManagementPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    loadOrders()
  }, [filterStatus])

  const loadOrders = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from("purchase_orders")
        .select("*, suppliers(name)")
        .order("created_at", { ascending: false })

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus)
      }

      const { data, error } = await query

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error("Error loading orders:", error)
      toast({
        title: "Error",
        description: "Failed to load purchase orders.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredOrders = orders.filter(
    (order) =>
      order.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.suppliers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.status.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      draft: "bg-gray-100 text-gray-800",
      sent: "bg-blue-100 text-blue-800",
      received: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Order Management
          </CardTitle>
          <CardDescription>View and manage all purchase orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by SKU, supplier, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent className="bg-green-50">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No purchase orders found matching your criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO ID</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>AI Suggestions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id.substring(0, 8)}...</TableCell>
                      <TableCell>{order.sku}</TableCell>
                      <TableCell>{order.suppliers?.name || "N/A"}</TableCell>
                      <TableCell>{order.quantity}</TableCell>
                      <TableCell>${order.unit_price.toFixed(2)}</TableCell>
                      <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                      </TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {order.ai_suggestions && (
                          <Collapsible>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8">
                                <Lightbulb className="h-4 w-4 mr-1" />
                                AI Details
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 transition-transform duration-200 data-[state=open]:rotate-180" />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                              <p>
                                <strong>Suggested Quantity:</strong> {order.ai_suggestions.suggested_quantity}
                              </p>
                              <p>
                                <strong>Suggested Discount:</strong>{" "}
                                {Math.round(order.ai_suggestions.suggested_discount * 100)}%
                              </p>
                              <p>
                                <strong>MOQ Recommendation:</strong> {order.ai_suggestions.moq_recommendation}
                              </p>
                              <p>
                                <strong>Shipping Terms:</strong> {order.ai_suggestions.shipping_terms}
                              </p>
                              <p className="mt-2">
                                <strong>Reasoning:</strong> {order.ai_suggestions.reasoning}
                              </p>
                            </CollapsibleContent>
                          </Collapsible>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
