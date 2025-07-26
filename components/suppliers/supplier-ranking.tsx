"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Clock, MapPin } from "lucide-react"

interface Supplier {
  id: string
  name: string
  email: string
  deliverySpeed: number
  priceRating: number
  slaRating: number
  region: string
  status: string
}

interface SupplierRankingProps {
  suppliers: Supplier[]
  onCreatePO: (supplierId: string) => void
}

export function SupplierRanking({ suppliers, onCreatePO }: SupplierRankingProps) {
  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
      />
    ))
  }

  const getDeliveryBadge = (days: number) => {
    if (days <= 5) return <Badge className="bg-green-100 text-green-800">Fast</Badge>
    if (days <= 10) return <Badge variant="secondary">Standard</Badge>
    return <Badge variant="outline">Slow</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supplier Ranking</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {suppliers.map((supplier, index) => (
            <div key={supplier.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{supplier.name}</h4>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{supplier.region}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{supplier.deliverySpeed} days</span>
                      {getDeliveryBadge(supplier.deliverySpeed)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs">Price:</span>
                      <div className="flex">{getRatingStars(supplier.priceRating)}</div>
                      <span className="text-xs">({supplier.priceRating})</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs">SLA:</span>
                      <div className="flex">{getRatingStars(supplier.slaRating)}</div>
                      <span className="text-xs">({supplier.slaRating})</span>
                    </div>
                  </div>
                </div>
              </div>
              <Button size="sm" onClick={() => onCreatePO(supplier.id)}>
                Create PO
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
