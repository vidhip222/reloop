import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    const { error } = await supabase.from("suppliers").delete().eq("id", id)

    if (error) {
      console.error("Error deleting supplier:", error)
      return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 })
    }

    return NextResponse.json({ message: "Supplier deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("API Error: DELETE /api/suppliers/[id]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
