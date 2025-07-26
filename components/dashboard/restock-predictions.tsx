"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface RestockPrediction {
  sku: string
  productName: string
  currentStock: number
  predictedDemand: number
  recommendedOrder: number
  confidence: number
  seasonality: string
  trend: string
}

interface RestockPredictionsProps {
  predictions: RestockPrediction[]
  onCreatePO: (sku: string) => void
}

export function RestockPredictions({ predictions, onCreatePO }: RestockPredictionsProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend.toLowerCase()) {
      case "increasing":
      case "seasonal peak":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "decreasing":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9)
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          High
        </Badge>
      )
    if (confidence >= 0.8) return <Badge variant="secondary">Medium</Badge>
    return <Badge variant="outline">Low</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Restock Predictions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {predictions.map((prediction) => (
            <div key={prediction.sku} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-medium">{prediction.productName}</h4>
                  <Badge variant="outline">{prediction.sku}</Badge>
                  {getTrendIcon(prediction.trend)}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Current: </span>
                    {prediction.currentStock}
                  </div>
                  <div>
                    <span className="font-medium">Predicted: </span>
                    {prediction.predictedDemand}
                  </div>
                  <div>
                    <span className="font-medium">Recommended: </span>
                    {prediction.recommendedOrder}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Confidence: </span>
                    {getConfidenceBadge(prediction.confidence)}
                  </div>
                </div>
              </div>
              <Button size="sm" onClick={() => onCreatePO(prediction.sku)} className="ml-4">
                Create PO
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
