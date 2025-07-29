import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { mockReturnItems } from "@/lib/mock-data"

export async function GET() {
  try {
    const { data, error } = await supabase.from("return_items").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching return items:", error)
      // Fallback to mock data if DB fetch fails
      return NextResponse.json(mockReturnItems)
    }

    // If no data in DB, return mock data
    if (!data || data.length === 0) {
      return NextResponse.json(mockReturnItems)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("API Error: /api/returns", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { order_id, product_id, product_name, return_reason, purchase_date, category, notes, condition, images } =
      await req.json()

    if (!order_id || !product_id || !product_name || !return_reason || !purchase_date || !category || !condition) {
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
      eligibility_status: "pending", // Default status for new returns
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
