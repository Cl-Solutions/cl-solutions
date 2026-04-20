export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'

export interface Lead {
  id: string
  name: string
  company: string | null
  industry: string | null
  status: LeadStatus
  next_step: string | null
  email: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export interface LeadNote {
  id: string
  lead_id: string
  content: string
  note_date: string
  created_at: string
}

export interface LeadProduct {
  id: string
  lead_id: string
  name: string
  specifications: string | null
  created_at: string
}

export interface LeadItem {
  id: string
  lead_id: string
  title: string
  completed: boolean
  created_at: string
}

export type TaskCategory =
  | 'sales_leads'
  | 'website'
  | 'marketing'
  | 'systems_tech'
  | 'admin_legal'

export type TaskStatus = 'todo' | 'in_progress' | 'waiting' | 'done'

export interface Task {
  id: string
  title: string
  description: string | null
  category: TaskCategory
  status: TaskStatus
  due_date: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
}
