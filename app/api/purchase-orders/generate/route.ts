import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { generatePONegotiationTerms } from "@/lib/gemini"

export async function POST(req: Request) {
  try {
    const {
      recommendation_id, // Keep for context if needed
      product_id,
      product_name,
      recommended_quantity,
      supplier_id,
    } = await req.json()

    if (!product_id || !product_name || recommended_quantity === undefined || !supplier_id) {
      return NextResponse.json({ error: "Missing required product or supplier details" }, { status: 400 })
    }

    // Fetch supplier details using the provided supplier_id
    let supplierData = null
    const { data: fetchedSupplierData, error: supplierError } = await supabase
      .from("suppliers")
      .select("id, name, avg_delivery_days, price_rating, sla_rating")
      .eq("id", supplier_id) // Use the passed supplier_id
      .single()

    if (supplierError || !fetchedSupplierData) {
      console.error(`Supplier with ID ${supplier_id} not found:`, supplierError)
      return NextResponse.json({ error: "Supplier not found or invalid ID" }, { status: 404 })
    } else {
      supplierData = fetchedSupplierData
    }

    // Generate negotiation terms using AI
    const negotiationTerms = await generatePONegotiationTerms({
      name: supplierData.name,
      deliverySpeed: supplierData.avg_delivery_days,
      priceRating: supplierData.price_rating,
      slaRating: supplierData.sla_rating,
    })

    // Create a mock PO number
    const poNumber = `PO-AI-${Date.now()}`
    const items = [
      {
        sku: product_id,
        name: product_name,
        quantity: recommended_quantity,
        price: Number.parseFloat((Math.random() * 100 + 10).toFixed(2)), // Mock price
      },
    ]
    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.price, 0)

    // Insert into purchase_orders table
    const { data: newPO, error: insertError } = await supabase
      .from("purchase_orders")
      .insert({
        po_number: poNumber,
        supplier_id: supplierData.id,
        subject: `AI-Generated PO for ${product_name}`,
        items: items,
        items_count: items.length,
        negotiation_terms: negotiationTerms,
        total_amount: totalAmount,
        status: "draft",
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error inserting generated PO:", insertError)
      return NextResponse.json({ error: "Failed to save generated purchase order" }, { status: 500 })
    }

    return NextResponse.json(
      {
        message: "Purchase order generated successfully",
        po: newPO,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("API Error: /api/purchase-orders/generate", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
