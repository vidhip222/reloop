import { generateText } from "ai"
import { google } from "@ai-sdk/google"

const GEMINI_MODEL = google("gemini-1.5-flash-latest")

// Mock function for generating PO negotiation terms
interface GeneratePONegotiationTermsProps {
  name: string
  deliverySpeed: number
  priceRating: number
  slaRating: number
}

export async function generatePONegotiationTerms({
  name,
  deliverySpeed,
  priceRating,
  slaRating,
}: GeneratePONegotiationTermsProps): Promise<string> {
  // In a real application, you would use an AI model here.
  // For now, we return a mock response based on the supplier's ratings.
  const prompt = `Generate concise negotiation terms for a purchase order with supplier "${name}".
  Consider their average delivery speed of ${deliverySpeed} days, price rating of ${priceRating}/5, and SLA rating of ${slaRating}/5.
  Focus on terms that would be beneficial given these metrics.
  For example, if delivery is slow, suggest expedited shipping options or penalties. If price rating is low, suggest discounts.
  Keep it to 2-3 sentences.`

  try {
    const { text } = await generateText({
      model: GEMINI_MODEL,
      prompt: prompt,
    })
    return text
  } catch (error) {
    console.error("Error generating negotiation terms with AI:", error)
    // Fallback to a generic mock response if AI call fails
    return `Standard payment terms (Net 30). Given ${name}'s average delivery of ${deliverySpeed} days, we request timely updates on shipment tracking. We expect quality consistent with their ${slaRating}/5 SLA rating.`
  }
}

// Mock function for classifying return items
interface ClassifyReturnItemProps {
  productName: string
  returnReason: string
  condition: string
  notes: string | null
}

export async function classifyReturnItem({
  productName,
  returnReason,
  condition,
  notes,
}: ClassifyReturnItemProps): Promise<string> {
  // In a real application, you would use an AI model here.
  // For now, we return a mock response.
  const prompt = `Classify the return of "${productName}" with reason "${returnReason}" and condition "${condition}".
  Notes: "${notes || "None"}".
  Suggest one of the following classifications: "Resalable", "Refurbishable", "Parts Only", "Discard".`

  try {
    const { text } = await generateText({
      model: GEMINI_MODEL,
      prompt: prompt,
    })
    return text
  } catch (error) {
    console.error("Error classifying return item with AI:", error)
    // Fallback to a generic mock response if AI call fails
    if (condition === "new" && returnReason === "Changed mind") {
      return "Resalable"
    } else if (condition === "damaged" || returnReason === "Defective") {
      return "Refurbishable"
    }
    return "Discard"
  }
}

// Mock function for suggesting resale platforms
interface SuggestResalePlatformProps {
  productName: string
  classification: string
}

export async function suggestResalePlatform({
  productName,
  classification,
}: SuggestResalePlatformProps): Promise<string> {
  // In a real application, you would use an AI model here.
  // For now, we return a mock response.
  const prompt = `Given the product "${productName}" and its classification "${classification}",
  suggest the most suitable resale platform.
  Examples: "Direct-to-consumer website", "Electronics Refurbisher", "Parts Salvage", "Donation Center".`

  try {
    const { text } = await generateText({
      model: GEMINI_MODEL, // Using a placeholder model
      prompt: prompt,
    })
    return text
  } catch (error) {
    console.error("Error suggesting resale platform with AI:", error)
    // Fallback to a generic mock response if AI call fails
    if (classification === "Resalable") {
      return "Direct-to-consumer website"
    } else if (classification === "Refurbishable") {
      return "Specialized Refurbishment Partner"
    } else if (classification === "Parts Only") {
      return "Parts Salvage Market"
    }
    return "Recycling Center"
  }
}
