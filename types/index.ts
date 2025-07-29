export interface Supplier {
  id: string
  name: string
  email: string
  phone: string
  address: string
  region: string
  avg_delivery_days: number
  price_rating: number
  sla_rating: number
  rating: number
  price_competitiveness: number
  reliability_score: number
  total_orders: number
  created_at: string
}

export interface Buyer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  created_at: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  sku: string
  stock_quantity: number
  supplier_id: string | null
  created_at: string
}

export interface PurchaseOrderItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
}

export interface PurchaseOrder {
  id: string
  po_number: string
  supplier_id: string
  buyer_id: string | null
  subject: string
  items: PurchaseOrderItem[]
  items_count: number
  total_amount: number
  status: "draft" | "pending" | "sent" | "received" | "cancelled"
  created_at: string
  sent_at: string | null
  expected_delivery_date: string | null
  negotiation_terms: string | null
  // Joined fields from relationships
  suppliers?: { name: string } | null
  buyers?: { name: string } | null
}

export interface ReturnItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  return_reason: string
  purchase_date: string
  category: string
  notes: string | null
  condition: "new" | "used" | "damaged" | "refurbished"
  images: string[] | null
  eligibility_status: "pending" | "approved" | "rejected"
  classification_ai: string | null
  resale_platform_ai: string | null
  synced_to_marketplace: boolean | null
  marketplace_platform: string | null
  synced_at: string | null
  created_at: string
}

export interface RestockRecommendation {
  id: string
  product_id: string
  product_name: string
  current_stock: number
  recommended_quantity: number
  confidence_score: number
  urgency: "low" | "medium" | "high"
  predicted_stockout_date: string
  supplier_id: string | null
  supplier_name: string | null
  ai_reasoning: string | null
  status: "active" | "po_generated" | "dismissed"
  created_at: string
}
