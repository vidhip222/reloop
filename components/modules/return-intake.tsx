"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Camera, CheckCircle, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { classifyReturnAction, processReturnAction } from "@/actions"
import { useActionState } from "react"

export default function ReturnIntake() {
  const [formData, setFormData] = useState({
    sku: "",
    brand: "",
    returnReason: "",
    tags: "",
    imageUrl: "",
  })
  const [aiResult, setAiResult] = useState<any>(null)
  const [showReasoning, setShowReasoning] = useState(false)
  const [manualOverride, setManualOverride] = useState("")
  const [relistPlatform, setRelistPlatform] = useState("") // New state for relist platform
  const { toast } = useToast()
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null) // Ref for the file input

  const [classifyState, classifyAction, isClassifying] = useActionState(async (prevState: any, formData: FormData) => {
    const result = await classifyReturnAction(formData)
    if (result.success) {
      setAiResult(result.data)
      toast({
        title: "Return Classified",
        description: `AI suggests: ${result.data.action} (${Math.round(result.data.confidence * 100)}% confidence)`,
      })
    } else {
      toast({
        title: "Classification Failed",
        description: result.message,
        variant: "destructive",
      })
    }
    return result
  }, null)

  const [processState, processAction, isProcessing] = useActionState(async (prevState: any, formData: FormData) => {
    // Append relistPlatform to formData if applicable
    if (shouldShowRelistPlatform()) {
      formData.append("relistPlatform", relistPlatform)
    } else {
      formData.append("relistPlatform", "") // Ensure it's explicitly empty if not shown
    }

    const result = await processReturnAction(formData)
    if (result.success) {
      toast({
        title: "Return Processed",
        description: result.message,
      })
      // Reset form
      setFormData({ sku: "", brand: "", returnReason: "", tags: "", imageUrl: "" })
      setAiResult(null)
      setManualOverride("")
      setRelistPlatform("") // Reset relist platform
      formRef.current?.reset() // Reset the form fields
      if (fileInputRef.current) {
        fileInputRef.current.value = "" // Clear the file input
      }
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }
    return result
  }, null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setFormData((prev) => ({ ...prev, imageUrl: "" })) // Clear image if no file selected
      return
    }

    const imageUrl = URL.createObjectURL(file)
    setFormData((prev) => ({ ...prev, imageUrl }))
  }

  const getActionColor = (action: string) => {
    const colors: { [key: string]: string } = {
      Relist: "bg-green-100 text-green-800",
      Outlet: "bg-blue-100 text-blue-800",
      ThirdWorld: "bg-purple-100 text-purple-800",
      Donate: "bg-yellow-100 text-yellow-800",
      Recycle: "bg-gray-100 text-gray-800",
      Resale: "bg-orange-100 text-orange-800",
      Review: "bg-red-100 text-red-800",
      flagged: "bg-red-100 text-red-800", // For flagged status
    }
    return colors[action] || "bg-gray-100 text-gray-800"
  }

  const shouldShowRelistPlatform = () => {
    const currentAction = manualOverride || (aiResult ? aiResult.action : "")
    return currentAction === "Relist"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Return Intake
        </CardTitle>
        <CardDescription>Upload return details for AI-powered classification</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form ref={formRef} action={classifyAction} className="space-y-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Product Image</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {formData.imageUrl ? (
                <div className="space-y-2">
                  <img
                    src={formData.imageUrl || "/placeholder.svg"}
                    alt="Product"
                    className="max-h-32 mx-auto rounded"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, imageUrl: "" }))
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "" // Clear the file input
                      }
                    }}
                  >
                    Remove
                  </Button>
                  <Input type="hidden" name="imageUrl" value={formData.imageUrl} />
                </div>
              ) : (
                <div>
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Upload product image</p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="max-w-xs mx-auto"
                    ref={fileInputRef} // Attach ref here
                  />
                </div>
              )}
            </div>
          </div>

          {/* Product Details */}
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
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={(e) => setFormData((prev) => ({ ...prev, brand: e.target.value }))}
                placeholder="Enter brand"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="returnReason">Return Reason *</Label>
            <Select
              onValueChange={(value) => setFormData((prev) => ({ ...prev, returnReason: value }))}
              name="returnReason"
              value={formData.returnReason}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select return reason" />
              </SelectTrigger>
              <SelectContent className="bg-green-50">
                <SelectItem value="defective">Defective</SelectItem>
                <SelectItem value="wrong-size">Wrong Size</SelectItem>
                <SelectItem value="not-as-described">Not as Described</SelectItem>
                <SelectItem value="changed-mind">Changed Mind</SelectItem>
                <SelectItem value="damaged-shipping">Damaged in Shipping</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
              placeholder="trending, seasonal, premium"
            />
          </div>

          {/* AI Classification */}
          <div className="pt-4 border-t">
            <Button type="submit" disabled={isClassifying} className="w-full">
              {isClassifying ? "Classifying..." : "Classify Return with AI"}
            </Button>
          </div>
        </form>

        {aiResult && (
          <form action={processAction} className="mt-4 space-y-3">
            <Input type="hidden" name="sku" value={formData.sku} />
            <Input type="hidden" name="returnReason" value={formData.returnReason} />
            <Input type="hidden" name="imageUrl" value={formData.imageUrl} />
            <Input type="hidden" name="aiAction" value={aiResult.action} />
            <Input type="hidden" name="aiConfidence" value={aiResult.confidence} />
            <Input type="hidden" name="aiReasoning" value={aiResult.reasoning} />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className={getActionColor(manualOverride || aiResult.action)}>
                  {manualOverride || aiResult.action}
                </Badge>
                <span className="text-sm text-gray-600">{Math.round(aiResult.confidence * 100)}% confidence</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowReasoning(!showReasoning)} type="button">
                <Eye className="h-4 w-4 mr-1" />
                {showReasoning ? "Hide" : "Show"} Reasoning
              </Button>
            </div>

            {showReasoning && (
              <div className="bg-gray-50 p-3 rounded text-sm">
                <strong>AI Reasoning:</strong> {aiResult.reasoning}
                {aiResult.resale_platform && (
                  <div className="mt-1">
                    <strong>Suggested Platform:</strong> {aiResult.resale_platform}
                  </div>
                )}
              </div>
            )}

            {/* Manual Override */}
            <div className="space-y-2">
              <Label>Manual Override (optional)</Label>
              <Select
                onValueChange={(value) => {
                  setManualOverride(value)
                  if (value !== "Relist") {
                    setRelistPlatform("") // Clear relist platform if not "Relist"
                  }
                }}
                name="manualOverride"
                value={manualOverride}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Override AI suggestion" />
                </SelectTrigger>
                <SelectContent className="bg-green-50">
                  <SelectItem value="Relist">Relist</SelectItem>
                  <SelectItem value="Outlet">Outlet</SelectItem>
                  <SelectItem value="ThirdWorld">Third World</SelectItem>
                  <SelectItem value="Donate">Donate</SelectItem>
                  <SelectItem value="Recycle">Recycle</SelectItem>
                  <SelectItem value="Resale">Resale</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditional Relist Platform */}
            {shouldShowRelistPlatform() && (
              <div className="space-y-2">
                <Label htmlFor="relistPlatform">Relist Platform *</Label>
                <Select onValueChange={setRelistPlatform} name="relistPlatform" value={relistPlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select relist platform" />
                  </SelectTrigger>
                  <SelectContent className="bg-green-50">
                    <SelectItem value="eBay">eBay</SelectItem>
                    <SelectItem value="Amazon">Amazon</SelectItem>
                    <SelectItem value="ThredUp">ThredUp</SelectItem>
                    <SelectItem value="Depop">Depop</SelectItem>
                    <SelectItem value="Poshmark">Poshmark</SelectItem>
                    <SelectItem value="The RealReal">The RealReal</SelectItem>
                    <SelectItem value="Mercari">Mercari</SelectItem>
                    <SelectItem value="Facebook Marketplace">Facebook Marketplace</SelectItem>
                    <SelectItem value="Etsy">Etsy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isProcessing}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {isProcessing ? "Processing..." : "Process Return"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
