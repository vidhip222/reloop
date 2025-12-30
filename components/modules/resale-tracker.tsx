"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ShoppingCart, ExternalLink, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export default function ResaleTracker() {
  const [returns, setReturns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isListing, setIsListing] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState("")
  const { toast } = useToast()
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || ""

  useEffect(() => {
    if (tenantId) {
      loadProcessedReturns()
    } else {
      setReturns([])
      setIsLoading(false)
    }
  }, [tenantId])

  const loadProcessedReturns = async () => {
    try {
      // Fetch all returns that are in a processed or listed state
      let query = supabase
        .from("returns")
        .select("*")
        .in("status", ["processed", "listed_ebay", "exported", "sold"])
        .order("created_at", { ascending: false })
        .limit(10)
      if (tenantId) {
        query = query.eq("tenant_id", tenantId)
      }
      const { data, error } = await query

      if (error) throw error

      // Client-side filtering based on effective action (AI action or manual override)
      const filteredData = (data || []).filter((item) => {
        const effectiveAction = item.manual_override || item.ai_action
        return ["Relist", "Resale", "Outlet"].includes(effectiveAction)
      })

      setReturns(filteredData)
    } catch (error) {
      console.error("Error loading returns:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getAuthHeader = async () => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const handleEbayListing = async (returnItem: any) => {
    setIsListing(returnItem.id)
    try {
      const listingData = {
        title: `${returnItem.sku} - Quality Return Item`,
        description: `Returned item in good condition. Reason: ${returnItem.return_reason}`,
        price: 29.99,
        category: "1234",
        images: [returnItem.image_url],
        condition: "Used",
      }
      const headers = await getAuthHeader()
      const response = await fetch(`${apiBase}/returns/${returnItem.id}/list/ebay`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(listingData),
      })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      const result = await response.json()

      if (result.success) {
        toast({
          title: "eBay Listing Created",
          description: `Item listed successfully. ID: ${result.item_id || "pending"}`,
        })

        loadProcessedReturns()
      } else {
        throw new Error("eBay listing failed")
      }
    } catch (error) {
      toast({
        title: "Listing Failed",
        description: "Failed to create eBay listing. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsListing(null)
    }
  }

  const handleThredUpExport = async (returnItem: any) => {
    try {
      const headers = await getAuthHeader()
      const response = await fetch(`${apiBase}/returns/${returnItem.id}/export/thredup`, {
        method: "POST",
        headers: { ...headers },
      })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      const csvText = await response.text()
      const blob = new Blob([csvText], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `thredup_export_${returnItem.sku}.csv`
      a.click()
      toast({
        title: "Export Generated",
        description: "ThredUp CSV downloaded.",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not export for ThredUp.",
        variant: "destructive",
      })
    }
  }

  const getActionColor = (action: string) => {
    const colors: { [key: string]: string } = {
      Relist: "bg-green-100 text-green-800",
      Outlet: "bg-blue-100 text-blue-800",
      Resale: "bg-orange-100 text-orange-800",
    }
    return colors[action] || "bg-gray-100 text-gray-800"
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      processed: "bg-yellow-100 text-yellow-800",
      listed_ebay: "bg-green-100 text-green-800",
      exported: "bg-blue-100 text-blue-800",
      sold: "bg-purple-100 text-purple-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resale Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading resale items...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Resale Tracker
        </CardTitle>
        <CardDescription>Manage and track resale listings across platforms</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-2">
          <label className="text-sm font-medium">Tenant ID</label>
          <Input
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            placeholder="Tenant UUID"
          />
        </div>
        {/* Platform Sync Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-green-900">Platform Status</h4>
              <p className="text-green-800 text-sm">eBay API | other 📤 Export</p>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Sync All
            </Button>
          </div>
        </div>

        {/* Returns Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>AI Action</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Return Reason</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returns.map((returnItem) => (
                <TableRow key={returnItem.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {returnItem.image_url && (
                        <img
                          src={returnItem.image_url || "/placeholder.svg"}
                          alt={returnItem.sku}
                          className="w-8 h-8 rounded object-cover"
                        />
                      )}
                      <span className="font-medium">{returnItem.sku}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getActionColor(returnItem.manual_override || returnItem.ai_action)}>
                      {returnItem.manual_override || returnItem.ai_action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(returnItem.status)}>{returnItem.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{returnItem.return_reason}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {returnItem.status === "processed" && (
                        <>
                          {/* eBay Live Listing */}
                          <Button
                            size="sm"
                            onClick={() => handleEbayListing(returnItem)}
                            disabled={isListing === returnItem.id}
                          >
                            {isListing === returnItem.id ? "Listing..." : "List on eBay"}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleThredUpExport(returnItem)}>
                            Export ThredUp
                          </Button>
                        </>
                      )}

                      {returnItem.status === "listed_ebay" && (
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View Listing
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {returns.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No items ready for resale. Process returns to see them here.
          </div>
        )}

        {/* Resale Insights */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">12</div>
            <div className="text-sm text-blue-600">Active Listings</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-700">8</div>
            <div className="text-sm text-green-600">Sold This Week</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-700">$1,240</div>
            <div className="text-sm text-purple-600">Revenue This Month</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
