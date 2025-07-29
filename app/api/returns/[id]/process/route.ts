import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { classifyReturnItem, suggestResalePlatform } from "@/lib/gemini"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const { action } = await req.json() // 'approve', 'reject', 'classify'

  if (!id) {
    return NextResponse.json({ error: "Return ID is required" }, { status: 400 })
  }

  try {
    let returnItem: any
    const { data, error: fetchError } = await supabase.from("return_items").select("*").eq("id", id).single()

    if (fetchError || !data) {
      console.error("Error fetching return item:", fetchError)
      return NextResponse.json({ error: "Return item not found" }, { status: 404 })
    }
    returnItem = data

    if (action === "approve" || action === "reject") {
      const newStatus = action === "approve" ? "approved" : "rejected"
      const { error: updateError } = await supabase
        .from("return_items")
        .update({ eligibility_status: newStatus })
        .eq("id", id)

      if (updateError) {
        console.error(`Error updating return status to ${newStatus}:`, updateError)
        return NextResponse.json({ error: `Failed to ${action} return` }, { status: 500 })
      }
      return NextResponse.json({ message: `Return ${id} ${newStatus} successfully` })
    } else if (action === "classify") {
      const classification = await classifyReturnItem({
        productName: returnItem.product_name,
        returnReason: returnItem.return_reason,
        condition: returnItem.condition,
        notes: returnItem.notes,
      })

      const resalePlatform = await suggestResalePlatform({
        productName: returnItem.product_name,
        classification: classification,
      })

      const { error: updateError } = await supabase
        .from("return_items")
        .update({
          classification_ai: classification,
          resale_platform_ai: resalePlatform,
        })
        .eq("id", id)

      if (updateError) {
        console.error("Error updating AI classification:", updateError)
        return NextResponse.json({ error: "Failed to update AI classification" }, { status: 500 })
      }

      return NextResponse.json({
        message: "Return item classified by AI successfully",
        classification,
        resalePlatform,
      })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("API Error: /api/returns/[id]/process", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
