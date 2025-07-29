"use client"

import type React from "react"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AddReturnFormData {
  order_id: string
  sku: string
  productName: string
  returnReason: string
  purchaseDate: Date
  category: string
  notes?: string
  condition: "new" | "used" | "damaged" | "refurbished"
  images: string[] // Array of image URLs
}

interface AddReturnFormProps {
  onSubmit: (data: AddReturnFormData) => void
  onCancel: () => void
}

export function AddReturnForm({ onSubmit, onCancel }: AddReturnFormProps) {
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<AddReturnFormData>()

  const watchedPurchaseDate = watch("purchaseDate")
  const watchedReturnReason = watch("returnReason")
  const watchedCategory = watch("category")
  const watchedCondition = watch("condition")

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newImages = [...images]
    newImages[index] = e.target.value
    setImages(newImages)
    setValue("images", newImages)
  }

  const handleAddImageField = () => {
    setImages([...images, ""])
  }

  const handleRemoveImageField = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    setValue("images", newImages)
  }

  const handleFormSubmit = async (data: AddReturnFormData) => {
    setLoading(true)
    try {
      // The onSubmit prop from the parent (DashboardPage) will handle the actual Supabase insertion
      onSubmit(data)
      reset()
      setImages([]) // Clear images after submission
    } catch (error: any) {
      console.error("Error in return form submission:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add return item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add New Return Item</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order_id">Order ID</Label>
              <Input
                id="order_id"
                placeholder="ORD-12345"
                {...register("order_id", { required: "Order ID is required" })}
              />
              {errors.order_id && <p className="text-sm text-red-600">{errors.order_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">Product SKU</Label>
              <Input id="sku" placeholder="SKU-001" {...register("sku", { required: "SKU is required" })} />
              {errors.sku && <p className="text-sm text-red-600">{errors.sku.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="productName">Product Name</Label>
            <Input
              id="productName"
              placeholder="Product Name"
              {...register("productName", { required: "Product name is required" })}
            />
            {errors.productName && <p className="text-sm text-red-600">{errors.productName.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="returnReason">Return Reason</Label>
              <Select
                value={watchedReturnReason}
                onValueChange={(value) => setValue("returnReason", value)}
                {...register("returnReason", { required: "Return reason is required" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Defective">Defective</SelectItem>
                  <SelectItem value="Not as described">Not as described</SelectItem>
                  <SelectItem value="Changed mind">Changed mind</SelectItem>
                  <SelectItem value="Wrong size/color">Wrong size/color</SelectItem>
                  <SelectItem value="Damaged in transit">Damaged in transit</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.returnReason && <p className="text-sm text-red-600">{errors.returnReason.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !watchedPurchaseDate && "text-muted-foreground",
                    )}
                  >
                    {watchedPurchaseDate ? format(watchedPurchaseDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={watchedPurchaseDate}
                    onSelect={(date) => setValue("purchaseDate", date!)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.purchaseDate && <p className="text-sm text-red-600">{errors.purchaseDate.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={watchedCategory}
                onValueChange={(value) => setValue("category", value)}
                {...register("category", { required: "Category is required" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Apparel">Apparel</SelectItem>
                  <SelectItem value="Home Goods">Home Goods</SelectItem>
                  <SelectItem value="Books">Books</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-red-600">{errors.category.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select
                value={watchedCondition}
                onValueChange={(value: AddReturnFormData["condition"]) => setValue("condition", value)}
                {...register("condition", { required: "Condition is required" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                  <SelectItem value="refurbished">Refurbished</SelectItem>
                </SelectContent>
              </Select>
              {errors.condition && <p className="text-sm text-red-600">{errors.condition.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea id="notes" placeholder="Additional notes about the return..." {...register("notes")} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Images (URLs)</Label>
            {images.map((image, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input placeholder="Image URL" value={image} onChange={(e) => handleImageChange(e, index)} />
                <Button type="button" variant="outline" size="icon" onClick={() => handleRemoveImageField(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={handleAddImageField}>
              <Plus className="h-4 w-4 mr-2" />
              Add Image
            </Button>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add Return
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
