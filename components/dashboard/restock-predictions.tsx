"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { mockRestockRecommendations } from "@/lib/mock-data"

interface RestockRecommendation {
  id: string
  product_id: string
  product_name: string
  current_stock: number
  recommended_quantity: number
  confidence_score: number
  urgency: "low" | "medium" | "high"
  predicted_stockout_date: string
  supplier_id: string
  supplier_name: string
  ai_reasoning: string
  status: string
}

export function RestockPredictions() {
  const [recommendations, setRecommendations] = useState<RestockRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const fetchRecommendations = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/restock-recommendations")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setRecommendations(data)
    } catch (error: any) {
      console.error("Error fetching restock recommendations:", error)
      toast({
        title: "Data Load Error",
        description: `Failed to load restock recommendations. ${error.message}`,
        variant: "destructive",
      })
      setRecommendations(mockRestockRecommendations) // Fallback to mock data
    } finally {
      setLoading(false)
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Restock Predictions</CardTitle>
        <CardDescription>Intelligent recommendations to optimize inventory levels.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Recommended Qty</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Stockout Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recommendations.length > 0 ? (
                recommendations.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell className="font-medium">{rec.product_name}</TableCell>
                    <TableCell>{rec.current_stock}</TableCell>
                    <TableCell>{rec.recommended_quantity}</TableCell>
                    <TableCell>
                      <Badge className={getUrgencyColor(rec.urgency)}>{rec.urgency}</Badge>
                    </TableCell>
                    <TableCell>{new Date(rec.predicted_stockout_date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                    No restock recommendations available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
