import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data: returnItems, error } = await supabase.from("return_items").select("*")

    if (error) {
      console.error("Error fetching return items for analytics:", error)
      return NextResponse.json({ error: "Failed to fetch return items for analytics" }, { status: 500 })
    }

    const total_returns = returnItems.length
    const pending_classification = returnItems.filter((item) => !item.ai_classification).length
    const eligible_returns = returnItems.filter((item) => item.eligibility_status === "eligible").length
    const denied_returns = returnItems.filter((item) => item.eligibility_status === "denied").length
    const total_refunded_amount = returnItems
      .filter((item) => item.refund_status === "processed" && item.refund_amount)
      .reduce((sum, item) => sum + item.refund_amount, 0)

    const classification_breakdown = returnItems.reduce(
      (acc, item) => {
        const classification = item.ai_classification || "pending"
        acc[classification] = (acc[classification] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const { data: resaleItems, error: resaleError } = await supabase.from("resale_items").select("*")

    if (resaleError) {
      console.error("Error fetching resale items for analytics:", resaleError)
      return NextResponse.json({ error: "Failed to fetch resale items for analytics" }, { status: 500 })
    }

    const platform_performance: { platform: string; listed: number; sold: number; revenue: number }[] = []
    const platformMap = new Map<string, { listed: number; sold: number; revenue: number }>()

    resaleItems.forEach((item) => {
      if (!platformMap.has(item.platform)) {
        platformMap.set(item.platform, { listed: 0, sold: 0, revenue: 0 })
      }
      const platformStats = platformMap.get(item.platform)!
      platformStats.listed += 1
      if (item.current_status === "sold") {
        platformStats.sold += 1
        platformStats.revenue += item.sold_price || 0
      }
    })

    platformMap.forEach((stats, platform) => {
      platform_performance.push({ platform, ...stats })
    })

    // Mock recovery revenue calculation (simplified)
    const total_recovered_revenue = resaleItems
      .filter((item) => item.current_status === "sold" && item.sold_price)
      .reduce((sum, item) => sum + item.sold_price!, 0)

    const analytics = {
      total_returns,
      pending_classification,
      eligible_returns,
      denied_returns,
      total_refunded_amount,
      total_recovered_revenue,
      classification_breakdown,
      platform_performance,
    }

    return NextResponse.json([analytics]) // Return as an array as per frontend expectation
  } catch (error) {
    console.error("API Error: /api/returns/analytics", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
