"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Mail, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/layout/header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { POForm } from "@/components/purchase-orders/po-form"
import type { PurchaseOrder, PurchaseOrderItem } from "@/types"
import { supabase } from "@/lib/supabase"

export default function PurchaseOrderDetailPage() {
  const params = useParams()
  const poId = params.id as string
  const router = useRouter()
  const { toast } = useToast()

  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)

  useEffect(() => {
    if (poId) {
      fetchPurchaseOrder()
    }
  }, [poId])

  const fetchPurchaseOrder = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/purchase-orders/${poId}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setPurchaseOrder(data)
    } catch (error: any) {
      console.error("Error fetching purchase order details:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load purchase order details.",
        variant: "destructive",
      })
      setPurchaseOrder(null)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: PurchaseOrder["status"]) => {
    if (!purchaseOrder) return

    setIsUpdatingStatus(true)
    try {
      const response = await fetch(`/api/purchase-orders/${poId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      toast({
        title: "Success",
        description: `Purchase order status updated to ${newStatus}.`,
      })
      fetchPurchaseOrder() // Refresh data
    } catch (error: any) {
      console.error("Error updating PO status:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update PO status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleSendEmail = async () => {
    if (!purchaseOrder) return

    // Basic HTML content for the email
    const htmlContent = `
      <h1>Purchase Order: ${purchaseOrder.po_number}</h1>
      <p>Subject: ${purchaseOrder.subject}</p>
      <p>Supplier: ${purchaseOrder.suppliers?.name || "N/A"}</p>
      <p>Total Amount: $${purchaseOrder.total_amount?.toFixed(2)}</p>
      <h2>Items:</h2>
      <ul>
        ${purchaseOrder.items
          ?.map(
            (item: PurchaseOrderItem) =>
              `<li>${item.product_name} (SKU: ${item.product_id}) - Qty: ${item.quantity} @ $${item.unit_price?.toFixed(2)} each</li>`,
          )
          .join("")}
      </ul>
      ${purchaseOrder.negotiation_terms ? `<h2>Negotiation Terms:</h2><p>${purchaseOrder.negotiation_terms}</p>` : ""}
      <p>Please review and confirm this purchase order.</p>
    `

    try {
      const supplierEmail = (
        await supabase.from("suppliers").select("email").eq("id", purchaseOrder.supplier_id).single()
      ).data?.email

      if (!supplierEmail) {
        toast({
          title: "Error",
          description: "Supplier email not found. Cannot send email.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/send-po-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: supplierEmail,
          subject: `Purchase Order: ${purchaseOrder.po_number} - ${purchaseOrder.subject}`,
          htmlContent: htmlContent,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      toast({
        title: "Email Sent",
        description: `Purchase order email sent to ${supplierEmail}.`,
      })
      // Optionally update PO status to 'sent' after email
      handleStatusChange("sent")
    } catch (error: any) {
      console.error("Error sending PO email:", error)
      toast({
        title: "Email Error",
        description: error.message || "Failed to send purchase order email. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeletePO = async () => {
    if (!poId) return

    try {
      const response = await fetch(`/api/purchase-orders/${poId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      toast({
        title: "Success",
        description: "Purchase order deleted successfully.",
      })
      router.push("/purchase-orders") // Redirect to PO list
      router.refresh()
    } catch (error: any) {
      console.error("Error deleting PO:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete purchase order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setShowDeleteConfirm(false)
    }
  }

  const handleEditSuccess = () => {
    setShowEditForm(false)
    fetchPurchaseOrder() // Refresh data after edit
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

  if (!purchaseOrder) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold">Purchase Order Not Found</h2>
          <p className="text-muted-foreground">The requested purchase order could not be loaded.</p>
          <Button onClick={() => router.push("/purchase-orders")} className="mt-4">
            Back to Purchase Orders
          </Button>
        </div>
      </div>
    )
  }

  if (showEditForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="p-6">
          <POForm initialData={purchaseOrder} onSuccess={handleEditSuccess} onCancel={() => setShowEditForm(false)} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Purchase Order Details</h1>
          <div className="flex space-x-2">
            <Button onClick={() => setShowEditForm(true)} variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" /> Edit PO
            </Button>
            <Button onClick={() => setShowDeleteConfirm(true)} variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" /> Delete PO
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>PO Number: {purchaseOrder.po_number}</span>
              {getStatusBadge(purchaseOrder.status)}
            </CardTitle>
            <CardDescription>{purchaseOrder.subject}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p>
                <strong>Supplier:</strong> {purchaseOrder.suppliers?.name || "N/A"}
              </p>
              <p>
                <strong>Buyer:</strong> {purchaseOrder.buyers?.name || "N/A"}
              </p>
              <p>
                <strong>Total Amount:</strong> ${purchaseOrder.total_amount?.toFixed(2)}
              </p>
              <p>
                <strong>Items Count:</strong> {purchaseOrder.items_count}
              </p>
            </div>
            <div>
              <p>
                <strong>Created At:</strong> {new Date(purchaseOrder.created_at).toLocaleDateString()}
              </p>
              <p>
                <strong>Sent At:</strong>{" "}
                {purchaseOrder.sent_at ? new Date(purchaseOrder.sent_at).toLocaleDateString() : "N/A"}
              </p>
              <p>
                <strong>Expected Delivery:</strong>{" "}
                {purchaseOrder.expected_delivery_date
                  ? new Date(purchaseOrder.expected_delivery_date).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Items in Order</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Line Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrder.items && purchaseOrder.items.length > 0 ? (
                  purchaseOrder.items.map((item: PurchaseOrderItem, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{item.product_id}</TableCell>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.unit_price?.toFixed(2)}</TableCell>
                      <TableCell>${(item.quantity * (item.unit_price || 0)).toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                      No items in this purchase order.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {purchaseOrder.negotiation_terms && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Negotiation Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{purchaseOrder.negotiation_terms}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 grid gap-2">
              <label htmlFor="status-update" className="text-sm font-medium">
                Update Status
              </label>
              <Select value={purchaseOrder.status} onValueChange={handleStatusChange} disabled={isUpdatingStatus}>
                <SelectTrigger id="status-update">
                  <SelectValue placeholder="Change Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {isUpdatingStatus && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
            </div>
            <div className="flex-1 flex items-end">
              <Button onClick={handleSendEmail} className="w-full" disabled={isUpdatingStatus}>
                <Mail className="h-4 w-4 mr-2" /> Send PO Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeletePO}
        title="Confirm Deletion"
        description={`Are you sure you want to delete Purchase Order ${purchaseOrder.po_number}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}
