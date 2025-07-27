"use client"

import { Label } from "@/components/ui/label"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, AlertCircle, XCircle } from "lucide-react"
import { classifyReturnItem, suggestResalePlatform } from "@/lib/gemini"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  ai_suggested_platform?: string | null // New field
  suggestion_reason?: string | null // New field
  final_platform_choice?: string | null // New field
}

interface ReturnClassificationProps {
  items: ReturnItem[]
  onClassificationUpdate: (itemId: string, classification: string, reasoning: string, platform?: string) => void
  onFinalPlatformChange: (itemId: string, newPlatform: string) => void // New prop for manual override
}

export function ReturnClassification({
  items,
  onClassificationUpdate,
  onFinalPlatformChange,
}: ReturnClassificationProps) {
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set())

  const handleClassifyItem = async (item: ReturnItem) => {
    setProcessingItems((prev) => new Set(prev).add(item.id))

    try {
      const classification = await classifyReturnItem({
        productName: item.productName,
        returnReason: item.returnReason,
        category: item.category,
        notes: item.notes,
        imageUrl: item.images && item.images[0] ? item.images[0] : undefined,
      })

      let platform = undefined
      if (classification.classification === "marketplace") {
        const platformSuggestion = await suggestResalePlatform({
          category: item.category,
          value: 100, // Mock value
          condition: item.condition || "good",
        })
        platform = platformSuggestion.platform
      }

      onClassificationUpdate(
        item.id,
        classification.classification,
        classification.reasoning,
        platform,
        classification.ai_suggested_platform, // Pass new AI fields
        classification.suggestion_reason, // Pass new AI fields
      )
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
      case "manual_review":
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
      "outlet store": "Outlet Store",
      donate: "Donate",
      recycle: "Recycle",
    }
    return platforms[platform.toLowerCase()] || platform
  }

  const resalePlatforms = [
    "eBay",
    "Poshmark",
    "TheRealReal",
    "Mercari",
    "Facebook Marketplace",
    "ThredUp",
    "Depop",
    "Outlet Store",
    "Donate",
    "Recycle",
  ]

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

              {item.ai_suggested_platform && (
                <div className="bg-purple-50 p-3 rounded-lg mb-4">
                  <p className="text-sm">
                    <span className="font-medium">AI Suggested Platform: </span>
                    {getPlatformName(item.ai_suggested_platform)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Reason: </span>
                    {item.suggestion_reason}
                  </p>
                </div>
              )}

              <div className="flex items-center space-x-4">
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

                {item.ai_classification && (
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`final-platform-${item.id}`} className="text-sm">
                      Final Platform:
                    </Label>
                    <Select
                      value={item.final_platform_choice || ""}
                      onValueChange={(value) => onFinalPlatformChange(item.id, value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select final platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {resalePlatforms.map((platform) => (
                          <SelectItem key={platform} value={platform}>
                            {platform}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
