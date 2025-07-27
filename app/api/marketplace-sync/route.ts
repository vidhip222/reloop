import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST() {
  try {
    // Fetch all resale items that are currently 'listed' or 'pending'
    const { data: resaleItems, error: fetchError } = await supabase
      .from("resale_items")
      .select("id, current_status")
      .in("current_status", ["listed", "pending"])

    if (fetchError) {
      console.error("Error fetching resale items for sync:", fetchError)
      return NextResponse.json({ error: "Failed to fetch resale items for sync" }, { status: 500 })
    }

    const updates = []
    for (const item of resaleItems) {
      // Simulate random status update
      const random = Math.random()
      let newStatus = item.current_status
      let soldPrice = null
      let profitMargin = null
      let soldAt = null

      if (item.current_status === "listed" && random < 0.3) {
        // 30% chance to sell
        newStatus = "sold"
        soldPrice = Number.parseFloat((Math.random() * 100 + 50).toFixed(2)) // Mock sold price
        profitMargin = Number.parseFloat((Math.random() * 20 + 10).toFixed(2)) // Mock profit margin
        soldAt = new Date().toISOString()
      } else if (item.current_status === "pending" && random < 0.5) {
        // 50% chance for pending to become listed
        newStatus = "listed"
      }

      if (newStatus !== item.current_status) {
        updates.push({
          id: item.id,
          current_status: newStatus,
          sold_price: soldPrice,
          profit_margin: profitMargin,
          sold_at: soldAt,
          updated_at: new Date().toISOString(),
        })
      }
    }

    if (updates.length > 0) {
      const { error: updateError } = await supabase.from("resale_items").upsert(updates)

      if (updateError) {
        console.error("Error updating resale items during sync:", updateError)
        return NextResponse.json({ error: "Failed to update resale items during sync" }, { status: 500 })
      }
    }

    return NextResponse.json(
      { message: `Simulated marketplace sync. ${updates.length} items updated.` },
      { status: 200 },
    )
  } catch (error) {
    console.error("API Error: /api/marketplace-sync", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
