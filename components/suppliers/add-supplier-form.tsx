"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AddSupplierFormData {
  name: string
  email: string
  phone: string
  address: string
  region: string
  deliverySpeed: number
  priceRating: number
  slaRating: number
}

interface AddSupplierFormProps {
  onSubmit: (data: AddSupplierFormData) => void
  onCancel: () => void
}

export function AddSupplierForm({ onSubmit, onCancel }: AddSupplierFormProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<AddSupplierFormData>()

  const watchedRegion = watch("region")
  const watchedDeliverySpeed = watch("deliverySpeed")
  const watchedPriceRating = watch("priceRating")
  const watchedSlaRating = watch("slaRating")

  const handleFormSubmit = async (data: AddSupplierFormData) => {
    setLoading(true)
    try {
      // The onSubmit prop from the parent (DashboardPage) will handle the actual Supabase insertion
      onSubmit(data)
      reset()
    } catch (error: any) {
      console.error("Error in supplier form submission:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add supplier. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add New Supplier</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Supplier Name</Label>
              <Input id="name" placeholder="Supplier Name" {...register("name", { required: "Name is required" })} />
              {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@supplier.com"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
              />
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="123-456-7890"
                {...register("phone", { required: "Phone number is required" })}
              />
              {errors.phone && <p className="text-sm text-red-600">{errors.phone.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="123 Supplier St, City, State"
                {...register("address", { required: "Address is required" })}
              />
              {errors.address && <p className="text-sm text-red-600">{errors.address.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select
                value={watchedRegion}
                onValueChange={(value) => setValue("region", value)}
                {...register("region", { required: "Region is required" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="North America">North America</SelectItem>
                  <SelectItem value="Europe">Europe</SelectItem>
                  <SelectItem value="Asia">Asia</SelectItem>
                  <SelectItem value="South America">South America</SelectItem>
                  <SelectItem value="Africa">Africa</SelectItem>
                  <SelectItem value="Oceania">Oceania</SelectItem>
                </SelectContent>
              </Select>
              {errors.region && <p className="text-sm text-red-600">{errors.region.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliverySpeed">Avg. Delivery Days</Label>
              <Input
                id="deliverySpeed"
                type="number"
                min="1"
                placeholder="7"
                {...register("deliverySpeed", {
                  required: "Delivery speed is required",
                  min: { value: 1, message: "Minimum 1 day" },
                  valueAsNumber: true,
                })}
              />
              {errors.deliverySpeed && <p className="text-sm text-red-600">{errors.deliverySpeed.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priceRating">Price Rating (1-5)</Label>
              <Select
                value={watchedPriceRating?.toString()}
                onValueChange={(value) => setValue("priceRating", Number.parseInt(value))}
                {...register("priceRating", {
                  required: "Price rating is required",
                  min: { value: 1, message: "Min 1" },
                  max: { value: 5, message: "Max 5" },
                  valueAsNumber: true,
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.priceRating && <p className="text-sm text-red-600">{errors.priceRating.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slaRating">SLA Rating (1-5)</Label>
              <Select
                value={watchedSlaRating?.toString()}
                onValueChange={(value) => setValue("slaRating", Number.parseInt(value))}
                {...register("slaRating", {
                  required: "SLA rating is required",
                  min: { value: 1, message: "Min 1" },
                  max: { value: 5, message: "Max 5" },
                  valueAsNumber: true,
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.slaRating && <p className="text-sm text-red-600">{errors.slaRating.message}</p>}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add Supplier
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
