import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { mockSuppliers } from "@/lib/mock-data"

export async function GET() {
  try {
    const { data, error } = await supabase.from("suppliers").select("*").order("name", { ascending: true })

    if (error) {
      console.error("Error fetching suppliers:", error)
      // Fallback to mock data if DB fetch fails
      return NextResponse.json(mockSuppliers)
    }

    // If no data in DB, return mock data
    if (!data || data.length === 0) {
      return NextResponse.json(mockSuppliers)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("API Error: /api/suppliers", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
