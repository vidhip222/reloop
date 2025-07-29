import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { mockReturnItems } from "@/lib/mock-data"

export async function GET() {
  try {
    const { data, error } = await supabase.from("return_items").select("created_at, eligibility_status")

    let returns = data || []

    if (error) {
      console.error("Error fetching return items for analytics:", error)
      // Fallback to mock data if DB fetch fails
      returns = mockReturnItems
    }

    const totalReturns = returns.length
    const pendingReturns = returns.filter((item) => item.eligibility_status === "pending").length
    const processedReturns = returns.filter(
      (item) => item.eligibility_status === "approved" || item.eligibility_status === "rejected",
    ).length

    const monthlyReturns: { [key: string]: number } = {}
    returns.forEach((item) => {
      const date = new Date(item.created_at)
      const monthYear = `${date.toLocaleString("default", { month: "short" })}-${date.getFullYear()}`
      monthlyReturns[monthYear] = (monthlyReturns[monthYear] || 0) + 1
    })

    return NextResponse.json({
      totalReturns,
      pendingReturns,
      processedReturns,
      monthlyReturns,
    })
  } catch (error) {
    console.error("API Error: /api/returns/analytics", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
