"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, Download, Search, Eye, Flag, Recycle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function ReturnsManagementPage() {
  const [returns, setReturns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedReturn, setSelectedReturn] = useState<any>(null) // State for selected return for modal
  const [isModalOpen, setIsModalOpen] = useState(false) // State to control modal visibility
  const { toast } = useToast()

  useEffect(() => {
    loadReturns()
  }, [filterStatus])

  const loadReturns = async () => {
    setIsLoading(true)
    try {
      let query = supabase.from("returns").select("*").order("created_at", { ascending: false })

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus)
      }

      const { data, error } = await query

      if (error) throw error
      setReturns(data || [])
    } catch (error) {
      console.error("Error loading returns:", error)
      toast({
        title: "Error",
        description: "Failed to load returns data.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredReturns = returns.filter(
    (item) =>
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.return_reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ai_action.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getActionColor = (action: string) => {
    const colors: { [key: string]: string } = {
      Relist: "bg-green-100 text-green-800",
      Outlet: "bg-blue-100 text-blue-800",
      ThirdWorld: "bg-purple-100 text-purple-800",
      Donate: "bg-yellow-100 text-yellow-800",
      Recycle: "bg-gray-100 text-gray-800",
      Resale: "bg-orange-100 text-orange-800",
      Review: "bg-red-100 text-red-800",
    }
    return colors[action] || "bg-gray-100 text-gray-800"
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      processed: "bg-green-100 text-green-800",
      flagged: "bg-red-100 text-red-800",
      listed_ebay: "bg-blue-100 text-blue-800",
      exported: "bg-purple-100 text-purple-800",
      sold: "bg-orange-100 text-orange-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const exportToCsv = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no items to export for the selected criteria.",
        variant: "default",
      })
      return
    }

    const headers = Object.keys(data[0]).join(",") + "\n"
    const csv = data
      .map((row) =>
        Object.values(row)
          .map((value) => `"${value}"`)
          .join(","),
      )
      .join("\n")
    const blob = new Blob([headers + csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "CSV Exported",
      description: `${filename} has been downloaded.`,
    })
  }

  const handleExportAllReturns = () => {
    exportToCsv(returns, "all_returns.csv")
  }

  const handleExportUnlistedReturns = () => {
    const unlisted = returns.filter((item) => item.status === "processed" || item.status === "flagged")
    exportToCsv(unlisted, "unlisted_returns.csv")
  }

  const handleViewDetails = (item: any) => {
    setSelectedReturn(item)
    setIsModalOpen(true)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Recycle className="h-5 w-5" />
            Returns Management
          </CardTitle>
          <CardDescription>View and manage all product returns, including flagged items.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by SKU, reason, or AI action..."
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
                <SelectItem value="processed">Processed</SelectItem>
                <SelectItem value="flagged">Flagged for Review</SelectItem>
                <SelectItem value="listed_ebay">Listed on eBay</SelectItem>
                <SelectItem value="exported">Exported</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExportAllReturns} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export All CSV
            </Button>
            <Button onClick={handleExportUnlistedReturns} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Unlisted CSV
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading returns...</div>
          ) : filteredReturns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No returns found matching your criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Return Reason</TableHead>
                    <TableHead>AI Action</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Override</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReturns.map((item) => (
                    <TableRow key={item.id} className={item.status === "flagged" ? "bg-red-50" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.image_url && (
                            <img
                              src={item.image_url || "/placeholder.svg"}
                              alt={item.sku}
                              className="w-8 h-8 rounded object-cover"
                            />
                          )}
                          <span className="font-medium">{item.sku}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{item.return_reason}</TableCell>
                      <TableCell>
                        <Badge className={getActionColor(item.ai_action)}>{item.ai_action}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status)}>{item.status.replace("_", " ")}</Badge>
                      </TableCell>
                      <TableCell>
                        {item.manual_override ? (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                            <Flag className="h-3 w-3 mr-1" /> {item.manual_override}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(item.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(item)}>
                          <Eye className="h-4 w-4 mr-1" /> View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Return Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-green-50">
          <DialogHeader>
            <DialogTitle>Return Details: {selectedReturn?.sku}</DialogTitle>
            <DialogDescription>Comprehensive information about this returned item.</DialogDescription>
          </DialogHeader>
          {selectedReturn && (
            <div className="grid gap-4 py-4">
              {selectedReturn.image_url && (
                <img
                  src={selectedReturn.image_url || "/placeholder.svg"}
                  alt={selectedReturn.sku}
                  className="max-h-48 w-full object-contain rounded-md mb-4"
                />
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">SKU:</div>
                <div>{selectedReturn.sku}</div>
                <div className="font-medium">Return Reason:</div>
                <div>{selectedReturn.return_reason}</div>
                <div className="font-medium">AI Action:</div>
                <div>
                  <Badge className={getActionColor(selectedReturn.ai_action)}>{selectedReturn.ai_action}</Badge>
                </div>
                <div className="font-medium">AI Confidence:</div>
                <div>{Math.round(selectedReturn.ai_confidence * 100)}%</div>
                <div className="font-medium">Status:</div>
                <div>
                  <Badge className={getStatusColor(selectedReturn.status)}>
                    {selectedReturn.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="font-medium">Manual Override:</div>
                <div>
                  {selectedReturn.manual_override ? (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      <Flag className="h-3 w-3 mr-1" /> {selectedReturn.manual_override}
                    </Badge>
                  ) : (
                    "None"
                  )}
                </div>
                {selectedReturn.relist_platform && (
                  <>
                    <div className="font-medium">Relist Platform:</div>
                    <div>{selectedReturn.relist_platform}</div>
                  </>
                )}
                <div className="font-medium">Date Processed:</div>
                <div>{new Date(selectedReturn.created_at).toLocaleDateString()}</div>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-1">AI Reasoning:</h4>
                <p className="text-sm text-gray-700">{selectedReturn.ai_reasoning}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
