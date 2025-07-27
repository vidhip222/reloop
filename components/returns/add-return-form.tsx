"use client"

import type React from "react"

import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { XCircle } from "lucide-react" // Import XCircle

interface AddReturnFormData {
  order_id: string // New field
  sku: string
  productName: string
  returnReason: string
  purchaseDate: string
  category: string
  notes: string
  condition: string // New field
  images: string[] // New field
}

interface AddReturnFormProps {
  onSubmit: (data: AddReturnFormData) => void
  onCancel: () => void
}

export function AddReturnForm({ onSubmit, onCancel }: AddReturnFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddReturnFormData>()

  const categories = ["Apparel", "Footwear", "Accessories", "Electronics", "Home & Garden", "Beauty", "Sports", "Other"]
  const returnReasons = [
    "Size too small",
    "Size too large",
    "Defective item",
    "Not as described",
    "Changed mind",
    "Arrived damaged",
    "Wrong item received",
    "Quality issues",
    "Other",
  ]
  const conditions = ["new", "excellent", "good", "fair", "poor"]

  const watchedImages = watch("images") || []

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // In a real app, you'd upload this to a storage service (e.g., Vercel Blob, Supabase Storage)
      // For now, we'll use a placeholder URL
      const newImageUrl = `/placeholder.svg?height=100&width=100&query=${encodeURIComponent(file.name)}`
      setValue("images", [...watchedImages, newImageUrl])
      e.target.value = "" // Clear the input
    }
  }

  const handleImageRemove = (index: number) => {
    const newImages = watchedImages.filter((_, i) => i !== index)
    setValue("images", newImages)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add Return Item</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order_id">Original Order ID</Label>
              <Input
                id="order_id"
                placeholder="ORD-12345"
                {...register("order_id", { required: "Order ID is required" })}
              />
              {errors.order_id && <p className="text-sm text-red-600">{errors.order_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU (Product ID)</Label>
              <Input id="sku" placeholder="SKU-001" {...register("sku", { required: "SKU is required" })} />
              {errors.sku && <p className="text-sm text-red-600">{errors.sku.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="productName">Product Name</Label>
            <Input
              id="productName"
              placeholder="Product name"
              {...register("productName", { required: "Product name is required" })}
            />
            {errors.productName && <p className="text-sm text-red-600">{errors.productName.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="returnReason">Return Reason</Label>
              <Select
                value={watch("returnReason")}
                onValueChange={(value) => setValue("returnReason", value)}
                {...register("returnReason", { required: "Return reason is required" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {returnReasons.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.returnReason && <p className="text-sm text-red-600">{errors.returnReason.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={watch("category")}
                onValueChange={(value) => setValue("category", value)}
                {...register("category", { required: "Category is required" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-red-600">{errors.category.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                {...register("purchaseDate", { required: "Purchase date is required" })}
              />
              {errors.purchaseDate && <p className="text-sm text-red-600">{errors.purchaseDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select
                value={watch("condition")}
                onValueChange={(value) => setValue("condition", value)}
                {...register("condition", { required: "Condition is required" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {conditions.map((condition) => (
                    <SelectItem key={condition} value={condition}>
                      {condition}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.condition && <p className="text-sm text-red-600">{errors.condition.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" placeholder="Additional notes about the return..." rows={3} {...register("notes")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="images">Images (Upload or paste URLs)</Label>
            <div className="flex items-center space-x-2">
              <Input id="images" type="file" accept="image/*" onChange={handleImageAdd} />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {watchedImages.map((imgUrl, index) => (
                <div key={index} className="relative w-24 h-24 border rounded-md overflow-hidden">
                  <img
                    src={imgUrl || "/placeholder.svg"}
                    alt={`Return item ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 rounded-full"
                    onClick={() => handleImageRemove(index)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Add Return Item</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
