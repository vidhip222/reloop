import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data, error } = await supabase.from("resale_items").select("*").order("listed_at", { ascending: false })

    if (error) {
      console.error("Error fetching resale items:", error)
      return NextResponse.json({ error: "Failed to fetch resale items" }, { status: 500 })
    }

    const formattedResaleItems = data.map((item) => ({
      id: item.id,
      return_item_id: item.return_item_id,
      product_name: item.product_name,
      platform: item.platform,
      listing_price: item.listing_price,
      current_status: item.current_status,
      sold_price: item.sold_price,
      profit_margin: item.profit_margin,
      platform_listing_id: item.platform_listing_id,
      listed_at: item.listed_at,
      sold_at: item.sold_at,
    }))

    return NextResponse.json(formattedResaleItems)
  } catch (error) {
    console.error("API Error: /api/resale-items", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
