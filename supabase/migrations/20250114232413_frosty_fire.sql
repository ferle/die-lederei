/*
  # Orders Schema Setup

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `status` (enum: pending, processing, completed, cancelled)
      - `total_amount` (integer, in cents)
      - `customer_name` (text)
      - `customer_email` (text)
      - `shipping_address` (text)
      - `user_id` (uuid, references auth.users)
    
    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references orders)
      - `product_id` (uuid, references products)
      - `quantity` (integer)
      - `price_at_time` (integer, in cents)

  2. Security
    - Enable RLS on both tables
    - Add policies for:
      - Admins can read all orders
      - Users can read their own orders
      - Public can create orders (for guest checkout)
*/

-- Create order status enum
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled');

-- Create orders table
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  status order_status DEFAULT 'pending',
  total_amount integer NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  shipping_address text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  notes text
);

-- Create order items table
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  price_at_time integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies for orders table
CREATE POLICY "Admins can read all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'admin');

CREATE POLICY "Users can read own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Public can create orders"
  ON orders
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policies for order items
CREATE POLICY "Admins can read all order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'admin');

CREATE POLICY "Users can read own order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can create order items"
  ON order_items
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX orders_user_id_idx ON orders(user_id);
CREATE INDEX orders_status_idx ON orders(status);
CREATE INDEX order_items_order_id_idx ON order_items(order_id);
CREATE INDEX order_items_product_id_idx ON order_items(product_id);