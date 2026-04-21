import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://pufvwiwpwypmwbboderv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1ZnZ3aXdwd3lwbXdiYm9kZXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTQ5NzMsImV4cCI6MjA5MjI5MDk3M30.0XOnFjObttYbNpaWZ1FevTphmqwIC8V38W6LZdHta9c'
)

async function run() {
  // Lead suchen
  const { data: lead, error } = await supabase
    .from('leads')
    .select('id')
    .eq('name', 'Ulze & Vater')
    .single()

  if (error || !lead) {
    console.error('Lead nicht gefunden:', error?.message)
    process.exit(1)
  }

  const id = lead.id
  console.log(`✅ Lead gefunden: ${id}`)

  // ── Status + Nächster Schritt aktualisieren ──
  await supabase
    .from('leads')
    .update({
      status: 'qualified',
      next_step: 'Videocall nächste Woche – Prozesse + Daten vom Kunden ausstehend',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  console.log('✅ Status auf "Qualifiziert" gesetzt.')

  // ── Gesprächsnotiz eintragen ──
  const noteContent = `Kundengespräch – Zusammenfassung

Produkt 1: Lead Generation App
- 5 feste Spalten nach Kundenvorgabe (z.B. Branche)
- Flexible Branchen-Erweiterung möglich
- Mehrbenutzer-Zugriff mit Rollenrechten

Produkt 2: CRM-System (aufbauend auf Lead App)
- Übernahme der Daten aus Lead Gen App
- Import großer Excel-Dateien (sehr wichtig!)
- Bulk-E-Mail-Versand ohne manuelles Einzelklicken
- Templates: Erstkontakt / Follow-up / Letzte Chance
- Filterlogik: nach Branche, Zielgruppe, E-Mail-Typ
→ Priorität: Bulk-Mail + Excel-Import + Filterlogik (Mario kann sofort anfangen)

Produkt 3: Paletten-/Logistik-Konfigurator (Dünger-Business)
- Berechnung: Paketgrößen auf Paletten, Paletten pro LKW
- KI-Optimierung: beste Pakekombinationen, weniger Leerraum
- Use Case: Mehrere Kundenbestellungen intelligent in einem LKW bündeln

Produkt 4: Social Media Automation
- LinkedIn, Xing (ggf. weitere)
- Text + Content-Struktur + einfache Designs
- Optional: automatisches Posten via Bot

Produkt 5: Dünger-Rechner (Website-Feature)
- Kunde gibt Fläche ein → System berechnet Düngermenge + Packungsanzahl
- Simples Conversion-Tool für die Website

Nächste Schritte:
- Videocall nächste Woche (vom Kunden vorgeschlagen)
- Kunde sendet Prozesse + Daten → dann konkrete Umsetzung & Systemdesign`

  const { error: noteErr } = await supabase.from('lead_notes').insert({
    lead_id: id,
    content: noteContent,
    note_date: new Date().toISOString().split('T')[0],
  })

  if (noteErr) { console.error('Fehler Notiz:', noteErr.message); process.exit(1) }
  console.log('✅ Gesprächsnotiz eingetragen.')

  // ── Produkte/Lösungen eintragen ──
  const products = [
    {
      lead_id: id,
      name: 'Lead Generation App',
      specifications: '5 feste Spalten, flexible Branchenerweiterung, Mehrbenutzer-Zugriff mit Rollenrechten',
    },
    {
      lead_id: id,
      name: 'CRM-System mit Bulk-E-Mail',
      specifications: 'Excel-Import, Bulk-Mail-Versand, Templates (Erstkontakt/Follow-up/Letzte Chance), Filterlogik nach Branche & Zielgruppe',
    },
    {
      lead_id: id,
      name: 'Paletten-/Logistik-Konfigurator',
      specifications: 'Palettenberechnung, LKW-Optimierung, KI-gestützte Kombination von Kundenbestellungen (Dünger-Business)',
    },
    {
      lead_id: id,
      name: 'Social Media Automation',
      specifications: 'LinkedIn & Xing, Text + Content-Erstellung, optional automatisches Posten',
    },
    {
      lead_id: id,
      name: 'Dünger-Rechner (Website)',
      specifications: 'Fläche eingeben → Düngermenge + Packungsanzahl berechnen. Conversion-Tool für Website.',
    },
  ]

  const { error: prodErr } = await supabase.from('lead_products').insert(products)
  if (prodErr) { console.error('Fehler Produkte:', prodErr.message); process.exit(1) }
  console.log(`✅ ${products.length} Produkte/Lösungen eingetragen.`)

  // ── Offene Punkte (Checkboxen) ──
  const items = [
    { lead_id: id, title: 'Videocall nächste Woche terminieren', completed: false },
    { lead_id: id, title: 'Prozesse + Daten vom Kunden abwarten', completed: false },
    { lead_id: id, title: 'Systemdesign & Umsetzungsplan erstellen', completed: false },
    { lead_id: id, title: 'Angebot / Kostenübersicht vorbereiten', completed: false },
  ]

  const { error: itemErr } = await supabase.from('lead_items').insert(items)
  if (itemErr) { console.error('Fehler Items:', itemErr.message); process.exit(1) }
  console.log(`✅ ${items.length} offene Punkte eingetragen.`)

  console.log('\n🚀 Ulze & Vater vollständig aktualisiert.')
}

run()
