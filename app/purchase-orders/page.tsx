"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Eye, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/layout/header"
import { exportToCsv } from "@/lib/csv-export"

interface PurchaseOrder {
  id: string
  po_number: string
  subject: string
  status: "draft" | "sent" | "confirmed" | "delivered" | "received" | "cancelled" | "pending"
  total_amount: number
  items_count: number
  created_at: string
  po_sent_at: string | null // New field
  supplier_id: string
  supplier_name: string
  buyer_id: string | null
  buyer_name: string | null
}

interface Supplier {
  id: string
  name: string
}

export default function POTrackerPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterSupplier, setFilterSupplier] = useState<string>("all")
  const [filterDate, setFilterDate] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ordersRes, suppliersRes] = await Promise.all([fetch("/api/purchase-orders"), fetch("/api/suppliers")])

      const ordersData = await ordersRes.json()
      const suppliersData = await suppliersRes.json()

      if (ordersRes.ok) {
        setPurchaseOrders(ordersData)
      } else {
        throw new Error(ordersData.error || "Failed to fetch purchase orders")
      }

      if (suppliersRes.ok) {
        setSuppliers(suppliersData)
      } else {
        throw new Error(suppliersData.error || "Failed to fetch suppliers")
      }
    } catch (error: any) {
      console.error("Error fetching data:", error)
      toast({
        title: "Data Load Error",
        description: error.message || "Failed to load purchase order data.",
        variant: "destructive",
      })
      setPurchaseOrders([])
      setSuppliers([])
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = purchaseOrders.filter((order) => {
    const matchesStatus = filterStatus === "all" || order.status === filterStatus
    const matchesSupplier = filterSupplier === "all" || order.supplier_id === filterSupplier
    const matchesDate = !filterDate || new Date(order.created_at).toISOString().split("T")[0] === filterDate
    return matchesStatus && matchesSupplier && matchesDate
  })

  const getStatusBadge = (status: string) => {
    const statusColors = {
      draft: "bg-gray-100 text-gray-800",
      sent: "bg-blue-100 text-blue-800",
      confirmed: "bg-green-100 text-green-800",
      delivered: "bg-purple-100 text-purple-800",
      received: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
    }
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    )
  }

  const handleExportPO = () => {
    if (filteredOrders.length === 0) {
      toast({
        title: "No Data",
        description: "No purchase orders to export based on current filters.",
      })
      return
    }
    const fields = [
      "po_number",
      "subject",
      "status",
      "total_amount",
      "items_count",
      "supplier_name",
      "buyer_name",
      "created_at",
      "po_sent_at",
    ]
    exportToCsv(filteredOrders, "po_export", fields)
    toast({
      title: "Export Successful",
      description: "Purchase orders exported to CSV.",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Purchase Order Tracker</h1>
            <p className="text-gray-600">Manage and track all your purchase orders.</p>
          </div>
          <Button onClick={handleExportPO} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="status-filter" className="text-sm font-medium">
                  Status
                </label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="supplier-filter" className="text-sm font-medium">
                  Supplier
                </label>
                <Select value={filterSupplier} onValueChange={setFilterSupplier}>
                  <SelectTrigger id="supplier-filter">
                    <SelectValue placeholder="Filter by Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="date-filter" className="text-sm font-medium">
                  Date
                </label>
                <Input
                  id="date-filter"
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Purchase Orders</CardTitle>
            <CardDescription>Overview of all generated and tracked purchase orders.</CardDescription>
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
                    <TableHead>PO Number</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.po_number}</TableCell>
                        <TableCell>{order.subject}</TableCell>
                        <TableCell>{order.supplier_name}</TableCell>
                        <TableCell>{order.buyer_name || "N/A"}</TableCell>
                        <TableCell>{order.items_count}</TableCell>
                        <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {order.po_sent_at ? new Date(order.po_sent_at).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/purchase-orders/${order.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground py-4">
                        No purchase orders found matching your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
