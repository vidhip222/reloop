import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      waitlist: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          email: string
        }
      }
      returns: {
        Row: {
          id: string
          sku: string
          return_reason: string
          image_url: string
          ai_action: string
          ai_confidence: number
          ai_reasoning: string
          manual_override: string | null
          status: string
          user_id: string
          relist_platform: string | null // Added relist_platform
          created_at: string
        }
        Insert: {
          sku: string
          return_reason: string
          image_url: string
          ai_action: string
          ai_confidence: number
          ai_reasoning: string
          manual_override?: string
          status: string
          user_id: string
          relist_platform?: string | null // Added relist_platform
        }
      }
      suppliers: {
        Row: {
          id: string
          name: string
          avg_delivery_time: number
          return_rate: number
          defect_rate: number
          unit_cost: number
          sla_grade: string
          location: string
          flagged: boolean
          created_at: string
        }
      }
      purchase_orders: {
        Row: {
          id: string
          supplier_id: string
          sku: string
          quantity: number
          unit_price: number
          total_amount: number
          status: string
          ai_suggestions: string
          created_at: string
          user_id: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          user_id: string
          role?: string
        }
      }
    }
  }
}
