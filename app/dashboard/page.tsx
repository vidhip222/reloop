"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { POForm } from "@/components/purchase-orders/po-form"
import { AddReturnForm } from "@/components/returns/add-return-form"
import { AddSupplierForm } from "@/components/suppliers/add-supplier-form"
import { AddBuyerForm } from "@/components/buyers/add-buyer-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Users, ShoppingCart, Loader2 } from "lucide-react"
import { mockAnalytics } from "@/lib/mock-data"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { getCurrentUser } from "@/lib/auth"

export default function DashboardPage() {
  const [suppliers, setSuppliers] = useState([])
  const [buyers, setBuyers] = useState([])
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPOForm, setShowPOForm] = useState(false)
  const [showReturnForm, setShowReturnForm] = useState(false)
  const [showSupplierForm, setShowSupplierForm] = useState(false)
  const [showBuyerForm, setShowBuyerForm] = useState(false)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      setLoading(true)
      const user = await getCurrentUser()
      if (!user) {
        router.push("/login")
        return
      }
      await loadData()
      setLoading(false)
    }
    checkAuthAndLoadData()
  }, [router])

  const loadData = async () => {
    try {
      const { data: suppliersData } = await supabase
        .from("suppliers")
        .select("*")
        .order("sla_rating", { ascending: false })

      const { data: buyersData } = await supabase.from("buyers").select("*").order("created_at", { ascending: false })

      const { data: poData } = await supabase
        .from("purchase_orders")
        .select("*, suppliers(name)")
        .order("created_at", { ascending: false })

      setSuppliers(suppliersData || [])
      setBuyers(buyersData || [])
      setPurchaseOrders(poData || [])
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Data Load Error",
        description: "Failed to load dashboard data.",
        variant: "destructive",
      })
    }
  }

  const handleCreatePO = (supplierId?: string) => {
    setSelectedSupplierId(supplierId)
    setShowPOForm(true)
  }

  const handlePOSubmit = async (data: any) => {
    try {
      const poNumber = `PO-${Date.now()}`
      const { error } = await supabase.from("purchase_orders").insert({
        po_number: poNumber,
        supplier_id: data.supplierId,
        subject: data.subject,
        items: data.items,
        negotiation_terms: data.negotiationTerms,
        total_amount: data.items.reduce((sum: number, item: any) => sum + item.quantity * item.price, 0),
        items_count: data.items.length,
        status: "draft",
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Purchase order created successfully",
      })

      setShowPOForm(false)
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create purchase order",
        variant: "destructive",
      })
    }
  }

  const handleReturnSubmit = async (data: any) => {
    try {
      const { error } = await supabase.from("return_items").insert({
        order_id: data.order_id,
        product_id: data.sku, // Map sku to product_id
        product_name: data.productName,
        return_reason: data.returnReason,
        purchase_date: data.purchaseDate,
        category: data.category,
        notes: data.notes,
        condition: data.condition, // New field
        images: data.images || [], // New field
        eligibility_status: "pending",
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Return item added successfully!",
      })

      setShowReturnForm(false)
      // No need to load return items here, ReturnsManagerPage handles it
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add return item",
        variant: "destructive",
      })
    }
  }

  const handleSupplierSubmit = async (data: any) => {
    try {
      const { error } = await supabase.from("suppliers").insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        region: data.region,
        avg_delivery_days: data.deliverySpeed, // Map deliverySpeed to avg_delivery_days
        price_rating: data.priceRating,
        sla_rating: data.slaRating,
        rating: (data.priceRating + data.slaRating) / 2, // Simple average for overall rating
        price_competitiveness: Math.floor(Math.random() * 50) + 50, // Mock 50-100
        reliability_score: Math.floor(Math.random() * 50) + 50, // Mock 50-100
        total_orders: Math.floor(Math.random() * 100), // Mock total orders
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Supplier added successfully",
      })

      setShowSupplierForm(false)
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add supplier",
        variant: "destructive",
      })
    }
  }

  const handleBuyerSubmit = async (data: any) => {
    try {
      const { error } = await supabase.from("buyers").insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        region: data.region,
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Buyer added successfully",
      })

      setShowBuyerForm(false)
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add buyer",
        variant: "destructive",
      })
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    )
  }

  if (showPOForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="p-6">
          <POForm
            suppliers={suppliers}
            onSubmit={handlePOSubmit}
            onCancel={() => setShowPOForm(false)}
            initialSupplierId={selectedSupplierId}
          />
        </div>
      </div>
    )
  }

  if (showReturnForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="p-6">
          <AddReturnForm onSubmit={handleReturnSubmit} onCancel={() => setShowReturnForm(false)} />
        </div>
      </div>
    )
  }

  if (showSupplierForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="p-6">
          <AddSupplierForm onSubmit={handleSupplierSubmit} onCancel={() => setShowSupplierForm(false)} />
        </div>
      </div>
    )
  }

  if (showBuyerForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="p-6">
          <AddBuyerForm onSubmit={handleBuyerSubmit} onCancel={() => setShowBuyerForm(false)} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex space-x-2">
            <Button onClick={() => setShowSupplierForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
            <Button onClick={() => setShowBuyerForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Buyer
            </Button>
            <Button onClick={() => setShowReturnForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Return
            </Button>
            <Button onClick={() => handleCreatePO()} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create PO
            </Button>
          </div>
        </div>

        <StatsCards stats={mockAnalytics} />

        <Tabs defaultValue="suppliers" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="suppliers" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Suppliers</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center space-x-2">
              <ShoppingCart className="h-4 w-4" />
              <span>Orders</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suppliers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Suppliers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {suppliers.map((supplier: any) => (
                    <div key={supplier.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{supplier.name}</h4>
                        <p className="text-sm text-muted-foreground">{supplier.email}</p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                          <span>{supplier.region}</span>
                          <span>{supplier.avg_delivery_days} days</span>
                          <span>Price: {supplier.price_rating}/5</span>
                          <span>SLA: {supplier.sla_rating}/5</span>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleCreatePO(supplier.id)}>
                        Create PO
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Purchase Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {purchaseOrders.map((po: any) => (
                    <div key={po.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium">{po.po_number}</h4>
                          {getStatusBadge(po.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{po.subject}</p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                          <span>Supplier: {po.suppliers?.name}</span>
                          <span>Total: ${po.total_amount?.toFixed(2)}</span>
                          <span>Items: {po.items_count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
