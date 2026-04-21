import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pufvwiwpwypmwbboderv.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1ZnZ3aXdwd3lwbXdiYm9kZXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTQ5NzMsImV4cCI6MjA5MjI5MDk3M30.0XOnFjObttYbNpaWZ1FevTphmqwIC8V38W6LZdHta9c'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─────────────────────────────────────────────
// 1. LEADS
// ─────────────────────────────────────────────
const leads = [
  {
    name: 'Ulze & Vater',
    company: null,
    industry: 'Sonstiges',
    status: 'contacted',
    next_step: 'Termin – Lead Gen App pitchen',
    email: null,
    phone: null,
  },
  {
    name: 'Irmak',
    company: 'Krankenfahrten',
    industry: 'Dienstleistung',
    status: 'contacted',
    next_step: 'Detail-Gespräch führen',
    email: null,
    phone: null,
  },
  {
    name: 'Etem',
    company: 'Fahrschule NoLimit',
    industry: 'Dienstleistung',
    status: 'contacted',
    next_step: 'Follow-up – Mockup zeigen',
    email: null,
    phone: null,
  },
  {
    name: 'Salvia Holding (via Panna)',
    company: 'Salvia Holding',
    industry: 'Sonstiges',
    status: 'new',
    next_step: 'Warten auf Antwort von Panna',
    email: null,
    phone: null,
  },
  {
    name: 'Hassan',
    company: 'Candy Store',
    industry: 'Einzelhandel',
    status: 'new',
    next_step: 'Warten – Hassan meldet sich re: KI Avatar',
    email: null,
    phone: null,
  },
  {
    name: 'Mike',
    company: 'Gutachter',
    industry: 'Dienstleistung',
    status: 'new',
    next_step: 'Kontaktieren und Bedarf klären',
    email: null,
    phone: null,
  },
  {
    name: 'Chaye',
    company: 'Stauffen Logistik',
    industry: 'Logistik & Transport',
    status: 'new',
    next_step: 'Später angehen',
    email: null,
    phone: null,
  },
  {
    name: 'Luca',
    company: 'Vertriebler (Versicherung)',
    industry: 'Finanz & Versicherung',
    status: 'new',
    next_step: 'Gespräch führen – Vertriebspartnerschaft evaluieren',
    email: null,
    phone: null,
  },
]

// ─────────────────────────────────────────────
// 2. LEAD NOTES (nach Lead-Name indiziert)
// ─────────────────────────────────────────────
const leadNotes: Record<string, string[]> = {
  'Ulze & Vater': ['Ulze ist persönlicher Kontakt. Vater hat Düngemittel-Business.'],
  'Irmak': ['Erstes Telefonat bereits geführt.'],
  'Etem': ['Website: fs-nolimit.de – Mockup bereits gebaut.'],
  'Salvia Holding (via Panna)': ['Mockup + Gamma-Präsentation vorbereitet.'],
}

// ─────────────────────────────────────────────
// 3. TASKS
// ─────────────────────────────────────────────
const tasks = [
  // Sales & Leads
  { title: 'Ulze – Termin vereinbaren', category: 'sales_leads', status: 'in_progress', description: 'Priorität: Hoch' },
  { title: 'Irmak anrufen', category: 'sales_leads', status: 'todo', description: 'Priorität: Hoch' },
  { title: 'Etem Follow-Up – Mockup zeigen', category: 'sales_leads', status: 'todo', description: 'Priorität: Hoch' },
  { title: 'Panna – Antwort abwarten (Salvia Holding)', category: 'sales_leads', status: 'waiting', description: 'Priorität: Mittel' },
  { title: 'Luca – Gespräch über Vertriebspartnerschaft', category: 'sales_leads', status: 'todo', description: 'Priorität: Mittel' },
  // Website
  { title: 'Website final fertigmachen', category: 'website', status: 'in_progress', description: 'Priorität: Hoch' },
  { title: 'Demos einbauen', category: 'website', status: 'todo', description: 'Priorität: Hoch' },
  { title: 'SEO optimieren', category: 'website', status: 'todo', description: 'Priorität: Mittel' },
  // Marketing
  { title: 'CL-Logo finalisieren', category: 'marketing', status: 'todo', description: 'Priorität: Hoch' },
  { title: 'Instagram aufbauen', category: 'marketing', status: 'todo', description: 'Priorität: Mittel' },
  { title: 'KI Avatar erstellen', category: 'marketing', status: 'todo', description: 'Priorität: Mittel' },
  // Systeme & Tech
  { title: 'Cold Outreach System bauen', category: 'systems_tech', status: 'todo', description: 'Priorität: Mittel' },
  { title: 'Telegram → Notion Bot', category: 'systems_tech', status: 'todo', description: 'Priorität: Mittel' },
  { title: 'Claude Design erkunden', category: 'systems_tech', status: 'todo', description: 'Priorität: Niedrig' },
  // Admin & Legal
  { title: 'Steuerberatung anrufen', category: 'admin_legal', status: 'todo', description: 'Priorität: Hoch' },
  { title: 'GbR-Name prüfen', category: 'admin_legal', status: 'todo', description: 'Priorität: Hoch' },
  { title: 'GbR anmelden', category: 'admin_legal', status: 'todo', description: 'Priorität: Hoch' },
  { title: 'Angebots-Vorlage erstellen', category: 'admin_legal', status: 'todo', description: 'Priorität: Mittel' },
]

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
async function seed() {
  console.log('🗑️  Lösche alle Demo-Einträge...')

  // Delete in dependency order (notes/products/items cascade, but tasks standalone)
  const { error: tasksDelErr } = await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (tasksDelErr) { console.error('Fehler beim Löschen von tasks:', tasksDelErr.message); process.exit(1) }

  const { error: leadsDelErr } = await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (leadsDelErr) { console.error('Fehler beim Löschen von leads:', leadsDelErr.message); process.exit(1) }

  console.log('✅ Alte Daten gelöscht.')

  // ── Insert Leads ──
  console.log('\n📋 Lege Leads an...')
  const { data: insertedLeads, error: leadsErr } = await supabase
    .from('leads')
    .insert(leads)
    .select('id, name')

  if (leadsErr || !insertedLeads) {
    console.error('Fehler beim Anlegen der Leads:', leadsErr?.message)
    process.exit(1)
  }

  console.log(`✅ ${insertedLeads.length} Leads angelegt.`)

  // ── Insert Notes ──
  console.log('\n📝 Lege Notizen an...')
  const notesToInsert: { lead_id: string; content: string; note_date: string }[] = []

  for (const lead of insertedLeads) {
    const notes = leadNotes[lead.name]
    if (!notes) continue
    for (const content of notes) {
      notesToInsert.push({
        lead_id: lead.id,
        content,
        note_date: new Date().toISOString().split('T')[0],
      })
    }
  }

  if (notesToInsert.length > 0) {
    const { error: notesErr } = await supabase.from('lead_notes').insert(notesToInsert)
    if (notesErr) {
      console.error('Fehler beim Anlegen der Notizen:', notesErr.message)
      process.exit(1)
    }
    console.log(`✅ ${notesToInsert.length} Notizen angelegt.`)
  }

  // ── Insert Tasks ──
  console.log('\n✅ Lege Tasks an...')
  const { data: insertedTasks, error: tasksErr } = await supabase
    .from('tasks')
    .insert(tasks)
    .select('id')

  if (tasksErr || !insertedTasks) {
    console.error('Fehler beim Anlegen der Tasks:', tasksErr?.message)
    process.exit(1)
  }

  console.log(`✅ ${insertedTasks.length} Tasks angelegt.`)

  console.log('\n🚀 Seed abgeschlossen! Alle echten Daten sind in Supabase.')
  console.log(`   ${insertedLeads.length} Leads  |  ${notesToInsert.length} Notizen  |  ${insertedTasks.length} Tasks`)
}

seed()
