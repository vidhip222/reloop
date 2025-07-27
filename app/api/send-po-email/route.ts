import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { poNumber, supplierEmail, subject, items, negotiationTerms } = await req.json()

    if (!poNumber || !supplierEmail || !subject || !items) {
      return NextResponse.json({ error: "Missing required email fields" }, { status: 400 })
    }

    // --- MOCK EMAIL SENDING LOGIC ---
    console.log("\n--- Simulating Email Send ---")
    console.log(`To: ${supplierEmail}`)
    console.log(`Subject: ${subject} (PO: ${poNumber})`)
    console.log("Items:")
    items.forEach((item: any) => {
      console.log(`  - ${item.name} (SKU: ${item.sku}): ${item.quantity} units @ $${item.price.toFixed(2)} each`)
    })
    console.log(`Negotiation Terms: ${negotiationTerms}`)
    console.log("--- Email Simulation Complete ---\n")

    // Simulate a delay for email sending
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // In a real application, you would integrate with an email service like Resend here:
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'onboarding@resend.dev',
    //   to: supplierEmail,
    //   subject: subject,
    //   html: `<h1>Purchase Order ${poNumber}</h1>...`, // Build HTML email content
    // });

    return NextResponse.json({ message: "Mock email sent successfully" }, { status: 200 })
  } catch (error) {
    console.error("API Error: /api/send-po-email", error)
    return NextResponse.json({ error: "Failed to send mock email" }, { status: 500 })
  }
}
