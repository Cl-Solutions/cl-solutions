// ─── Leads ───────────────────────────────────────────────
export type LeadStatus =
  | 'new' | 'contacted' | 'qualified' | 'proposal'
  | 'negotiation' | 'closed_won' | 'closed_lost'

export interface Lead {
  id: string; name: string; company: string | null
  industry: string | null; status: LeadStatus
  next_step: string | null; email: string | null
  phone: string | null; created_at: string; updated_at: string
}
export interface LeadNote {
  id: string; lead_id: string; content: string
  note_date: string; created_at: string
}
export interface LeadProduct {
  id: string; lead_id: string; name: string
  specifications: string | null; created_at: string
}
export interface LeadItem {
  id: string; lead_id: string; title: string
  completed: boolean; created_at: string
}

// ─── Tasks ───────────────────────────────────────────────
export type TaskStatus = 'todo' | 'in_progress' | 'waiting' | 'done'
export type TaskPriority = 'hoch' | 'mittel' | 'niedrig'

export interface TaskKategorie {
  id: string; name: string; emoji: string
  sort_order: number; erstellt_am: string
}
export interface Task {
  id: string; titel: string; notiz: string | null
  category: string; status: TaskStatus
  priority: TaskPriority; due_date: string | null
  assigned_to: string | null; created_at: string; updated_at: string
}

// ─── Finanzen ────────────────────────────────────────────
export type AboIntervall = 'monatlich' | 'jaehrlich'
export type AboStatus = 'aktiv' | 'pausiert' | 'gekuendigt'
export type TransaktionTyp = 'einnahme' | 'ausgabe'

export interface Abo {
  id: string; name: string; kategorie: string
  betrag: number; intervall: AboIntervall
  faellig_tag: number | null; status: AboStatus
  notiz: string | null; erstellt_am: string
}
export interface Transaktion {
  id: string; datum: string; beschreibung: string
  typ: TransaktionTyp; betrag: number
  kategorie: string | null; notiz: string | null; erstellt_am: string
}

// ─── Wissensbibliothek ───────────────────────────────────
export type WissenPlattform = 'YouTube' | 'Instagram' | 'TikTok' | 'Sonstiges'

export interface WissensEintrag {
  id: string; url: string; titel: string
  beschreibung: string | null; kategorie: string
  plattform: WissenPlattform; thumbnail_url: string | null
  erstellt_am: string
}

// ─── Quick Links ─────────────────────────────────────────
export interface QuickLink {
  id: string; name: string; url: string
  emoji: string; kategorie: string
  farbe: string; erstellt_am: string
}

// ─── Ideen ───────────────────────────────────────────────
export type IdeenStatus = 'idee' | 'in_pruefung' | 'umgesetzt' | 'verworfen'
export type IdeenKategorie = 'Produkt' | 'Marketing' | 'Intern' | 'Kunde'

export interface Idee {
  id: string; titel: string; beschreibung: string | null
  kategorie: IdeenKategorie; status: IdeenStatus
  prioritaet: TaskPriority; erstellt_am: string
}
