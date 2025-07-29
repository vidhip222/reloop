import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const { item_id, platform } = await req.json()

    if (!item_id || !platform) {
      return NextResponse.json({ error: "Missing required fields: item_id and platform" }, { status: 400 })
    }

    // In a real application, you would integrate with the marketplace API here
    // For now, we'll just update the return_items table to mark it as synced.

    const { data, error } = await supabase
      .from("return_items")
      .update({
        synced_to_marketplace: true,
        marketplace_platform: platform,
        synced_at: new Date().toISOString(),
      })
      .eq("id", item_id)
      .select()
      .single()

    if (error) {
      console.error("Error syncing item to marketplace:", error)
      return NextResponse.json({ error: "Failed to sync item to marketplace" }, { status: 500 })
    }

    return NextResponse.json({ message: `Item ${item_id} synced to ${platform} successfully`, data })
  } catch (error) {
    console.error("API Error: /api/marketplace-sync", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
