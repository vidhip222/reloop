"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { generatePONegotiationTerms } from "@/lib/gemini"

interface POItem {
  sku: string
  name: string
  quantity: number
  price: number
}

interface POFormData {
  supplierId: string
  subject: string
  items: POItem[]
  negotiationTerms: string
}

interface Supplier {
  id: string
  name: string
  avg_delivery_days: number // Changed from deliverySpeed
  price_rating: number
  sla_rating: number
}

interface POFormProps {
  suppliers: Supplier[]
  onSubmit: (data: POFormData) => void
  onCancel: () => void
  initialSupplierId?: string
}

export function POForm({ suppliers, onSubmit, onCancel, initialSupplierId }: POFormProps) {
  const [isGeneratingTerms, setIsGeneratingTerms] = useState(false)
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<POFormData>({
    defaultValues: {
      supplierId: initialSupplierId || "",
      subject: "",
      items: [{ sku: "", name: "", quantity: 1, price: 0 }],
      negotiationTerms: "",
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  })

  const watchedSupplierId = watch("supplierId")
  const watchedItems = watch("items")

  const selectedSupplier = suppliers.find((s) => s.id === watchedSupplierId)

  const totalAmount = watchedItems.reduce((sum, item) => {
    return sum + item.quantity * item.price
  }, 0)

  const generateNegotiationTerms = async () => {
    if (!selectedSupplier) return

    setIsGeneratingTerms(true)
    try {
      const terms = await generatePONegotiationTerms({
        name: selectedSupplier.name,
        deliverySpeed: selectedSupplier.avg_delivery_days, // Use avg_delivery_days
        priceRating: selectedSupplier.price_rating,
        slaRating: selectedSupplier.sla_rating,
      })
      setValue("negotiationTerms", terms)
    } catch (error) {
      console.error("Failed to generate terms:", error)
    } finally {
      setIsGeneratingTerms(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create Purchase Order</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplierId">Supplier</Label>
              <Select
                value={watchedSupplierId}
                onValueChange={(value) => setValue("supplierId", value)}
                {...register("supplierId", { required: "Supplier is required" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.supplierId && <p className="text-sm text-red-600">Supplier is required</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="PO Subject"
                {...register("subject", { required: "Subject is required" })}
              />
              {errors.subject && <p className="text-sm text-red-600">{errors.subject.message}</p>}
            </div>
          </div>

          {selectedSupplier && (
            <Card className="bg-gray-50">
              <CardContent className="pt-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Avg. Delivery:</span> {selectedSupplier.avg_delivery_days} days
                  </div>
                  <div>
                    <span className="font-medium">Price Rating:</span> {selectedSupplier.price_rating}/5
                  </div>
                  <div>
                    <span className="font-medium">SLA Rating:</span> {selectedSupplier.sla_rating}/5
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ sku: "", name: "", quantity: 1, price: 0 })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            {fields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div className="space-y-2">
                    <Label>SKU</Label>
                    <Input placeholder="SKU-001" {...register(`items.${index}.sku`, { required: "SKU is required" })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Product Name</Label>
                    <Input
                      placeholder="Product name"
                      {...register(`items.${index}.name`, { required: "Name is required" })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      {...register(`items.${index}.quantity`, {
                        required: "Quantity is required",
                        min: { value: 1, message: "Minimum quantity is 1" },
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`items.${index}.price`, {
                        required: "Price is required",
                        min: { value: 0, message: "Price must be positive" },
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="font-medium">Total Amount:</span>
            <Badge variant="secondary" className="text-lg">
              ${totalAmount.toFixed(2)}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="negotiationTerms">Negotiation Terms</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateNegotiationTerms}
                disabled={!selectedSupplier || isGeneratingTerms}
              >
                {isGeneratingTerms ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Generate AI Terms
              </Button>
            </div>
            <Textarea
              id="negotiationTerms"
              placeholder="Enter negotiation terms..."
              rows={4}
              {...register("negotiationTerms")}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Create Purchase Order</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
