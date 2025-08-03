-- Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table (for additional user data, linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'user' NOT NULL, -- e.g., 'admin', 'user', 'manager'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Create a trigger to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  avg_delivery_time INTEGER NOT NULL,
  return_rate DECIMAL(5,2) NOT NULL,
  defect_rate DECIMAL(5,2) NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  sla_grade VARCHAR(2) NOT NULL,
  location VARCHAR(255) NOT NULL,
  flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create returns table
CREATE TABLE IF NOT EXISTS returns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku VARCHAR(100) NOT NULL,
  return_reason VARCHAR(255) NOT NULL,
  image_url TEXT,
  ai_action VARCHAR(50) NOT NULL,
  ai_confidence DECIMAL(3,2) NOT NULL,
  ai_reasoning TEXT NOT NULL,
  manual_override VARCHAR(50),
  status VARCHAR(50) NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase_orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES suppliers(id),
  sku VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  ai_suggestions JSONB,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample suppliers
INSERT INTO suppliers (name, avg_delivery_time, return_rate, defect_rate, unit_cost, sla_grade, location, flagged) VALUES
('ReliableParts Inc', 5, 2.1, 0.8, 15.50, 'A+', 'California, USA', false),
('QuickShip Co', 3, 8.5, 12.3, 12.75, 'C', 'Texas, USA', true),
('GlobalSupply Ltd', 7, 3.2, 1.5, 18.25, 'A', 'Ontario, Canada', false),
('BudgetParts LLC', 10, 6.8, 4.2, 9.99, 'B+', 'Florida, USA', false),
('PremiumGoods Inc', 4, 1.8, 0.5, 22.50, 'A+', 'New York, USA', false);
