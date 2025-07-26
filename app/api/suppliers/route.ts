import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("suppliers")
      .select(
        "id, name, email, phone, address, avg_delivery_days, price_rating, sla_rating, region, rating, price_competitiveness, reliability_score, total_orders",
      )
      .order("rating", { ascending: false })

    if (error) {
      console.error("Error fetching suppliers:", error)
      return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 })
    }

    // Map DB fields to the frontend interface if necessary
    const formattedSuppliers = data.map((supplier) => ({
      id: supplier.id,
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      avg_delivery_days: supplier.avg_delivery_days,
      price_rating: supplier.price_rating,
      sla_rating: supplier.sla_rating,
      region: supplier.region,
      rating: supplier.rating,
      price_competitiveness: supplier.price_competitiveness,
      reliability_score: supplier.reliability_score,
      total_orders: supplier.total_orders,
    }))

    return NextResponse.json(formattedSuppliers)
  } catch (error) {
    console.error("API Error: /api/suppliers", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
