import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    const { data, error } = await supabase
      .from("purchase_orders")
      .select("*, suppliers(name), buyers(name)")
      .eq("id", id)
      .single()

    if (error || !data) {
      console.error("Error fetching purchase order:", error)
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("API Error: /api/purchase-orders/[id]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    const updates = await req.json()

    const { data, error } = await supabase.from("purchase_orders").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("Error updating purchase order:", error)
      return NextResponse.json({ error: "Failed to update purchase order" }, { status: 500 })
    }

    return NextResponse.json({ message: "Purchase order updated successfully", data })
  } catch (error) {
    console.error("API Error: PUT /api/purchase-orders/[id]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    const { error } = await supabase.from("purchase_orders").delete().eq("id", id)

    if (error) {
      console.error("Error deleting purchase order:", error)
      return NextResponse.json({ error: "Failed to delete purchase order" }, { status: 500 })
    }

    return NextResponse.json({ message: "Purchase order deleted successfully" })
  } catch (error) {
    console.error("API Error: DELETE /api/purchase-orders/[id]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
