"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface SettingsFormData {
  supplierEmail: string
  defaultPoSubject: string
  ebayApiToken: string
  defaultMarkupPercent: number
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [lastSaved, setLastSaved] = useState<string>()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SettingsFormData>({
    defaultValues: {
      supplierEmail: "",
      defaultPoSubject: "Purchase Order Request",
      ebayApiToken: "",
      defaultMarkupPercent: 25,
    },
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data } = await supabase.from("user_settings").select("*").single()

      if (data) {
        setValue("supplierEmail", data.supplier_email || "")
        setValue("defaultPoSubject", data.default_po_subject || "Purchase Order Request")
        setValue("ebayApiToken", data.ebay_api_token || "")
        setValue("defaultMarkupPercent", data.default_markup_percent || 25)
        setLastSaved(new Date(data.updated_at).toLocaleString())
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

  const onSubmit = async (data: SettingsFormData) => {
    setIsLoading(true)

    try {
      const { error } = await supabase.from("user_settings").upsert({
        supplier_email: data.supplierEmail,
        default_po_subject: data.defaultPoSubject,
        ebay_api_token: data.ebayApiToken,
        default_markup_percent: data.defaultMarkupPercent,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      setLastSaved(new Date().toLocaleString())
      toast({
        title: "Success",
        description: "Settings saved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetToDefaults = () => {
    reset({
      supplierEmail: "",
      defaultPoSubject: "Purchase Order Request",
      ebayApiToken: "",
      defaultMarkupPercent: 25,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Settings</h1>

          <Card className="relative">
            <CardHeader>
              <CardTitle>Application Settings</CardTitle>
              {lastSaved && (
                <div className="absolute top-4 right-4 text-xs text-muted-foreground">Last saved: {lastSaved}</div>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplierEmail">Supplier Email</Label>
                    <Input
                      id="supplierEmail"
                      type="email"
                      placeholder="supplier@company.com"
                      {...register("supplierEmail", {
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address",
                        },
                      })}
                    />
                    {errors.supplierEmail && <p className="text-sm text-red-600">{errors.supplierEmail.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="defaultPoSubject">Default PO Subject</Label>
                    <Input
                      id="defaultPoSubject"
                      placeholder="Purchase Order Request"
                      {...register("defaultPoSubject", { required: "PO subject is required" })}
                    />
                    {errors.defaultPoSubject && (
                      <p className="text-sm text-red-600">{errors.defaultPoSubject.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ebayApiToken">eBay API Token</Label>
                    <Input
                      id="ebayApiToken"
                      type="password"
                      placeholder="Enter eBay API token"
                      {...register("ebayApiToken")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="defaultMarkupPercent">Default Markup % (Optional)</Label>
                    <Input
                      id="defaultMarkupPercent"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="25"
                      {...register("defaultMarkupPercent", {
                        min: { value: 0, message: "Markup must be positive" },
                        max: { value: 100, message: "Markup cannot exceed 100%" },
                      })}
                    />
                    {errors.defaultMarkupPercent && (
                      <p className="text-sm text-red-600">{errors.defaultMarkupPercent.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <Button type="button" variant="outline" onClick={resetToDefaults}>
                    Reset to Defaults
                  </Button>

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
