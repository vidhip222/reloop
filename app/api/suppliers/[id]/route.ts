import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    const { data, error } = await supabase.from("suppliers").select("*").eq("id", id).single()

    if (error || !data) {
      console.error("Error fetching supplier:", error)
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("API Error: /api/suppliers/[id]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    const updates = await req.json()

    const { data, error } = await supabase.from("suppliers").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("Error updating supplier:", error)
      return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 })
    }

    return NextResponse.json({ message: "Supplier updated successfully", data })
  } catch (error) {
    console.error("API Error: PUT /api/suppliers/[id]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    const { error } = await supabase.from("suppliers").delete().eq("id", id)

    if (error) {
      console.error("Error deleting supplier:", error)
      return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 })
    }

    return NextResponse.json({ message: "Supplier deleted successfully" })
  } catch (error) {
    console.error("API Error: DELETE /api/suppliers/[id]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
