"use server"

import { Resend } from "resend"
import { classifyReturn, predictRestock, suggestPOTerms } from "@/lib/gemini"
import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendNotificationEmail(subject: string, body: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: "ReLoop <onboarding@resend.dev>", // Replace with your verified Resend domain
      to: ["mailtovidhipatra@gmail.com"], // Hardcoded as per request
      subject: subject,
      html: `<p>${body}</p>`,
    })

    if (error) {
      console.error("Resend email error:", error)
      return { success: false, message: error.message }
    }

    console.log("Email sent successfully:", data)
    return { success: true, message: "Email sent successfully!" }
  } catch (error: any) {
    console.error("Unexpected email error:", error)
    return { success: false, message: error.message || "Failed to send email." }
  }
}

export async function classifyReturnAction(formData: FormData) {
  const sku = formData.get("sku") as string
  const brand = formData.get("brand") as string
  const returnReason = formData.get("returnReason") as string
  const tags = formData.get("tags") as string
  const imageUrl = formData.get("imageUrl") as string // This would typically be a URL to an uploaded image

  if (!sku || !returnReason) {
    return { success: false, message: "SKU and return reason are required." }
  }

  try {
    const result = await classifyReturn(imageUrl, {
      sku,
      brand,
      returnReason,
      tags: tags.split(",").map((t) => t.trim()),
    })

    return { success: true, data: result }
  } catch (error: any) {
    console.error("Server Action - Gemini classification error:", error)
    return { success: false, message: error.message || "Failed to classify return with AI." }
  }
}

export async function predictRestockAction(formData: FormData) {
  const sku = formData.get("sku") as string
  const recentSales = Number(formData.get("recentSales"))
  const inventoryLevel = Number(formData.get("inventoryLevel"))
  const seasonalFactor = Number(formData.get("seasonalFactor")) || 1.0

  if (!sku || isNaN(recentSales) || isNaN(inventoryLevel)) {
    return { success: false, message: "SKU, recent sales, and inventory level are required." }
  }

  try {
    const salesData = {
      weekly_sales: recentSales,
      seasonal_factor: seasonalFactor,
      trend: "stable", // This could be dynamic based on more data
    }

    const result = await predictRestock(sku, salesData, inventoryLevel)
    return { success: true, data: result }
  } catch (error: any) {
    console.error("Server Action - Restock prediction error:", error)
    return { success: false, message: error.message || "Failed to predict restock quantity." }
  }
}

export async function suggestPOTermsAction(formData: FormData) {
  const supplierId = formData.get("supplierId") as string
  const sku = formData.get("sku") as string

  if (!supplierId || !sku) {
    return { success: false, message: "Supplier and SKU are required." }
  }

  try {
    const { data: supplier, error: supplierError } = await supabase
      .from("suppliers")
      .select("*")
      .eq("id", supplierId)
      .single()

    if (supplierError || !supplier) {
      throw new Error(supplierError?.message || "Supplier not found.")
    }

    // Mock SKU data - in a real app, fetch this from your inventory system
    const skuData = {
      recent_sales: 100,
      inventory: 25,
      seasonal_factor: 1.2,
    }

    const suggestions = await suggestPOTerms(supplier, skuData)
    return { success: true, data: suggestions }
  } catch (error: any) {
    console.error("Server Action - PO terms suggestion error:", error)
    return { success: false, message: error.message || "Failed to suggest PO terms." }
  }
}

export async function processReturnAction(formData: FormData) {
  const sku = formData.get("sku") as string
  const returnReason = formData.get("returnReason") as string
  const imageUrl = formData.get("imageUrl") as string
  const aiAction = formData.get("aiAction") as string
  const aiConfidence = Number(formData.get("aiConfidence"))
  const aiReasoning = formData.get("aiReasoning") as string
  const manualOverride = formData.get("manualOverride") as string | null
  const relistPlatform = formData.get("relistPlatform") as string | null // New field

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const { error } = await supabase.from("returns").insert([
      {
        sku,
        return_reason: returnReason,
        image_url: imageUrl,
        ai_action: aiAction,
        ai_confidence: aiConfidence,
        ai_reasoning: aiReasoning,
        manual_override: manualOverride || null,
        status: manualOverride || aiAction === "Review" ? "flagged" : "processed", // Set status to 'flagged' if overridden or AI suggests 'Review'
        user_id: user.id,
        relist_platform: relistPlatform, // Save the relist platform
      },
    ])

    if (error) throw error

    // If the item is flagged for review, send an email notification
    if (manualOverride || aiAction === "Review") {
      await sendNotificationEmail(
        `ReLoop: New Return Flagged for Review - SKU ${sku}`,
        `A new return for SKU ${sku} has been flagged for manual review. AI Action: ${aiAction}, Manual Override: ${manualOverride || "None"}. Reasoning: ${aiReasoning}`,
      )
    }

    revalidatePath("/dashboard/returns") // Revalidate the returns page to show new data
    return { success: true, message: "Return processed successfully!" }
  } catch (error: any) {
    console.error("Server Action - Process return error:", error)
    return { success: false, message: error.message || "Failed to process return." }
  }
}

export async function savePOAction(formData: FormData) {
  const supplierId = formData.get("supplierId") as string
  const sku = formData.get("sku") as string
  const quantity = Number(formData.get("quantity"))
  const unitPrice = Number(formData.get("unitPrice"))
  const discount = Number(formData.get("discount")) || 0
  const shippingTerms = formData.get("shippingTerms") as string
  const notes = formData.get("notes") as string
  const status = formData.get("status") as "draft" | "sent"
  const aiSuggestions = formData.get("aiSuggestions") as string // Stringified JSON

  if (!supplierId || !sku || isNaN(quantity) || isNaN(unitPrice)) {
    return { success: false, message: "Supplier, SKU, quantity, and unit price are required." }
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const totalAmount = quantity * unitPrice
    const discountAmount = totalAmount * (discount / 100)

    const { error } = await supabase.from("purchase_orders").insert([
      {
        supplier_id: supplierId,
        sku: sku,
        quantity: quantity,
        unit_price: unitPrice,
        total_amount: totalAmount - discountAmount,
        status: status,
        ai_suggestions: aiSuggestions ? JSON.parse(aiSuggestions) : null,
        user_id: user.id,
      },
    ])

    if (error) throw error

    if (status === "sent") {
      await sendNotificationEmail(
        `ReLoop: New Purchase Order Sent - SKU ${sku}`,
        `A new purchase order for SKU ${sku} has been sent to supplier ${supplierId}. Quantity: ${quantity}, Total: $${(totalAmount - discountAmount).toFixed(2)}.`,
      )
    }

    revalidatePath("/dashboard") // Revalidate dashboard to update PO stats
    return { success: true, message: `PO ${status === "draft" ? "saved as draft" : "sent"} successfully!` }
  } catch (error: any) {
    console.error("Server Action - Save PO error:", error)
    return { success: false, message: error.message || "Failed to save purchase order." }
  }
}
