// Mock data for various features
export const mockRestockPredictions = [
  {
    sku: "SKU-001",
    productName: "Cotton T-Shirt",
    currentStock: 15,
    predictedDemand: 120,
    recommendedOrder: 105,
    confidence: 0.92,
    seasonality: "High",
    trend: "Increasing",
  },
  {
    sku: "SKU-002",
    productName: "Denim Jeans",
    currentStock: 8,
    predictedDemand: 85,
    recommendedOrder: 77,
    confidence: 0.88,
    seasonality: "Medium",
    trend: "Stable",
  },
  {
    sku: "SKU-003",
    productName: "Sun Hat",
    currentStock: 25,
    predictedDemand: 200,
    recommendedOrder: 175,
    confidence: 0.95,
    seasonality: "Very High",
    trend: "Seasonal Peak",
  },
]

export const mockMarketplaceIntegrations = [
  { name: "eBay", status: "connected", listings: 45, sales: 12 },
  { name: "Poshmark", status: "connected", listings: 23, sales: 8 },
  { name: "TheRealReal", status: "pending", listings: 5, sales: 2 },
  { name: "Mercari", status: "disconnected", listings: 0, sales: 0 },
  { name: "Facebook Marketplace", status: "connected", listings: 18, sales: 6 },
]

export const mockPOSIntegrations = [
  { name: "Shopify", status: "connected", lastSync: "2024-01-15T10:30:00Z" },
  { name: "WooCommerce", status: "connected", lastSync: "2024-01-15T09:15:00Z" },
  { name: "Square", status: "pending", lastSync: null },
]

export const mockAnalytics = {
  totalReturns: 156,
  eligibleReturns: 124,
  flaggedReturns: 18,
  deniedReturns: 14,
  totalRefunds: 12450.75,
  recoveryRate: 0.68,
  avgProcessingTime: 2.3,
  topReturnReasons: [
    { reason: "Size issues", count: 45 },
    { reason: "Defective item", count: 32 },
    { reason: "Changed mind", count: 28 },
    { reason: "Not as described", count: 21 },
  ],
}
