import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { to, subject, htmlContent } = await req.json()

    if (!to || !subject || !htmlContent) {
      return NextResponse.json({ error: "Missing required email fields" }, { status: 400 })
    }

    const { data, error } = await resend.emails.send({
      from: "ReLoop <onboarding@resend.dev>", // Replace with your verified Resend domain
      to: ["mailtovidhipatra@gmail.com"],
      subject: subject,
      html: htmlContent,
    })

    if (error) {
      console.error("Error sending email:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Email sent successfully", data })
  } catch (error) {
    console.error("API Error: /api/send-po-email", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
