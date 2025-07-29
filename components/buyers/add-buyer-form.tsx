"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface AddBuyerFormData {
  name: string
  email: string
  phone: string
  address: string
}

interface AddBuyerFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function AddBuyerForm({ onSuccess, onCancel }: AddBuyerFormProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddBuyerFormData>()

  const onSubmit = async (data: AddBuyerFormData) => {
    setLoading(true)
    try {
      const { error } = await supabase.from("buyers").insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Buyer added successfully!",
      })
      reset()
      onSuccess()
    } catch (error: any) {
      console.error("Error adding buyer:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add buyer. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Add New Buyer</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Buyer Name" {...register("name", { required: "Name is required" })} />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="buyer@example.com"
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
              placeholder="123 Buyer St, City, State"
              {...register("address", { required: "Address is required" })}
            />
            {errors.address && <p className="text-sm text-red-600">{errors.address.message}</p>}
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add Buyer
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
