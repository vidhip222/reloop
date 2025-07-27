// Mock Gemini API integration for AI-powered features
export interface GeminiResponse {
  classification: string
  reasoning: string
  confidence: number
  suggestions?: string[]
  ai_suggested_platform?: string // New field
  suggestion_reason?: string // New field
}

export async function classifyReturnItem(itemData: {
  productName: string
  returnReason: string
  category: string
  notes: string
  imageUrl?: string
}): Promise<GeminiResponse> {
  // Mock AI classification logic
  await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API delay

  const { productName, returnReason, category, notes } = itemData

  // Simple rule-based classification for demo
  let classification = "manual_review" // Changed default to manual_review
  let reasoning = "Requires manual review"
  let confidence = 0.7
  let ai_suggested_platform: string | undefined = undefined
  let suggestion_reason: string | undefined = undefined

  if (returnReason.toLowerCase().includes("size") && notes.toLowerCase().includes("perfect condition")) {
    classification = "relist"
    reasoning = "Item is in perfect condition with only size issues. Ideal for relisting in main store."
    confidence = 0.95
    ai_suggested_platform = "Shopify"
    suggestion_reason = "Perfect condition, high demand for this product type."
  } else if (returnReason.toLowerCase().includes("defect") && !notes.toLowerCase().includes("significant")) {
    classification = "outlet"
    reasoning = "Minor defect makes it suitable for outlet store at reduced price."
    confidence = 0.85
    ai_suggested_platform = "Outlet Store"
    suggestion_reason = "Minor cosmetic defect, suitable for discounted sale."
  } else if (category === "Accessories" && returnReason.toLowerCase().includes("changed mind")) {
    classification = "marketplace"
    reasoning = "High-value accessory in good condition. Best suited for marketplace resale."
    confidence = 0.8
    ai_suggested_platform = "TheRealReal"
    suggestion_reason = "High-value luxury item, best for authenticated marketplaces."
  } else if (notes.toLowerCase().includes("damage") || notes.toLowerCase().includes("tear")) {
    classification = "discard"
    reasoning = "Damage too extensive for resale. Recommend donation or disposal."
    confidence = 0.9
    ai_suggested_platform = "Donate"
    suggestion_reason = "Significant damage, not suitable for resale or outlet."
  }

  return {
    classification,
    reasoning,
    confidence,
    ai_suggested_platform,
    suggestion_reason,
  }
}

export async function generatePONegotiationTerms(supplierData: {
  name: string
  deliverySpeed: number
  priceRating: number
  slaRating: number
}): Promise<string> {
  // Mock AI-generated negotiation terms
  await new Promise((resolve) => setTimeout(resolve, 800))

  const { name, deliverySpeed, priceRating, slaRating } = supplierData

  const terms = []

  if (deliverySpeed > 10) {
    terms.push("Request expedited shipping options")
  }

  if (priceRating < 4.0) {
    terms.push("Negotiate volume discount for orders over $10,000")
  }

  if (slaRating > 4.5) {
    terms.push("Standard payment terms acceptable due to excellent SLA")
  } else {
    terms.push("Request performance guarantees and penalties for delays")
  }

  terms.push("Net 30 payment terms")
  terms.push("Quality inspection clause")

  return terms.join("; ")
}

export async function suggestResalePlatform(itemData: {
  category: string
  value: number
  condition: string
}): Promise<{ platform: string; reasoning: string }> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const { category, value, condition } = itemData

  if (value > 200 && (category === "Accessories" || category === "Luxury")) {
    return {
      platform: "therealreal",
      reasoning: "High-value luxury item best suited for authenticated luxury marketplace",
    }
  } else if (category === "Apparel" && condition === "excellent") {
    return {
      platform: "poshmark",
      reasoning: "Fashion items in excellent condition perform well on Poshmark",
    }
  } else if (value < 50) {
    return {
      platform: "mercari",
      reasoning: "Lower-value items have good success rate on Mercari",
    }
  } else {
    return {
      platform: "ebay",
      reasoning: "Versatile platform suitable for most item types and price ranges",
    }
  }
}
