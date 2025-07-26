import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("purchase_orders")
      .select("id, po_number, subject, status, total_amount, items_count, created_at, suppliers(name)")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching purchase orders:", error)
      return NextResponse.json({ error: "Failed to fetch purchase orders" }, { status: 500 })
    }

    const formattedOrders = data.map((order) => ({
      id: order.id,
      po_number: order.po_number,
      subject: order.subject,
      status: order.status,
      total_amount: order.total_amount,
      items_count: order.items_count,
      created_at: order.created_at,
      supplier_name: order.suppliers?.name || "N/A",
    }))

    return NextResponse.json(formattedOrders)
  } catch (error) {
    console.error("API Error: /api/purchase-orders", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { supplierId, subject, items, negotiationTerms } = await req.json()

    if (!supplierId || !subject || !items || items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const poNumber = `PO-${Date.now()}`
    const totalAmount = items.reduce((sum: number, item: any) => sum + item.quantity * item.price, 0)
    const itemsCount = items.length

    const { data, error } = await supabase.from("purchase_orders").insert({
      po_number: poNumber,
      supplier_id: supplierId,
      subject: subject,
      items: items,
      items_count: itemsCount,
      negotiation_terms: negotiationTerms,
      total_amount: totalAmount,
      status: "draft",
    })

    if (error) {
      console.error("Error creating purchase order:", error)
      return NextResponse.json({ error: "Failed to create purchase order" }, { status: 500 })
    }

    return NextResponse.json({ message: "Purchase order created successfully", data }, { status: 201 })
  } catch (error) {
    console.error("API Error: POST /api/purchase-orders", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
