"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { FileText, Send, Save, Lightbulb } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { suggestPOTermsAction, savePOAction } from "@/actions"
import { useActionState } from "react"

export default function POGenerator() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null)
  const [poData, setPOData] = useState({
    sku: "",
    quantity: "",
    unitPrice: "",
    discount: "",
    moq: "",
    shippingTerms: "FOB",
    notes: "",
  })
  const [aiSuggestions, setAiSuggestions] = useState<any>(null)
  const { toast } = useToast()
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    loadSuppliers()
  }, [])

  useEffect(() => {
    if (selectedSupplierId) {
      const supplier = suppliers.find((s) => s.id === selectedSupplierId)
      setSelectedSupplier(supplier)
      setPOData((prev) => ({ ...prev, unitPrice: supplier?.unit_cost?.toString() || "" }))
    } else {
      setSelectedSupplier(null)
      setPOData((prev) => ({ ...prev, unitPrice: "" }))
    }
  }, [selectedSupplierId, suppliers])

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("flagged", false)
        .order("sla_grade", { ascending: false })

      if (error) throw error
      setSuppliers(data || [])
    } catch (error) {
      console.error("Error loading suppliers:", error)
    }
  }

  const [suggestState, suggestAction, isGenerating] = useActionState(async (prevState: any, formData: FormData) => {
    formData.append("supplierId", selectedSupplierId || "") // Append selected supplier ID
    const result = await suggestPOTermsAction(formData)
    if (result.success) {
      setAiSuggestions(result.data)
      // Auto-fill suggested values
      setPOData((prev) => ({
        ...prev,
        quantity: result.data.suggested_quantity?.toString() || prev.quantity,
        discount: (result.data.suggested_discount * 100)?.toString() || prev.discount,
        moq: result.data.moq_recommendation?.toString() || prev.moq,
        shippingTerms: result.data.shipping_terms || prev.shippingTerms,
      }))
      toast({
        title: "AI Suggestions Generated",
        description: "PO terms have been optimized based on supplier performance",
      })
    } else {
      toast({
        title: "Suggestion Failed",
        description: result.message,
        variant: "destructive",
      })
    }
    return result
  }, null)

  const [saveState, saveAction, isSaving] = useActionState(async (prevState: any, formData: FormData) => {
    formData.append("supplierId", selectedSupplierId || "")
    formData.append("aiSuggestions", JSON.stringify(aiSuggestions)) // Pass AI suggestions as stringified JSON
    const result = await savePOAction(formData)
    if (result.success) {
      toast({
        title: "PO Action Successful",
        description: result.message,
      })
      // Reset form
      setPOData({
        sku: "",
        quantity: "",
        unitPrice: "",
        discount: "",
        moq: "",
        shippingTerms: "FOB",
        notes: "",
      })
      setSelectedSupplierId(null)
      setAiSuggestions(null)
      formRef.current?.reset() // Reset the form fields
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }
    return result
  }, null)

  const calculateTotal = () => {
    const quantity = Number.parseFloat(poData.quantity) || 0
    const unitPrice = Number.parseFloat(poData.unitPrice) || 0
    const discount = Number.parseFloat(poData.discount) || 0

    const subtotal = quantity * unitPrice
    const discountAmount = subtotal * (discount / 100)
    return subtotal - discountAmount
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          PO Generator
        </CardTitle>
        <CardDescription>Create purchase orders with AI-optimized terms and supplier negotiation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form ref={formRef} className="space-y-6">
          {/* Supplier Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Supplier *</Label>
              <Select onValueChange={setSelectedSupplierId} value={selectedSupplierId || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{supplier.name}</span>
                        <Badge className="ml-2" variant="secondary">
                          {supplier.sla_grade}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSupplier && (
              <div className="space-y-2">
                <Label>Supplier Info</Label>
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  <div>Avg Delivery: {selectedSupplier.avg_delivery_time} days</div>
                  <div>Return Rate: {selectedSupplier.return_rate}%</div>
                  <div>Defect Rate: {selectedSupplier.defect_rate}%</div>
                </div>
              </div>
            )}
          </div>

          {/* AI Suggestions Button */}
          <div className="flex justify-between items-center">
            <Button
              formAction={suggestAction}
              disabled={isGenerating || !selectedSupplierId || !poData.sku}
              variant="outline"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              {isGenerating ? "Generating..." : "Get AI Suggestions"}
            </Button>

            {aiSuggestions && (
              <div className="text-sm text-green-600 flex items-center gap-1">
                <Lightbulb className="h-4 w-4" />
                AI suggestions applied
              </div>
            )}
          </div>

          {/* AI Reasoning Display */}
          {aiSuggestions && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Gemini Recommendations</h4>
              <p className="text-blue-800 text-sm">{aiSuggestions.reasoning}</p>
            </div>
          )}

          {/* PO Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                name="sku"
                value={poData.sku}
                onChange={(e) => setPOData((prev) => ({ ...prev, sku: e.target.value }))}
                placeholder="Enter SKU"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                value={poData.quantity}
                onChange={(e) => setPOData((prev) => ({ ...prev, quantity: e.target.value }))}
                placeholder="Enter quantity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price *</Label>
              <Input
                id="unitPrice"
                name="unitPrice"
                type="number"
                step="0.01"
                value={poData.unitPrice}
                onChange={(e) => setPOData((prev) => ({ ...prev, unitPrice: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount">Discount (%)</Label>
              <Input
                id="discount"
                name="discount"
                type="number"
                step="0.1"
                value={poData.discount}
                onChange={(e) => setPOData((prev) => ({ ...prev, discount: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="moq">MOQ</Label>
              <Input
                id="moq"
                name="moq"
                type="number"
                value={poData.moq}
                onChange={(e) => setPOData((prev) => ({ ...prev, moq: e.target.value }))}
                placeholder="Minimum order quantity"
              />
            </div>
            <div className="space-y-2">
              <Label>Shipping Terms</Label>
              <Select
                value={poData.shippingTerms}
                onValueChange={(value) => setPOData((prev) => ({ ...prev, shippingTerms: value }))}
                name="shippingTerms"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-green-50">
                  <SelectItem value="FOB">FOB</SelectItem>
                  <SelectItem value="CIF">CIF</SelectItem>
                  <SelectItem value="DDP">DDP</SelectItem>
                  <SelectItem value="EXW">EXW</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={poData.notes}
              onChange={(e) => setPOData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional terms or notes"
              rows={3}
            />
          </div>

          {/* Total Calculation */}
          {poData.quantity && poData.unitPrice && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Amount:</span>
                <span className="text-xl font-bold">${calculateTotal().toFixed(2)}</span>
              </div>
              {poData.discount && (
                <div className="text-sm text-gray-600 mt-1">Discount applied: {poData.discount}%</div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              formAction={(formData) => {
                formData.append("status", "draft")
                saveAction(formData)
              }}
              variant="outline"
              className="flex-1"
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              Save as Draft
            </Button>
            <Button
              formAction={(formData) => {
                formData.append("status", "sent")
                saveAction(formData)
              }}
              className="flex-1"
              disabled={isSaving}
            >
              <Send className="h-4 w-4 mr-2" />
              Send to Supplier
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
