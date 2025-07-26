"use client"

import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AddSupplierFormData {
  name: string
  email: string
  phone: string
  address: string
  region: string
  deliverySpeed: number // Maps to avg_delivery_days in DB
  priceRating: number
  slaRating: number
}

interface AddSupplierFormProps {
  onSubmit: (data: AddSupplierFormData) => void
  onCancel: () => void
}

export function AddSupplierForm({ onSubmit, onCancel }: AddSupplierFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AddSupplierFormData>({
    defaultValues: {
      deliverySpeed: 7,
      priceRating: 4.0,
      slaRating: 4.0,
    },
  })

  const regions = ["North America", "Europe", "Asia", "South America", "Africa", "Oceania"]

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add New Supplier</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Supplier Name</Label>
              <Input
                id="name"
                placeholder="Supplier name"
                {...register("name", { required: "Supplier name is required" })}
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="supplier@example.com"
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
              <Input id="phone" placeholder="+1-555-0123" {...register("phone")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select
                onValueChange={(value) => setValue("region", value)}
                {...register("region", { required: "Region is required" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.region && <p className="text-sm text-red-600">{errors.region.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" placeholder="Full address" rows={2} {...register("address")} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deliverySpeed">Avg. Delivery Days</Label>
              <Input
                id="deliverySpeed"
                type="number"
                min="1"
                max="30"
                {...register("deliverySpeed", {
                  required: "Delivery speed is required",
                  min: { value: 1, message: "Minimum 1 day" },
                  max: { value: 30, message: "Maximum 30 days" },
                  valueAsNumber: true,
                })}
              />
              {errors.deliverySpeed && <p className="text-sm text-red-600">{errors.deliverySpeed.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceRating">Price Rating (1-5)</Label>
              <Input
                id="priceRating"
                type="number"
                step="0.1"
                min="1"
                max="5"
                {...register("priceRating", {
                  required: "Price rating is required",
                  min: { value: 1, message: "Minimum rating is 1" },
                  max: { value: 5, message: "Maximum rating is 5" },
                  valueAsNumber: true,
                })}
              />
              {errors.priceRating && <p className="text-sm text-red-600">{errors.priceRating.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slaRating">SLA Rating (1-5)</Label>
              <Input
                id="slaRating"
                type="number"
                step="0.1"
                min="1"
                max="5"
                {...register("slaRating", {
                  required: "SLA rating is required",
                  min: { value: 1, message: "Minimum rating is 1" },
                  max: { value: 5, message: "Maximum rating is 5" },
                  valueAsNumber: true,
                })}
              />
              {errors.slaRating && <p className="text-sm text-red-600">{errors.slaRating.message}</p>}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Add Supplier</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
