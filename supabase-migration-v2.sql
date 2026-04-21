-- ============================================================
-- CL-Solutions HQ – Migration v2
-- Ausführen im Supabase SQL Editor
-- ============================================================

-- ── 1. tasks: Constraint entfernen, neue Spalten ──────────
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_category_check;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'mittel';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notiz TEXT;

-- Alte Kategorie-Keys auf neue Namen migrieren
UPDATE tasks SET category = 'Sales & Leads'   WHERE category = 'sales_leads';
UPDATE tasks SET category = 'Website'         WHERE category = 'website';
UPDATE tasks SET category = 'Marketing'       WHERE category = 'marketing';
UPDATE tasks SET category = 'Systeme & Tech'  WHERE category = 'systems_tech';
UPDATE tasks SET category = 'Admin & Legal'   WHERE category = 'admin_legal';

-- ── 2. task_kategorien ────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_kategorien (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  emoji       TEXT DEFAULT '📌',
  sort_order  INT DEFAULT 0,
  erstellt_am TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO task_kategorien (name, emoji, sort_order) VALUES
  ('Sales & Leads',  '🎯', 1),
  ('Website',        '🌐', 2),
  ('Marketing',      '📣', 3),
  ('Systeme & Tech', '⚙️', 4),
  ('Admin & Legal',  '⚖️', 5),
  ('Allgemein',      '📦', 6)
ON CONFLICT (name) DO NOTHING;

-- ── 3. abos ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS abos (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  kategorie   TEXT DEFAULT 'Software',
  betrag      DECIMAL(10,2) NOT NULL DEFAULT 0,
  intervall   TEXT DEFAULT 'monatlich',
  faellig_tag INT,
  status      TEXT DEFAULT 'aktiv',
  notiz       TEXT,
  erstellt_am TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO abos (name, kategorie, betrag, intervall, status, notiz) VALUES
  ('n8n Cloud',        'Tool',      5.00,  'monatlich', 'aktiv',    NULL),
  ('Claude API',       'KI',        0.00,  'monatlich', 'aktiv',    'Variabel – Pay as you go'),
  ('VAPI',             'KI',        0.00,  'monatlich', 'aktiv',    'Variabel – Pay as you go'),
  ('Voiceflow',        'KI',        0.00,  'monatlich', 'aktiv',    'Variabel / Free Tier'),
  ('Chatbase',         'KI',        0.00,  'monatlich', 'aktiv',    'Variabel / Free Tier'),
  ('Cal.com',          'Tool',      0.00,  'monatlich', 'aktiv',    'Free Tier'),
  ('Tally.so',         'Tool',      0.00,  'monatlich', 'aktiv',    'Free Tier'),
  ('PandaDoc',         'Tool',      0.00,  'monatlich', 'aktiv',    'Variabel'),
  ('Stripe',           'Zahlung',   0.00,  'monatlich', 'aktiv',    'Take Rate – keine Fixkosten'),
  ('Lexoffice',        'Admin',     7.90,  'monatlich', 'aktiv',    NULL),
  ('Qonto',            'Admin',     9.00,  'monatlich', 'aktiv',    NULL),
  ('Outscraper',       'Tool',      0.00,  'monatlich', 'aktiv',    'Variabel – Pay as you go'),
  ('Airtable',         'Tool',      0.00,  'monatlich', 'aktiv',    'Free Tier'),
  ('Vercel',           'Hosting',   0.00,  'monatlich', 'aktiv',    'Free Tier / Variabel'),
  ('Hetzner VPS',      'Hosting',   5.00,  'monatlich', 'aktiv',    NULL);

-- ── 4. transaktionen ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS transaktionen (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  datum        DATE DEFAULT CURRENT_DATE,
  beschreibung TEXT NOT NULL,
  typ          TEXT NOT NULL,
  betrag       DECIMAL(10,2) NOT NULL,
  kategorie    TEXT,
  notiz        TEXT,
  erstellt_am  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. wissensbibliothek ─────────────────────────────────
CREATE TABLE IF NOT EXISTS wissensbibliothek (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url           TEXT NOT NULL,
  titel         TEXT NOT NULL,
  beschreibung  TEXT,
  kategorie     TEXT DEFAULT 'Allgemein',
  plattform     TEXT DEFAULT 'Sonstiges',
  thumbnail_url TEXT,
  erstellt_am   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. quick_links ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS quick_links (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  emoji       TEXT DEFAULT '🔗',
  kategorie   TEXT DEFAULT 'Tools & Software',
  farbe       TEXT DEFAULT '#06b6d4',
  erstellt_am TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO quick_links (name, url, emoji, kategorie, farbe) VALUES
  ('Supabase',       'https://supabase.com/dashboard',        '🗄️', 'Tools & Software', '#3ecf8e'),
  ('Vercel',         'https://vercel.com/dashboard',          '▲',  'Tools & Software', '#000000'),
  ('GitHub',         'https://github.com/Cl-Solutions',       '🐙', 'Tools & Software', '#24292e'),
  ('n8n',            'https://n8n.io',                        '⚡', 'Tools & Software', '#ff6d5a'),
  ('Airtable',       'https://airtable.com',                  '📊', 'Tools & Software', '#2d7ff9'),
  ('Cal.com',        'https://cal.com',                       '📅', 'Tools & Software', '#292929'),
  ('Voiceflow',      'https://creator.voiceflow.com',         '🎤', 'Tools & Software', '#5b5bd6'),
  ('VAPI',           'https://vapi.ai',                       '📞', 'Tools & Software', '#6366f1'),
  ('Claude.ai',      'https://claude.ai',                     '🤖', 'Tools & Software', '#d97706'),
  ('Notion HQ',      'https://notion.so',                     '📝', 'Projekte',         '#000000');

-- ── 7. ideen ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ideen (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titel        TEXT NOT NULL,
  beschreibung TEXT,
  kategorie    TEXT DEFAULT 'Produkt',
  status       TEXT DEFAULT 'idee',
  prioritaet   TEXT DEFAULT 'mittel',
  erstellt_am  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 8. RLS ───────────────────────────────────────────────
ALTER TABLE task_kategorien  ENABLE ROW LEVEL SECURITY;
ALTER TABLE abos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaktionen    ENABLE ROW LEVEL SECURITY;
ALTER TABLE wissensbibliothek ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_links      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideen            ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON task_kategorien   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON abos              FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON transaktionen     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON wissensbibliothek FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON quick_links       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON ideen             FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── 9. Realtime ──────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE task_kategorien;
ALTER PUBLICATION supabase_realtime ADD TABLE abos;
ALTER PUBLICATION supabase_realtime ADD TABLE transaktionen;
ALTER PUBLICATION supabase_realtime ADD TABLE wissensbibliothek;
ALTER PUBLICATION supabase_realtime ADD TABLE quick_links;
ALTER PUBLICATION supabase_realtime ADD TABLE ideen;
