"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, CheckCircle, XCircle, Brain, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/layout/header"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { ReturnClassification } from "@/components/returns/return-classification"
import { exportToCsv } from "@/lib/csv-export"

interface ReturnItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  return_reason: string
  purchase_date: string
  category: string
  notes: string | null
  condition: string
  images: string[] | null
  eligibility_status: "pending" | "approved" | "rejected"
  classification_ai: string | null
  resale_platform_ai: string | null
  created_at: string
}

export default function ReturnsManagerPage() {
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [showClassificationDialog, setShowClassificationDialog] = useState(false)
  const [selectedReturnItem, setSelectedReturnItem] = useState<ReturnItem | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null)
  const [confirmItemId, setConfirmItemId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchReturnItems()
  }, [])

  const fetchReturnItems = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/returns")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setReturnItems(data)
    } catch (error: any) {
      console.error("Error fetching return items:", error)
      toast({
        title: "Data Load Error",
        description: `Failed to load return items. ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProcessReturn = async (id: string, action: "approve" | "reject") => {
    setProcessingId(id)
    try {
      const response = await fetch(`/api/returns/${id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      toast({
        title: "Success",
        description: `Return ${id} ${action}d successfully!`,
      })
      fetchReturnItems() // Refresh data
    } catch (error: any) {
      console.error(`Error ${action}ing return:`, error)
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} return. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
      setShowConfirmDialog(false)
      setConfirmAction(null)
      setConfirmItemId(null)
    }
  }

  const handleClassifyReturn = async (item: ReturnItem) => {
    setSelectedReturnItem(item)
    setShowClassificationDialog(true)
  }

  const handleClassificationComplete = async () => {
    setShowClassificationDialog(false)
    setSelectedReturnItem(null)
    fetchReturnItems() // Refresh data after classification
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    }
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    )
  }

  const handleExport = () => {
    const fields = [
      { key: "id", header: "Return ID" },
      { key: "order_id", header: "Order ID" },
      { key: "product_name", header: "Product Name" },
      { key: "return_reason", header: "Return Reason" },
      { key: "purchase_date", header: "Purchase Date" },
      { key: "category", header: "Category" },
      { key: "condition", header: "Condition" },
      { key: "eligibility_status", header: "Status" },
      { key: "classification_ai", header: "AI Classification" },
      { key: "resale_platform_ai", header: "AI Resale Platform" },
      { key: "created_at", header: "Created At" },
    ]
    exportToCsv(returnItems, fields, "return_items")
    toast({
      title: "Export Successful",
      description: "Return items exported to CSV.",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Returns Manager</h1>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" /> Export to CSV
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Return Requests</CardTitle>
            <CardDescription>Manage and process customer return requests.</CardDescription>
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
                    <TableHead>Return ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>AI Classification</TableHead>
                    <TableHead>AI Resale Platform</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returnItems.length > 0 ? (
                    returnItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.id.substring(0, 8)}...</TableCell>
                        <TableCell>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">Order: {item.order_id}</p>
                        </TableCell>
                        <TableCell>{item.return_reason}</TableCell>
                        <TableCell className="capitalize">{item.condition}</TableCell>
                        <TableCell>{getStatusBadge(item.eligibility_status)}</TableCell>
                        <TableCell>
                          {item.classification_ai || <span className="text-muted-foreground">Not classified</span>}
                        </TableCell>
                        <TableCell>
                          {item.resale_platform_ai || <span className="text-muted-foreground">Not suggested</span>}
                        </TableCell>
                        <TableCell className="space-x-2">
                          {item.eligibility_status === "pending" ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleClassifyReturn(item)}
                                disabled={processingId === item.id}
                              >
                                {processingId === item.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Brain className="h-4 w-4" />
                                )}
                                <span className="sr-only">Classify with AI</span>
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setConfirmItemId(item.id)
                                  setConfirmAction("approve")
                                  setShowConfirmDialog(true)
                                }}
                                disabled={processingId === item.id}
                              >
                                {processingId === item.id && confirmAction === "approve" ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                                <span className="sr-only">Approve</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setConfirmItemId(item.id)
                                  setConfirmAction("reject")
                                  setShowConfirmDialog(true)
                                }}
                                disabled={processingId === item.id}
                              >
                                {processingId === item.id && confirmAction === "reject" ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <XCircle className="h-4 w-4" />
                                )}
                                <span className="sr-only">Reject</span>
                              </Button>
                            </>
                          ) : (
                            <span className="text-muted-foreground text-sm">Processed</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-4">
                        No return requests found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedReturnItem && (
        <ReturnClassification
          isOpen={showClassificationDialog}
          onClose={() => setShowClassificationDialog(false)}
          returnItem={selectedReturnItem}
          onClassifySuccess={handleClassificationComplete}
        />
      )}

      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={() => {
          if (confirmItemId && confirmAction) {
            handleProcessReturn(confirmItemId, confirmAction)
          }
        }}
        title={`Confirm ${confirmAction === "approve" ? "Approval" : "Rejection"}`}
        description={`Are you sure you want to ${confirmAction} this return request? This action cannot be undone.`}
        confirmText={confirmAction === "approve" ? "Approve" : "Reject"}
        cancelText="Cancel"
      />
    </div>
  )
}
