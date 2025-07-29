"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReturnItem {
  id: string
  product_name: string
  return_reason: string
  condition: string
  notes: string | null
  classification_ai: string | null
  resale_platform_ai: string | null
}

interface ReturnClassificationProps {
  isOpen: boolean
  onClose: () => void
  returnItem: ReturnItem
  onClassifySuccess: () => void
}

export function ReturnClassification({ isOpen, onClose, returnItem, onClassifySuccess }: ReturnClassificationProps) {
  const [loading, setLoading] = useState(false)
  const [classificationResult, setClassificationResult] = useState<string>(returnItem.classification_ai || "")
  const [resalePlatformResult, setResalePlatformResult] = useState<string>(returnItem.resale_platform_ai || "")
  const { toast } = useToast()

  const handleClassify = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/returns/${returnItem.id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "classify" }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setClassificationResult(data.classification)
      setResalePlatformResult(data.resalePlatform)
      toast({
        title: "Classification Complete",
        description: "Return item classified and resale platform suggested by AI.",
      })
      onClassifySuccess() // Notify parent to refresh data
    } catch (error: any) {
      console.error("Error classifying return item:", error)
      toast({
        title: "Classification Error",
        description: error.message || "Failed to classify return item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>AI Return Classification</DialogTitle>
          <DialogDescription>
            Get AI-powered insights on how to classify this return and suggest a resale platform.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Product Name:</Label>
            <div className="col-span-3 font-medium">{returnItem.product_name}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Return Reason:</Label>
            <div className="col-span-3">{returnItem.return_reason}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Condition:</Label>
            <div className="col-span-3 capitalize">{returnItem.condition}</div>
          </div>
          {returnItem.notes && (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right">Notes:</Label>
              <div className="col-span-3 text-sm text-muted-foreground">{returnItem.notes}</div>
            </div>
          )}

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="classification" className="text-right">
              AI Classification:
            </Label>
            <Textarea
              id="classification"
              value={classificationResult}
              readOnly
              rows={2}
              className="col-span-3 resize-none"
              placeholder="Click 'Classify' to generate..."
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="resalePlatform" className="text-right">
              AI Resale Platform:
            </Label>
            <Textarea
              id="resalePlatform"
              value={resalePlatformResult}
              readOnly
              rows={2}
              className="col-span-3 resize-none"
              placeholder="Click 'Classify' to generate..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Close
          </Button>
          <Button onClick={handleClassify} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Classify Return
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
