import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    const { data, error } = await supabase.from("return_items").select("*").eq("id", id).single()

    if (error || !data) {
      console.error("Error fetching return item:", error)
      return NextResponse.json({ error: "Return item not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("API Error: /api/returns/[id]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    const updates = await req.json()

    const { data, error } = await supabase.from("return_items").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("Error updating return item:", error)
      return NextResponse.json({ error: "Failed to update return item" }, { status: 500 })
    }

    return NextResponse.json({ message: "Return item updated successfully", data })
  } catch (error) {
    console.error("API Error: PUT /api/returns/[id]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    const { error } = await supabase.from("return_items").delete().eq("id", id)

    if (error) {
      console.error("Error deleting return item:", error)
      return NextResponse.json({ error: "Failed to delete return item" }, { status: 500 })
    }

    return NextResponse.json({ message: "Return item deleted successfully" })
  } catch (error) {
    console.error("API Error: DELETE /api/returns/[id]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
