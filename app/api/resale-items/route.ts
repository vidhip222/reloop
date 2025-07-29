import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("return_items")
      .select("*")
      .eq("eligibility_status", "approved")
      .not("classification_ai", "is", null)
      .not("resale_platform_ai", "is", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching resale items:", error)
      return NextResponse.json({ error: "Failed to fetch resale items" }, { status: 500 })
    }

    const resaleItems = data.filter((item) => item.classification_ai !== "Discard") // Filter out discarded items

    return NextResponse.json(resaleItems)
  } catch (error) {
    console.error("API Error: /api/resale-items", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
