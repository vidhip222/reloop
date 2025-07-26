import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // In a real app, this would involve complex logic based on sales history, seasonality, etc.
    // For now, we'll mock some recommendations or fetch from a simplified DB table.
    // Let's use a mix of mock data and existing products for demonstration.

    const { data: products, error: productsError } = await supabase
      .from("return_items") // Using return_items as a source for product data
      .select("product_id, product_name, category")
      .limit(5)

    if (productsError) {
      console.error("Error fetching products for recommendations:", productsError)
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    const { data: suppliers, error: suppliersError } = await supabase.from("suppliers").select("id, name").limit(5)

    if (suppliersError) {
      console.error("Error fetching suppliers for recommendations:", suppliersError)
      return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 })
    }

    const recommendations = products.map((product, index) => {
      const currentStock = Math.floor(Math.random() * 20) // Mock current stock
      const predictedDemand = Math.floor(Math.random() * 100) + 50 // Mock demand
      const recommendedQuantity = Math.max(0, predictedDemand - currentStock)
      const confidenceScore = Number.parseFloat((Math.random() * 0.2 + 0.8).toFixed(2)) // 0.8 to 1.0
      const urgencyOptions = ["low", "medium", "high"]
      const urgency = urgencyOptions[Math.floor(Math.random() * urgencyOptions.length)]
      const predictedStockoutDate = new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() // Next 30 days
      const supplier = suppliers[index % suppliers.length] || suppliers[0] // Assign a supplier

      return {
        id: `rec-${product.product_id}-${index}`,
        product_id: product.product_id,
        product_name: product.product_name,
        current_stock: currentStock,
        recommended_quantity: recommendedQuantity,
        confidence_score: confidenceScore,
        urgency: urgency,
        predicted_stockout_date: predictedStockoutDate,
        supplier_id: supplier?.id || "mock-supplier-id",
        supplier_name: supplier?.name || "Mock Supplier",
        ai_reasoning: `Based on recent sales and ${product.category} trends, this item is predicted to stock out soon.`,
        status: "active",
      }
    })

    return NextResponse.json(recommendations)
  } catch (error) {
    console.error("API Error: /api/restock-recommendations", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
