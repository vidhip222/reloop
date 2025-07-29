import { NextResponse } from "next/server"
import { classifyReturnItem, suggestResalePlatform } from "@/lib/gemini"

export async function POST(req: Request) {
  try {
    const { productName, returnReason, condition, notes } = await req.json()

    if (!productName || !returnReason || !condition) {
      return NextResponse.json({ error: "Missing required fields for classification" }, { status: 400 })
    }

    const classification = await classifyReturnItem({
      productName,
      returnReason,
      condition,
      notes,
    })

    const resalePlatform = await suggestResalePlatform({
      productName,
      classification,
    })

    return NextResponse.json({ classification, resalePlatform })
  } catch (error) {
    console.error("API Error: /api/returns/classify-ai", error)
    return NextResponse.json({ error: "Internal Server Error during AI classification" }, { status: 500 })
  }
}
