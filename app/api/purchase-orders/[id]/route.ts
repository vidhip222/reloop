import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    const { data, error } = await supabase
      .from("purchase_orders")
      .select("*, suppliers(name, email), buyers(name)")
      .eq("id", id)
      .single()

    if (error || !data) {
      console.error("Error fetching purchase order:", error)
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("API Error: GET /api/purchase-orders/[id]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    const { status, po_sent_at } = await req.json()

    const updateData: { status?: string; po_sent_at?: string } = {}
    if (status) updateData.status = status
    if (po_sent_at) updateData.po_sent_at = po_sent_at

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const { data, error } = await supabase.from("purchase_orders").update(updateData).eq("id", id).select().single()

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
