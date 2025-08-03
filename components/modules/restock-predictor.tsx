"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Package, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { predictRestockAction } from "@/actions"
import { useActionState } from "react"

export default function RestockPredictor() {
  const [formData, setFormData] = useState({
    sku: "",
    recentSales: "",
    inventoryLevel: "",
    seasonalFactor: "",
  })
  const [prediction, setPrediction] = useState<any>(null)
  const { toast } = useToast()
  const formRef = useRef<HTMLFormElement>(null)

  const [state, action, isPredicting] = useActionState(async (prevState: any, formData: FormData) => {
    const result = await predictRestockAction(formData)
    if (result.success) {
      setPrediction(result.data)
      toast({
        title: "Prediction Generated",
        description: `Suggested quantity: ${result.data.predicted_quantity} units`,
      })
    } else {
      toast({
        title: "Prediction Failed",
        description: result.message,
        variant: "destructive",
      })
    }
    return result
  }, null) // Initial state can be null

  const getTrendColor = (trend: string) => {
    const colors: { [key: string]: string } = {
      Hot: "bg-red-100 text-red-800",
      Cold: "bg-blue-100 text-blue-800",
      Niche: "bg-purple-100 text-purple-800",
      Seasonal: "bg-orange-100 text-orange-800",
    }
    return colors[trend] || "bg-gray-100 text-gray-800"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Restock Predictor
        </CardTitle>
        <CardDescription>AI-powered SKU-level restock prediction using sales and inventory data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Form */}
        <form ref={formRef} action={action} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
                placeholder="Enter SKU"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recentSales">Recent Sales (weekly) *</Label>
              <Input
                id="recentSales"
                name="recentSales"
                type="number"
                value={formData.recentSales}
                onChange={(e) => setFormData((prev) => ({ ...prev, recentSales: e.target.value }))}
                placeholder="e.g., 25"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inventoryLevel">Current Inventory *</Label>
              <Input
                id="inventoryLevel"
                name="inventoryLevel"
                type="number"
                value={formData.inventoryLevel}
                onChange={(e) => setFormData((prev) => ({ ...prev, inventoryLevel: e.target.value }))}
                placeholder="e.g., 50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seasonalFactor">Seasonal Factor</Label>
              <Input
                id="seasonalFactor"
                name="seasonalFactor"
                type="number"
                step="0.1"
                value={formData.seasonalFactor}
                onChange={(e) => setFormData((prev) => ({ ...prev, seasonalFactor: e.target.value }))}
                placeholder="1.0 (normal)"
              />
            </div>
          </div>

          <Button type="submit" disabled={isPredicting} className="w-full">
            {isPredicting ? "Analyzing..." : "Predict Restock Quantity"}
          </Button>
        </form>

        {/* Prediction Results */}
        {prediction && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{prediction.predicted_quantity}</div>
                <div className="text-sm text-green-600">Predicted Quantity</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{Math.round(prediction.confidence_score * 100)}%</div>
                <div className="text-sm text-blue-600">Confidence Score</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Confidence Level</span>
                <Badge className={getTrendColor(prediction.trend_analysis)}>{prediction.trend_analysis}</Badge>
              </div>
              <Progress value={prediction.confidence_score * 100} className="h-2" />
            </div>

            {/* Gemini Reasoning */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <TrendingUp className="h-5 w-5 text-gray-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1"> Analysis</h4>
                  <p className="text-gray-700 text-sm">{prediction.reasoning}</p>
                </div>
              </div>
            </div>

            {prediction.confidence_score < 0.7 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Low Confidence Warning</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">Consider manual review due to low prediction confidence.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
