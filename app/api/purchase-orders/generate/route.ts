import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { generatePONegotiationTerms } from "@/lib/gemini"

export async function POST(req: Request) {
  try {
    const { recommendation_id } = await req.json()

    if (!recommendation_id) {
      return NextResponse.json({ error: "Recommendation ID is required" }, { status: 400 })
    }

    // Mock: Fetch recommendation details (e.g., product_id, recommended_quantity)
    // In a real scenario, you'd fetch this from your restock_recommendations table
    // For now, we'll use a simplified mock based on the ID
    const mockRecommendation = {
      product_id: recommendation_id.split("-")[1], // Extract SKU from mock ID
      product_name: `Product ${recommendation_id.split("-")[1]}`,
      recommended_quantity: Math.floor(Math.random() * 100) + 50,
      supplier_id: "mock-supplier-id-1", // Assume a default supplier for now
    }

    // Fetch supplier details (mock or from DB)
    let supplierData = null
    const { data: fetchedSupplierData, error: supplierError } = await supabase
      .from("suppliers")
      .select("id, name, avg_delivery_days, price_rating, sla_rating")
      .eq("id", mockRecommendation.supplier_id)
      .single()

    if (supplierError || !fetchedSupplierData) {
      console.warn(`Supplier with ID ${mockRecommendation.supplier_id} not found, using mock data.`)
      // Fallback to mock supplier data if not found in DB
      supplierData = {
        id: mockRecommendation.supplier_id,
        name: "Mock Supplier Inc.",
        avg_delivery_days: 7,
        price_rating: 4.0,
        sla_rating: 4.2,
      }
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
        sku: mockRecommendation.product_id,
        name: mockRecommendation.product_name,
        quantity: mockRecommendation.recommended_quantity,
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
        subject: `AI-Generated PO for ${mockRecommendation.product_name}`,
        items: items,
        items_count: items.length,
        negotiation_terms: negotiationTerms,
        total_amount: totalAmount,
        status: "draft", // Or 'pending' if it's auto-sent
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
