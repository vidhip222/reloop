"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Package, DollarSign, Clock, Recycle, Eye, FileText } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

// Import our module components
import RestockPredictor from "@/components/modules/restock-predictor"
import SupplierBenchmark from "@/components/modules/supplier-benchmark"
import POGenerator from "@/components/modules/po-generator"
import ReturnIntake from "@/components/modules/return-intake"
import ResaleTracker from "@/components/modules/resale-tracker"
import AnalyticsDashboard from "@/components/modules/analytics-dashboard"
import ReturnsManagementPage from "@/app/dashboard/returns/page"
import OrderManagementPage from "@/app/dashboard/orders/page" // Import the new OrderManagementPage

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalReturns: 0,
    activeOrders: 0,
    resaleListings: 0,
    monthlyRevenue: 0,
  })
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    checkUser()
    loadDashboardStats()
  }, [])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth")
      return
    }
    setUser(user)
  }

  const loadDashboardStats = async () => {
    // Load dashboard statistics
    try {
      const { data: returns } = await supabase.from("returns").select("*")

      const { data: orders } = await supabase.from("purchase_orders").select("*").eq("status", "active")

      setStats({
        totalReturns: returns?.length || 0,
        activeOrders: orders?.length || 0,
        resaleListings: 45, // Mock data
        monthlyRevenue: 12500, // Mock data
      })
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Recycle className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">ReLoop</span>
            <Badge variant="secondary">Dashboard</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, {user.email}</span>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeOrders}</div>
              <p className="text-xs text-muted-foreground">3 pending approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resale Listings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resaleListings}</div>
              <p className="text-xs text-muted-foreground">8 sold this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+8% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Modules */}
        <Tabs defaultValue="returns" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="returns">Returns & Resale</TabsTrigger>
            <TabsTrigger value="supplier">Supplier Intelligence</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="returns-management">Returns Management</TabsTrigger>
            <TabsTrigger value="order-management">Order Management</TabsTrigger> {/* New Tab Trigger */}
          </TabsList>

          {/* Returns & Resale Module */}
          <TabsContent value="returns" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReturnIntake />
              <ResaleTracker />
            </div>
            {/* Link to the dedicated Returns Management page */}
            <div className="flex justify-center mt-6">
              <Link href="/dashboard/returns">
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" /> View All Returns
                </Button>
              </Link>
            </div>
          </TabsContent>

          {/* Supplier Intelligence Module */}
          <TabsContent value="supplier" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RestockPredictor />
              <SupplierBenchmark />
            </div>
            <POGenerator />
            {/* Link to the dedicated Order Management page */}
            <div className="flex justify-center mt-6">
              <Link href="/dashboard/orders">
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" /> View All Orders
                </Button>
              </Link>
            </div>
          </TabsContent>

          {/* Analytics Module */}
          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          {/* Returns Management Module */}
          <TabsContent value="returns-management">
            <ReturnsManagementPage />
          </TabsContent>

          {/* Order Management Module */}
          <TabsContent value="order-management">
            <OrderManagementPage /> {/* Render the new OrderManagementPage component here */}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
