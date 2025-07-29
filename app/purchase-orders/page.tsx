"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Plus, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/layout/header"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { exportToCsv } from "@/lib/csv-export"
import { supabase } from "@/lib/supabase"
import { mockPurchaseOrders, mockSuppliers, mockBuyers } from "@/lib/mock-data"

interface PurchaseOrder {
  id: string
  po_number: string
  subject: string
  supplier_id: string
  supplier_name: string
  buyer_id: string | null
  buyer_name: string | null
  items_count: number
  total_amount: number
  status: "draft" | "pending" | "sent" | "received" | "cancelled"
  created_at: string
  sent_at: string | null
}

interface Supplier {
  id: string
  name: string
}

interface Buyer {
  id: string
  name: string
}

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    supplierId: "all", // Updated default value
    buyerId: "all", // Updated default value
    startDate: "",
    endDate: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [filters])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.supplierId !== "all") params.append("supplierId", filters.supplierId)
      if (filters.buyerId !== "all") params.append("buyerId", filters.buyerId)
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)

      const response = await fetch(`/api/purchase-orders?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      // Enrich mock data if no real data is returned
      if (
        data.length === 0 &&
        filters.supplierId === "all" &&
        filters.buyerId === "all" &&
        !filters.startDate &&
        !filters.endDate
      ) {
        const enrichedMockOrders = mockPurchaseOrders.map((po) => ({
          ...po,
          supplier_name: mockSuppliers.find((s) => s.id === po.supplier_id)?.name || "Unknown Supplier",
          buyer_name: mockBuyers.find((b) => b.id === po.buyer_id)?.name || "Unknown Buyer",
          items_count: po.items.length,
        }))
        setPurchaseOrders(enrichedMockOrders)
      } else {
        setPurchaseOrders(data)
      }

      // Fetch suppliers and buyers for filters
      const [suppliersRes, buyersRes] = await Promise.all([
        supabase.from("suppliers").select("id, name"),
        supabase.from("buyers").select("id, name"),
      ])

      setSuppliers(suppliersRes.data || mockSuppliers)
      setBuyers(buyersRes.data || mockBuyers)
    } catch (error: any) {
      console.error("Error fetching purchase orders:", error)
      toast({
        title: "Data Load Error",
        description: `Failed to load purchase orders. ${error.message}`,
        variant: "destructive",
      })
      setPurchaseOrders(
        mockPurchaseOrders.map((po) => ({
          ...po,
          supplier_name: mockSuppliers.find((s) => s.id === po.supplier_id)?.name || "Unknown Supplier",
          buyer_name: mockBuyers.find((b) => b.id === po.buyer_id)?.name || "Unknown Buyer",
          items_count: po.items.length,
        })),
      )
      setSuppliers(mockSuppliers)
      setBuyers(mockBuyers)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

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

  const handleExport = () => {
    const fields = [
      { key: "po_number", header: "PO Number" },
      { key: "subject", header: "Subject" },
      { key: "supplier_name", header: "Supplier" },
      { key: "buyer_name", header: "Buyer" },
      { key: "items_count", header: "Item Count" },
      { key: "total_amount", header: "Total Amount" },
      { key: "status", header: "Status" },
      { key: "created_at", header: "Created Date" },
      { key: "sent_at", header: "Sent Date" },
    ]
    exportToCsv(purchaseOrders, fields, "purchase_orders")
    toast({
      title: "Export Successful",
      description: "Purchase orders exported to CSV.",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
          <div className="flex space-x-2">
            <Button asChild size="sm">
              <Link href="/purchase-orders/new">
                <Plus className="h-4 w-4 mr-2" />
                Create New PO
              </Link>
            </Button>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" /> Export to CSV
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Purchase Orders</CardTitle>
            <CardDescription>Refine your view of purchase orders.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label htmlFor="filterSupplier" className="text-sm font-medium">
                  Supplier
                </label>
                <Select value={filters.supplierId} onValueChange={(value) => handleFilterChange("supplierId", value)}>
                  <SelectTrigger id="filterSupplier">
                    <SelectValue placeholder="Select Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem> {/* Updated value prop */}
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="filterBuyer" className="text-sm font-medium">
                  Buyer
                </label>
                <Select value={filters.buyerId} onValueChange={(value) => handleFilterChange("buyerId", value)}>
                  <SelectTrigger id="filterBuyer">
                    <SelectValue placeholder="Select Buyer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Buyers</SelectItem> {/* Updated value prop */}
                    {buyers.map((buyer) => (
                      <SelectItem key={buyer.id} value={buyer.id}>
                        {buyer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="filterStartDate" className="text-sm font-medium">
                  Start Date
                </label>

                <Popover>
                  <PopoverTrigger asChild>
                    <div
                      className={cn(
                        "w-full cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm",
                        "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        "flex items-center justify-between",
                        !filters.startDate && "text-muted-foreground"
                      )}
                    >
                      {filters.startDate ? format(new Date(filters.startDate), "PPP") : "Pick a date"}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.startDate ? new Date(filters.startDate) : undefined}
                      onSelect={(date) => handleFilterChange("startDate", date ? format(date, "yyyy-MM-dd") : "")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label htmlFor="filterEndDate" className="text-sm font-medium">
                  End Date
                </label>

                <Popover>
                  <PopoverTrigger asChild>
                    <div
                      className={cn(
                        "w-full cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm",
                        "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        "flex items-center justify-between",
                        !filters.endDate && "text-muted-foreground"
                      )}
                    >
                      {filters.endDate ? format(new Date(filters.endDate), "PPP") : "Pick a date"}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.endDate ? new Date(filters.endDate) : undefined}
                      onSelect={(date) => handleFilterChange("endDate", date ? format(date, "yyyy-MM-dd") : "")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Purchase Orders</CardTitle>
            <CardDescription>A comprehensive list of all your purchase orders.</CardDescription>
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
                    <TableHead>Created Date</TableHead>
                    <TableHead>Sent Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.length > 0 ? (
                    purchaseOrders.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium">{po.po_number}</TableCell>
                        <TableCell>{po.subject}</TableCell>
                        <TableCell>{po.supplier_name}</TableCell>
                        <TableCell>{po.buyer_name || "N/A"}</TableCell>
                        <TableCell>{po.items_count}</TableCell>
                        <TableCell>${po.total_amount?.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(po.status)}</TableCell>
                        <TableCell>{new Date(po.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{po.sent_at ? new Date(po.sent_at).toLocaleDateString() : "N/A"}</TableCell>
                        <TableCell>
                          <Button size="sm" asChild>
                            <Link href={`/purchase-orders/${po.id}`}>View Details</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground py-4">
                        No purchase orders found matching your criteria.
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
