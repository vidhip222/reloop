"use client"

import Link from "next/link"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Mail, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/layout/header"

interface POItem {
  sku: string
  name: string
  quantity: number
  price: number
}

interface PurchaseOrder {
  id: string
  po_number: string
  subject: string
  status: "draft" | "sent" | "confirmed" | "delivered" | "received" | "cancelled" | "pending"
  total_amount: number
  items: POItem[]
  items_count: number
  negotiation_terms: string
  created_at: string
  po_sent_at: string | null
  supplier_id: string
  suppliers: { name: string; email: string }
  buyer_id: string | null
  buyers: { name: string } | null
}

export default function PODetailPage() {
  const params = useParams()
  const poId = params.id as string
  const [po, setPo] = useState<PurchaseOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (poId) {
      fetchPODetails()
    }
  }, [poId])

  const fetchPODetails = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/purchase-orders/${poId}`)
      const data = await response.json()
      if (response.ok) {
        setPo(data)
      } else {
        throw new Error(data.error || "Failed to fetch PO details")
      }
    } catch (error: any) {
      console.error("Error fetching PO details:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load purchase order details.",
        variant: "destructive",
      })
      setPo(null)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: PurchaseOrder["status"]) => {
    if (!po || isUpdatingStatus) return

    setIsUpdatingStatus(true)
    try {
      const response = await fetch(`/api/purchase-orders/${poId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()
      if (response.ok) {
        setPo((prevPo) => (prevPo ? { ...prevPo, status: newStatus } : null))
        toast({
          title: "Success",
          description: `PO status updated to "${newStatus}".`,
        })
      } else {
        throw new Error(data.error || "Failed to update PO status")
      }
    } catch (error: any) {
      console.error("Error updating PO status:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update PO status.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleSendEmail = async () => {
    if (!po || isSendingEmail) return

    setIsSendingEmail(true)
    try {
      const emailResponse = await fetch("/api/send-po-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poNumber: po.po_number,
          supplierEmail: po.suppliers.email,
          subject: po.subject,
          items: po.items,
          negotiationTerms: po.negotiation_terms,
        }),
      })

      const emailData = await emailResponse.json()
      if (!emailResponse.ok) {
        throw new Error(emailData.error || "Failed to send email")
      }

      // Update po_sent_at in DB
      const updateResponse = await fetch(`/api/purchase-orders/${poId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "sent", po_sent_at: new Date().toISOString() }),
      })

      const updateData = await updateResponse.json()
      if (!updateResponse.ok) {
        throw new Error(updateData.error || "Failed to update PO after email send")
      }

      setPo((prevPo) => (prevPo ? { ...prevPo, status: "sent", po_sent_at: new Date().toISOString() } : null))
      toast({
        title: "Email Sent",
        description: `Purchase order email sent to ${po.suppliers.email}.`,
      })
    } catch (error: any) {
      console.error("Error sending PO email:", error)
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send purchase order email.",
        variant: "destructive",
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!po) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <Header />
        <Card className="w-full max-w-2xl text-center p-8">
          <CardTitle className="text-2xl font-bold mb-4">PO Not Found</CardTitle>
          <CardDescription>The purchase order you are looking for does not exist or an error occurred.</CardDescription>
          <Button asChild className="mt-6">
            <Link href="/purchase-orders">Back to PO Tracker</Link>
          </Button>
        </Card>
      </div>
    )
  }

  const statusOptions: PurchaseOrder["status"][] = ["draft", "sent", "confirmed", "delivered", "received", "cancelled"]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Purchase Order #{po.po_number}</h1>
            <p className="text-gray-600">{po.subject}</p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleSendEmail}
              disabled={isSendingEmail || po.status === "sent" || po.status === "confirmed" || po.status === "received"}
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" /> Send PO Email
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="font-medium">PO Number:</span> {po.po_number}
              </p>
              <p>
                <span className="font-medium">Subject:</span> {po.subject}
              </p>
              <p>
                <span className="font-medium">Supplier:</span> {po.suppliers.name} ({po.suppliers.email})
              </p>
              <p>
                <span className="font-medium">Buyer:</span> {po.buyers?.name || "N/A"}
              </p>
              <p>
                <span className="font-medium">Total Amount:</span> ${po.total_amount.toFixed(2)}
              </p>
              <p>
                <span className="font-medium">Items Count:</span> {po.items_count}
              </p>
              <p>
                <span className="font-medium">Created At:</span> {new Date(po.created_at).toLocaleString()}
              </p>
              <p>
                <span className="font-medium">Sent At:</span>{" "}
                {po.po_sent_at ? new Date(po.po_sent_at).toLocaleString() : "Not Sent"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status & Negotiation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="po-status" className="text-sm font-medium">
                  Current Status
                </label>
                <Select value={po.status} onValueChange={handleStatusChange} disabled={isUpdatingStatus}>
                  <SelectTrigger id="po-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center">
                          {isUpdatingStatus && po.status === status && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          <span className="capitalize">{status}</span>
                          {po.status === status && !isUpdatingStatus && (
                            <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Negotiation Terms</p>
                <CardDescription className="whitespace-pre-wrap">
                  {po.negotiation_terms || "No AI-generated terms available."}
                </CardDescription>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
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
                  <TableHead>Total Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {po.items && po.items.length > 0 ? (
                  po.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.price.toFixed(2)}</TableCell>
                      <TableCell>${(item.quantity * item.price).toFixed(2)}</TableCell>
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
      </div>
    </div>
  )
}
