-- CL-Solutions CRM - Supabase Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================
-- LEADS / CUSTOMERS
-- =====================
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  industry TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','proposal','negotiation','closed_won','closed_lost')),
  next_step TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation Notes
CREATE TABLE lead_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  note_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products / Solutions desired
CREATE TABLE lead_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  specifications TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Open Items (Checkboxes)
CREATE TABLE lead_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- TASKS
-- =====================
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('sales_leads','website','marketing','systems_tech','admin_legal')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo','in_progress','waiting','done')),
  due_date DATE,
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================
-- Enable RLS on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (anon key gives access)
-- IMPORTANT: For a private internal tool, use authenticated role instead of anon
-- For now we allow anon access since there's no auth setup
CREATE POLICY "Allow all for anon" ON leads FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON lead_notes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON lead_products FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON lead_items FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON tasks FOR ALL TO anon USING (true) WITH CHECK (true);

-- =====================
-- REALTIME
-- =====================
-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE lead_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE lead_products;
ALTER PUBLICATION supabase_realtime ADD TABLE lead_items;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;

-- =====================
-- SAMPLE DATA (optional)
-- =====================
INSERT INTO leads (name, company, industry, status, next_step, email) VALUES
  ('Max Mustermann', 'Muster GmbH', 'Handel & E-Commerce', 'qualified', 'Angebot senden', 'max@muster.de'),
  ('Sandra Bauer', 'Bauer Restaurants', 'Gastronomie & Hotellerie', 'contacted', 'Follow-up call Donnerstag', 'sandra@bauer-rest.de'),
  ('Thomas Klein', 'Klein Immobilien', 'Immobilien', 'new', 'Erstgespräch vereinbaren', null);

INSERT INTO tasks (title, category, status, assigned_to, due_date) VALUES
  ('Angebot für Muster GmbH vorbereiten', 'sales_leads', 'in_progress', 'Berkay', CURRENT_DATE + 2),
  ('Website Redesign Konzept', 'website', 'todo', 'Mario', CURRENT_DATE + 7),
  ('LinkedIn Kampagne planen', 'marketing', 'todo', 'Beide', CURRENT_DATE + 14),
  ('Make.com Automatisierung einrichten', 'systems_tech', 'waiting', 'Berkay', null),
  ('Impressum aktualisieren', 'admin_legal', 'done', 'Mario', null);
