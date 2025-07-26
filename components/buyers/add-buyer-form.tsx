"use client"

import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AddBuyerFormData {
  name: string
  email: string
  phone: string
  company: string
  region: string
}

interface AddBuyerFormProps {
  onSubmit: (data: AddBuyerFormData) => void
  onCancel: () => void
}

export function AddBuyerForm({ onSubmit, onCancel }: AddBuyerFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AddBuyerFormData>()

  const regions = ["North America", "Europe", "Asia", "South America", "Africa", "Oceania"]

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add New Buyer</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Buyer Name</Label>
              <Input id="name" placeholder="John Doe" {...register("name", { required: "Buyer name is required" })} />
              {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="buyer@company.com"
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
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                placeholder="Company name"
                {...register("company", { required: "Company is required" })}
              />
              {errors.company && <p className="text-sm text-red-600">{errors.company.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Select onValueChange={(value) => setValue("region", value)}>
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
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Add Buyer</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
