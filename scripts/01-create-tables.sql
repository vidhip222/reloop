-- Drop existing tables if they exist to ensure a clean slate
DROP TABLE IF EXISTS return_items CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS buyers CASCADE;
DROP TABLE IF EXISTS restock_recommendations CASCADE;

-- Create Suppliers Table
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    address TEXT,
    region VARCHAR(100),
    avg_delivery_days INT,
    price_rating INT CHECK (price_rating >= 1 AND price_rating <= 5),
    sla_rating INT CHECK (sla_rating >= 1 AND sla_rating <= 5),
    rating NUMERIC(3, 1), -- Overall rating, e.g., average of price and SLA
    price_competitiveness INT, -- Mock score 0-100
    reliability_score INT, -- Mock score 0-100
    total_orders INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Buyers Table
CREATE TABLE buyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    category VARCHAR(100),
    sku VARCHAR(100) UNIQUE NOT NULL,
    stock_quantity INT DEFAULT 0,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Purchase Orders Table
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
    buyer_id UUID REFERENCES buyers(id) ON DELETE SET NULL, -- New: Link to buyers
    subject VARCHAR(255) NOT NULL,
    items JSONB NOT NULL, -- Array of {product_id, product_name, quantity, unit_price}
    items_count INT NOT NULL DEFAULT 0, -- New: Count of items
    total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- e.g., 'draft', 'sent', 'confirmed', 'received', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP WITH TIME ZONE, -- New: When the PO was sent
    expected_delivery_date TIMESTAMP WITH TIME ZONE, -- New: Expected delivery date
    negotiation_terms TEXT -- New: AI-generated or custom negotiation terms
);

-- Create Return Items Table
CREATE TABLE return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(255) NOT NULL, -- Original sales order ID
    product_id VARCHAR(255) NOT NULL, -- SKU or internal product ID
    product_name VARCHAR(255) NOT NULL,
    return_reason TEXT NOT NULL,
    purchase_date DATE NOT NULL,
    category VARCHAR(100),
    notes TEXT,
    condition VARCHAR(50) NOT NULL, -- e.g., 'new', 'used', 'damaged', 'refurbished'
    images TEXT[], -- Array of image URLs
    eligibility_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    classification_ai TEXT, -- AI-generated classification (e.g., 'Resalable', 'Refurbishable', 'Parts Only', 'Discard')
    resale_platform_ai TEXT, -- AI-suggested resale platform
    synced_to_marketplace BOOLEAN DEFAULT FALSE, -- New: Track if synced to a resale marketplace
    marketplace_platform VARCHAR(100), -- New: Name of the marketplace platform
    synced_at TIMESTAMP WITH TIME ZONE, -- New: Timestamp of sync
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Restock Recommendations Table
CREATE TABLE restock_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    current_stock INT NOT NULL,
    recommended_quantity INT NOT NULL,
    confidence_score NUMERIC(3, 2) NOT NULL, -- 0.00 to 1.00
    urgency VARCHAR(50) NOT NULL, -- 'low', 'medium', 'high'
    predicted_stockout_date TIMESTAMP WITH TIME ZONE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(255),
    ai_reasoning TEXT,
    status VARCHAR(50) DEFAULT 'active', -- e.g., 'active', 'po_generated', 'dismissed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add RLS policies for all tables
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE restock_recommendations ENABLE ROW LEVEL SECURITY;

-- Policies for suppliers table
CREATE POLICY "Public suppliers are viewable by all users."
  ON suppliers FOR SELECT
  USING (true);

-- Policies for buyers table
CREATE POLICY "Public buyers are viewable by all users."
  ON buyers FOR SELECT
  USING (true);

-- Policies for products table
CREATE POLICY "Public products are viewable by all users."
  ON products FOR SELECT
  USING (true);

-- Policies for purchase_orders table
CREATE POLICY "Public purchase_orders are viewable by all users."
  ON purchase_orders FOR SELECT
  USING (true);

-- Policies for return_items table
CREATE POLICY "Public return_items are viewable by all users."
  ON return_items FOR SELECT
  USING (true);

-- Policies for restock_recommendations table
CREATE POLICY "Public restock_recommendations are viewable by all users."
  ON restock_recommendations FOR SELECT
  USING (true);

-- Enable insert/update/delete for authenticated users (adjust as needed for specific roles)
CREATE POLICY "Authenticated users can insert suppliers."
  ON suppliers FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update suppliers."
  ON suppliers FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete suppliers."
  ON suppliers FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert buyers."
  ON buyers FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update buyers."
  ON buyers FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete buyers."
  ON buyers FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert products."
  ON products FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update products."
  ON products FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete products."
  ON products FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert purchase_orders."
  ON purchase_orders FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update purchase_orders."
  ON purchase_orders FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete purchase_orders."
  ON purchase_orders FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert return_items."
  ON return_items FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update return_items."
  ON return_items FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete return_items."
  ON return_items FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert restock_recommendations."
  ON restock_recommendations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update restock_recommendations."
  ON restock_recommendations FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete restock_recommendations."
  ON restock_recommendations FOR DELETE
  USING (auth.role() = 'authenticated');
