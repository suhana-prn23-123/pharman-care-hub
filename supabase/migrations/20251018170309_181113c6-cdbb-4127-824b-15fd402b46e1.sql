-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('owner', 'customer');

-- Create owners table
CREATE TABLE public.owners (
  owner_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  pharmacy_name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table
CREATE TABLE public.customers (
  customer_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  age INTEGER NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create medicines table
CREATE TABLE public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT REFERENCES public.owners(owner_id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  expiry_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT REFERENCES public.customers(customer_id) ON DELETE CASCADE NOT NULL,
  medicine_id UUID REFERENCES public.medicines(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_price DECIMAL(10,2) NOT NULL,
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for owners
CREATE POLICY "Owners can view their own data"
  ON public.owners FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can insert their own data"
  ON public.owners FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their own data"
  ON public.owners FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for customers
CREATE POLICY "Customers can view their own data"
  ON public.customers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Customers can insert their own data"
  ON public.customers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Customers can update their own data"
  ON public.customers FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for medicines
CREATE POLICY "Anyone can view medicines"
  ON public.medicines FOR SELECT
  USING (true);

CREATE POLICY "Owners can insert their medicines"
  ON public.medicines FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.owners
      WHERE owners.owner_id = medicines.owner_id
      AND owners.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update their medicines"
  ON public.medicines FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.owners
      WHERE owners.owner_id = medicines.owner_id
      AND owners.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete their medicines"
  ON public.medicines FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.owners
      WHERE owners.owner_id = medicines.owner_id
      AND owners.user_id = auth.uid()
    )
  );

-- RLS Policies for orders
CREATE POLICY "Customers can view their orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE customers.customer_id = orders.customer_id
      AND customers.user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE customers.customer_id = orders.customer_id
      AND customers.user_id = auth.uid()
    )
  );

-- Function to generate next customer ID
CREATE OR REPLACE FUNCTION generate_customer_id()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  new_id TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(customer_id FROM 4) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.customers;
  
  new_id := 'CUS' || LPAD(next_num::TEXT, 3, '0');
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate next owner ID
CREATE OR REPLACE FUNCTION generate_owner_id()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  new_id TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(owner_id FROM 4) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.owners;
  
  new_id := 'OWN' || LPAD(next_num::TEXT, 3, '0');
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;