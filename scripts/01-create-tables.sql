-- Drop tables if they exist to ensure a clean slate for schema updates
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.resale_items CASCADE;
DROP TABLE IF EXISTS public.return_items CASCADE;
DROP TABLE IF EXISTS public.purchase_orders CASCADE;
DROP TABLE IF EXISTS public.buyers CASCADE;
DROP TABLE IF EXISTS public.suppliers CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  avg_delivery_days INTEGER, -- Renamed from delivery_speed
  price_rating DECIMAL(3,2),
  sla_rating DECIMAL(3,2),
  region TEXT,
  status TEXT DEFAULT 'active',
  rating DECIMAL(3,2), -- New: overall rating
  price_competitiveness INTEGER, -- New: 0-100
  reliability_score INTEGER, -- New: 0-100
  total_orders INTEGER DEFAULT 0, -- New: total orders placed with this supplier
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create buyers table
CREATE TABLE IF NOT EXISTS public.buyers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  region TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase_orders table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NULL,
  supplier_id UUID REFERENCES public.suppliers(id),
  po_number TEXT UNIQUE NOT NULL,
  subject TEXT,
  status TEXT DEFAULT 'draft', -- draft, sent, confirmed, delivered, received, cancelled
  total_amount DECIMAL(10,2),
  items JSONB, -- array of {sku, name, quantity, price}
  items_count INTEGER DEFAULT 0, -- New: count of items in the order
  negotiation_terms TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create return_items table
CREATE TABLE IF NOT EXISTS public.return_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NULL,
  order_id TEXT, -- New: original order ID
  product_id TEXT, -- Renamed from sku
  product_name TEXT NOT NULL,
  return_reason TEXT,
  purchase_date DATE,
  category TEXT,
  image_url TEXT, -- Kept for single image, but images array is better
  images TEXT[], -- New: array of image URLs
  notes TEXT,
  condition TEXT, -- New: e.g., 'new', 'excellent', 'good', 'fair', 'poor'
  ai_classification TEXT, -- Renamed from classification
  confidence_score DECIMAL(3,2), -- New: AI confidence score
  resale_platform TEXT,
  eligibility_status TEXT DEFAULT 'pending', -- eligible, flagged, denied
  refund_status TEXT DEFAULT 'pending', -- pending, processed, failed
  refund_amount DECIMAL(10,2),
  ai_reasoning TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resale_items table (New table)
CREATE TABLE IF NOT EXISTS public.resale_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  return_item_id UUID REFERENCES public.return_items(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  platform TEXT NOT NULL, -- eBay, Poshmark, TheRealReal, etc.
  listing_price DECIMAL(10,2),
  current_status TEXT DEFAULT 'listed', -- listed, sold, pending, removed
  sold_price DECIMAL(10,2) NULL,
  profit_margin DECIMAL(5,2) NULL, -- Calculated margin
  platform_listing_id TEXT NULL,
  listed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sold_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NULL,
  supplier_email TEXT,
  default_po_subject TEXT,
  ebay_api_token TEXT,
  default_markup_percent DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies for tables with nullable owner_id:
-- Allow users to manage their own data, and allow anonymous access for seeded data (if owner_id is null)
CREATE POLICY "Users can manage own suppliers or view unassigned" ON public.suppliers
  FOR ALL USING (auth.uid() = owner_id OR owner_id IS NULL);

CREATE POLICY "Users can manage own buyers or view unassigned" ON public.buyers
  FOR ALL USING (auth.uid() = owner_id OR owner_id IS NULL);

CREATE POLICY "Users can manage own purchase orders or view unassigned" ON public.purchase_orders
  FOR ALL USING (auth.uid() = owner_id OR owner_id IS NULL);

CREATE POLICY "Users can manage own return items or view unassigned" ON public.return_items
  FOR ALL USING (auth.uid() = owner_id OR owner_id IS NULL);

-- Updated policy for resale_items using ownership from linked return_items
CREATE POLICY "Users can manage resale items linked to their return items" ON public.resale_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.return_items ri
      WHERE ri.id = resale_items.return_item_id
        AND (ri.owner_id = auth.uid() OR ri.owner_id IS NULL)
    )
  );

CREATE POLICY "Users can manage own settings or view unassigned" ON public.user_settings
  FOR ALL USING (auth.uid() = owner_id OR owner_id IS NULL);
