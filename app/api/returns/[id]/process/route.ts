import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { classifyReturnItem, suggestResalePlatform } from "@/lib/gemini"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { id } = params

  try {
    const { data: returnItem, error: fetchError } = await supabase
      .from("return_items")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError || !returnItem) {
      console.error("Error fetching return item:", fetchError)
      return NextResponse.json({ error: "Return item not found" }, { status: 404 })
    }

    // 1. AI-Powered Return Classification
    const classificationResult = await classifyReturnItem({
      productName: returnItem.product_name,
      returnReason: returnItem.return_reason,
      category: returnItem.category,
      notes: returnItem.notes || "",
      imageUrl: returnItem.image_url || (returnItem.images && returnItem.images[0]) || undefined,
    })

    let resalePlatform = null
    if (classificationResult.classification === "marketplace") {
      // 2. Smart Resale Sync - Suggest platform
      const platformSuggestion = await suggestResalePlatform({
        category: returnItem.category,
        value: returnItem.refund_amount || 100, // Use refund amount as a proxy for value
        condition: returnItem.condition || "good",
      })
      resalePlatform = platformSuggestion.platform
    }

    // Determine eligibility status based on classification
    let eligibilityStatus = "eligible"
    if (classificationResult.classification === "discard" || classificationResult.classification === "manual_review") {
      eligibilityStatus = "flagged"
    }

    // 3. Refund Processing Logic (Stubbed)
    let refundStatus = "processed" // Assume processed for eligible items
    if (eligibilityStatus === "flagged" || eligibilityStatus === "denied") {
      refundStatus = "pending" // Requires manual review for flagged/denied
    }

    // Update the return item in the database
    const { data: updatedItem, error: updateError } = await supabase
      .from("return_items")
      .update({
        ai_classification: classificationResult.classification,
        confidence_score: classificationResult.confidence,
        ai_reasoning: classificationResult.reasoning,
        resale_platform: resalePlatform,
        eligibility_status: eligibilityStatus,
        refund_status: refundStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating return item:", updateError)
      return NextResponse.json({ error: "Failed to update return item" }, { status: 500 })
    }

    // If classified as 'marketplace', create a mock resale item
    if (updatedItem.ai_classification === "marketplace" && updatedItem.resale_platform) {
      const { error: resaleInsertError } = await supabase.from("resale_items").insert({
        return_item_id: updatedItem.id,
        product_name: updatedItem.product_name,
        platform: updatedItem.resale_platform,
        listing_price: updatedItem.refund_amount || 0, // Use refund amount as initial listing price
        current_status: "listed",
        listed_at: new Date().toISOString(),
      })

      if (resaleInsertError) {
        console.error("Error creating resale item:", resaleInsertError)
        // Don't fail the whole request, but log the error
      }
    }

    // Mock: Notify customer (SMS/email)
    console.log(`Mock: Notifying customer for return ${id} with status ${refundStatus}.`)

    return NextResponse.json({
      message: "Return processed successfully",
      ai_classification: updatedItem.ai_classification,
      resale_platform: updatedItem.resale_platform,
      eligibility_status: updatedItem.eligibility_status,
      refund_status: updatedItem.refund_status,
    })
  } catch (error) {
    console.error("API Error: /api/returns/[id]/process", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
