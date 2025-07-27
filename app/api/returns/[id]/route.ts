import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    const { final_platform_choice } = await req.json()

    if (!final_platform_choice) {
      return NextResponse.json({ error: "Missing final_platform_choice" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("return_items")
      .update({ final_platform_choice: final_platform_choice, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating return item final platform:", error)
      return NextResponse.json({ error: "Failed to update return item final platform" }, { status: 500 })
    }

    return NextResponse.json({ message: "Return item final platform updated successfully", data })
  } catch (error) {
    console.error("API Error: PATCH /api/returns/[id]", error)
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

    return NextResponse.json({ message: "Return item deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("API Error: DELETE /api/returns/[id]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
