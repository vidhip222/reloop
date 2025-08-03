"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, TrendingUp, TrendingDown, Flag, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function SupplierBenchmark() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSuppliers()
  }, [])

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase.from("suppliers").select("*").order("sla_grade", { ascending: false })

      if (error) throw error
      setSuppliers(data || [])
    } catch (error) {
      console.error("Error loading suppliers:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSupplierFlag = async (supplierId: string, currentFlag: boolean) => {
    try {
      const { error } = await supabase.from("suppliers").update({ flagged: !currentFlag }).eq("id", supplierId)

      if (error) throw error

      setSuppliers((prev) => prev.map((s) => (s.id === supplierId ? { ...s, flagged: !currentFlag } : s)))
    } catch (error) {
      console.error("Error updating supplier flag:", error)
    }
  }

  const getGradeColor = (grade: string) => {
    const colors: { [key: string]: string } = {
      "A+": "bg-green-100 text-green-800",
      A: "bg-green-100 text-green-800",
      "B+": "bg-blue-100 text-blue-800",
      B: "bg-blue-100 text-blue-800",
      "C+": "bg-yellow-100 text-yellow-800",
      C: "bg-yellow-100 text-yellow-800",
      D: "bg-red-100 text-red-800",
      F: "bg-red-100 text-red-800",
    }
    return colors[grade] || "bg-gray-100 text-gray-800"
  }

  const getPerformanceIcon = (rate: number, threshold: number) => {
    if (rate > threshold) {
      return <TrendingDown className="h-4 w-4 text-red-500" />
    }
    return <TrendingUp className="h-4 w-4 text-green-500" />
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Supplier Benchmark</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading suppliers...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Supplier Benchmark
        </CardTitle>
        <CardDescription>Live supplier performance metrics and quality scoring</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Gemini Insights */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900">Insight</h4>
              <p className="text-blue-800 text-sm mt-1">
                Flag Supplier "QuickShip Co" — 90% of their returns are defective. Consider switching to "ReliableParts
                Inc" for better quality.
              </p>
            </div>
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Delivery Time</TableHead>
                <TableHead>Return Rate</TableHead>
                <TableHead>Defect Rate</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>SLA Grade</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id} className={supplier.flagged ? "bg-red-50" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{supplier.name}</span>
                      {supplier.flagged && <Flag className="h-4 w-4 text-red-500" />}
                    </div>
                    <div className="text-sm text-gray-500">{supplier.location}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {supplier.avg_delivery_time} days
                      {getPerformanceIcon(supplier.avg_delivery_time, 7)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {supplier.return_rate}%{getPerformanceIcon(supplier.return_rate, 5)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {supplier.defect_rate}%{getPerformanceIcon(supplier.defect_rate, 3)}
                    </div>
                  </TableCell>
                  <TableCell>${supplier.unit_cost}</TableCell>
                  <TableCell>
                    <Badge className={getGradeColor(supplier.sla_grade)}>{supplier.sla_grade}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={supplier.flagged ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => toggleSupplierFlag(supplier.id, supplier.flagged)}
                    >
                      {supplier.flagged ? (
                        <>
                          <Flag className="h-4 w-4 mr-1" />
                          Flagged
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Active
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {suppliers.length === 0 && (
          <div className="text-center py-8 text-gray-500">No suppliers found. Add suppliers to see benchmarks.</div>
        )}
      </CardContent>
    </Card>
  )
}
