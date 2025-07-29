import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY  || "your-anon-key"
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY  || "your-service-role-key"

if (!supabaseUrl) {
  console.error("supabaseUrl environment variables is not set!")
}
if (!supabaseAnonKey) {
  console.error("supabaseAnonKey environment variables is not set!")
}
if (!supabaseServiceRoleKey) {
  console.error("supabaseServiceRoleKey environment variables is not set!")
}

// Client-side Supabase client (for public access, e.g., sign-in)
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

// Server-side Supabase client (for privileged operations, e.g., API routes)
export const createAdminClient = () => createClient(supabaseUrl!, supabaseServiceRoleKey!)
