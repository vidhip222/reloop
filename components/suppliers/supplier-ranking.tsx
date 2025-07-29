"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { mockSuppliers } from "@/lib/mock-data"

interface Supplier {
  id: string
  name: string
  rating: number
  avg_delivery_days: number
  price_competitiveness: number
  reliability_score: number
  total_orders: number
}

export function SupplierRanking() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/suppliers")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setSuppliers(data)
    } catch (error: any) {
      console.error("Error fetching suppliers:", error)
      toast({
        title: "Data Load Error",
        description: `Failed to load suppliers. ${error.message}`,
        variant: "destructive",
      })
      setSuppliers(mockSuppliers) // Fallback to mock data
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supplier Performance Rankings</CardTitle>
        <CardDescription>Compare suppliers based on pricing, delivery, and reliability.</CardDescription>
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
                <TableHead>Supplier</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Avg Delivery</TableHead>
                <TableHead>Price Competitiveness</TableHead>
                <TableHead>Reliability</TableHead>
                <TableHead>Total Orders</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.length > 0 ? (
                suppliers
                  .sort((a, b) => b.rating - a.rating) // Sort by rating descending
                  .map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <span>{supplier.rating.toFixed(1)}</span>
                          <span className="text-yellow-500">★</span>
                        </div>
                      </TableCell>
                      <TableCell>{supplier.avg_delivery_days} days</TableCell>
                      <TableCell>
                        <Progress value={supplier.price_competitiveness} className="w-16" />
                      </TableCell>
                      <TableCell>
                        <Progress value={supplier.reliability_score} className="w-16" />
                      </TableCell>
                      <TableCell>{supplier.total_orders}</TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                    No suppliers available.
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
