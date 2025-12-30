import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

function parseGeminiResponse(responseText: string) {
  // Remove markdown code block wrappers if present
  const cleanedText = responseText.replace(/```json\s*([\s\S]*?)\s*```/, "$1").trim()
  try {
    return JSON.parse(cleanedText)
  } catch (e) {
    console.error("Failed to parse Gemini response JSON:", e)
    console.error("Raw response text:", responseText)
    console.error("Cleaned text attempted to parse:", cleanedText)
    throw new Error("Invalid JSON response from Gemini API.")
  }
}

export async function classifyReturn(
  imageUrl: string,
  metadata: {
    sku: string
    brand: string
    returnReason: string
    tags: string[]
  },
) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

  const prompt = `
    Analyze this returned item and recommend the best action.
    
    Product Details:
    - SKU: ${metadata.sku}
    - Brand: ${metadata.brand}
    - Return Reason: ${metadata.returnReason}
    - Tags: ${metadata.tags.join(", ")}
    
    Based on the image and metadata, choose ONE action from:
    - Relist (new, tagged, trending)
    - Outlet (overstocked, off-season)
    - ThirdWorld (used but functional)
    - Donate (unsellable, clean)
    - Recycle (broken, damaged)
    - Resale (eBay, ThredUp, Depop if used but in season)
    - Review (low confidence/edge case)
    
    Respond in JSON format:
    {
      "tag": "Relist|Donate|Recycle|Refund|Outlet|Resale|Review",
      "rationale": "Brief explanation of why this action was chosen",
      "confidence": 0.85,
      "resale_channel": "suggested platform if tag is Resale",
      "suggested_price": 29.99,
      "notes": "optional"
    }
  `

  try {
    const result = await model.generateContent(prompt)
    const response = result.response.text()
    const parsed = parseGeminiResponse(response)
    return {
      action: parsed.tag || parsed.action,
      confidence: parsed.confidence,
      reasoning: parsed.rationale || parsed.reasoning,
      resale_platform: parsed.resale_channel || parsed.resale_platform || null,
      suggested_price: parsed.suggested_price || null,
      notes: parsed.notes || null,
    }
  } catch (error) {
    console.error("Gemini classification error:", error)
    return {
      action: "Review",
      confidence: 0.1,
      reasoning: "AI classification failed, manual review required",
      resale_platform: null,
      suggested_price: null,
      notes: null,
    }
  }
}

export async function suggestPOTerms(supplierData: any, skuData: any) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

  const prompt = `
    Given supplier metrics and SKU data, suggest optimal PO terms.
    
    Supplier: ${supplierData.name}
    - Avg Delivery: ${supplierData.avg_delivery_time} days
    - Return Rate: ${supplierData.return_rate}%
    - Defect Rate: ${supplierData.defect_rate}%
    - Current Unit Cost: $${supplierData.unit_cost}
    
    SKU Data:
    - Recent Sales: ${skuData.recent_sales}
    - Current Inventory: ${skuData.inventory}
    - Seasonal Factor: ${skuData.seasonal_factor}
    
    Suggest optimal terms in JSON:
    {
      "suggested_quantity": 100,
      "suggested_discount": 0.05,
      "moq_recommendation": 50,
      "shipping_terms": "FOB",
      "reasoning": "Brief explanation"
    }
  `

  const result = await model.generateContent(prompt)
  return parseGeminiResponse(result.response.text())
}

export async function predictRestock(sku: string, salesData: any, inventoryLevel: number) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

  const prompt = `
    Predict optimal restock quantity for SKU: ${sku}
    
    Recent Sales Data: ${JSON.stringify(salesData)}
    Current Inventory: ${inventoryLevel}
    
    Consider seasonal trends, promotions, and demand patterns.
    
    Respond in JSON:
    {
      "predicted_quantity": 150,
      "confidence_score": 0.87,
      "reasoning": "Why this quantity makes sense",
      "trend_analysis": "Hot/Cold/Niche/Seasonal"
    }
  `

  const result = await model.generateContent(prompt)
  return parseGeminiResponse(result.response.text())
}
