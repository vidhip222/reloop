"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, AlertCircle, XCircle } from "lucide-react"
import { classifyReturnItem, suggestResalePlatform } from "@/lib/gemini"

interface ReturnItem {
  id: string
  sku: string
  productName: string
  returnReason: string
  category: string
  notes: string
  classification?: string
  resalePlatform?: string
  eligibilityStatus: string
  aiReasoning?: string
}

interface ReturnClassificationProps {
  items: ReturnItem[]
  onClassificationUpdate: (itemId: string, classification: string, reasoning: string, platform?: string) => void
}

export function ReturnClassification({ items, onClassificationUpdate }: ReturnClassificationProps) {
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set())

  const handleClassifyItem = async (item: ReturnItem) => {
    setProcessingItems((prev) => new Set(prev).add(item.id))

    try {
      const classification = await classifyReturnItem({
        productName: item.productName,
        returnReason: item.returnReason,
        category: item.category,
        notes: item.notes,
      })

      let platform = undefined
      if (classification.classification === "marketplace") {
        const platformSuggestion = await suggestResalePlatform({
          category: item.category,
          value: 100, // Mock value
          condition: "good",
        })
        platform = platformSuggestion.platform
      }

      onClassificationUpdate(item.id, classification.classification, classification.reasoning, platform)
    } catch (error) {
      console.error("Classification failed:", error)
    } finally {
      setProcessingItems((prev) => {
        const newSet = new Set(prev)
        newSet.delete(item.id)
        return newSet
      })
    }
  }

  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case "relist":
        return <Badge className="bg-green-100 text-green-800">Relist</Badge>
      case "outlet":
        return <Badge className="bg-blue-100 text-blue-800">Outlet</Badge>
      case "marketplace":
        return <Badge className="bg-purple-100 text-purple-800">Marketplace</Badge>
      case "discard":
        return <Badge className="bg-red-100 text-red-800">Discard</Badge>
      case "review":
        return <Badge variant="outline">Manual Review</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  const getEligibilityIcon = (status: string) => {
    switch (status) {
      case "eligible":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "flagged":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case "denied":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getPlatformName = (platform: string) => {
    const platforms: Record<string, string> = {
      ebay: "eBay",
      poshmark: "Poshmark",
      therealreal: "TheRealReal",
      mercari: "Mercari",
      facebook: "Facebook Marketplace",
      thredup: "ThredUp",
      depop: "Depop",
    }
    return platforms[platform] || platform
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Return Item Classification</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium">{item.productName}</h4>
                    <Badge variant="outline">{item.sku}</Badge>
                    {getEligibilityIcon(item.eligibilityStatus)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-3">
                    <div>
                      <span className="font-medium">Reason: </span>
                      {item.returnReason}
                    </div>
                    <div>
                      <span className="font-medium">Category: </span>
                      {item.category}
                    </div>
                    <div>
                      <span className="font-medium">Status: </span>
                      {item.eligibilityStatus}
                    </div>
                  </div>
                  {item.notes && (
                    <p className="text-sm text-muted-foreground mb-3">
                      <span className="font-medium">Notes: </span>
                      {item.notes}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end space-y-2">
                  {getClassificationBadge(item.classification || "pending")}
                  {item.resalePlatform && (
                    <Badge variant="outline" className="text-xs">
                      {getPlatformName(item.resalePlatform)}
                    </Badge>
                  )}
                </div>
              </div>

              {item.aiReasoning && (
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <p className="text-sm">
                    <span className="font-medium">AI Reasoning: </span>
                    {item.aiReasoning}
                  </p>
                </div>
              )}

              {!item.classification && (
                <Button onClick={() => handleClassifyItem(item)} disabled={processingItems.has(item.id)} size="sm">
                  {processingItems.has(item.id) ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Classifying...
                    </>
                  ) : (
                    "Classify with AI"
                  )}
                </Button>
              )}
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
