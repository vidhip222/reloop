import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("return_items")
      .select(
        "id, order_id, product_id, product_name, return_reason, condition, ai_classification, confidence_score, status:eligibility_status, refund_amount, ai_reasoning, images, created_at",
      )
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching return items:", error)
      return NextResponse.json({ error: "Failed to fetch return items" }, { status: 500 })
    }

    const formattedReturns = data.map((item) => ({
      id: item.id,
      order_id: item.order_id,
      product_id: item.product_id,
      product_name: item.product_name,
      return_reason: item.return_reason,
      condition: item.condition,
      ai_classification: item.ai_classification,
      confidence_score: item.confidence_score,
      status: item.status,
      refund_amount: item.refund_amount,
      ai_reasoning: item.ai_reasoning,
      images: item.images || [],
      created_at: item.created_at,
    }))

    return NextResponse.json(formattedReturns)
  } catch (error) {
    console.error("API Error: /api/returns", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { order_id, product_id, product_name, return_reason, purchase_date, category, notes, condition, images } =
      await req.json()

    if (!product_id || !product_name || !return_reason || !purchase_date || !category || !condition) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabase.from("return_items").insert({
      order_id,
      product_id,
      product_name,
      return_reason,
      purchase_date,
      category,
      notes,
      condition,
      images,
      eligibility_status: "pending", // Initial status
      refund_status: "pending",
    })

    if (error) {
      console.error("Error adding return item:", error)
      return NextResponse.json({ error: "Failed to add return item" }, { status: 500 })
    }

    return NextResponse.json({ message: "Return item added successfully", data }, { status: 201 })
  } catch (error) {
    console.error("API Error: POST /api/returns", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
