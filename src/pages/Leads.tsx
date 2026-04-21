import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, ChevronRight, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Lead, LeadStatus } from '../types'

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Neu',
  contacted: 'Kontaktiert',
  qualified: 'Qualifiziert',
  proposal: 'Angebot',
  negotiation: 'Verhandlung',
  closed_won: 'Gewonnen',
  closed_lost: 'Verloren',
}

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-purple-100 text-purple-700',
  proposal: 'bg-orange-100 text-orange-700',
  negotiation: 'bg-pink-100 text-pink-700',
  closed_won: 'bg-green-100 text-green-700',
  closed_lost: 'bg-gray-100 text-gray-500',
}

const INDUSTRIES = [
  'Handel & E-Commerce',
  'Gastronomie & Hotellerie',
  'Gesundheit & Medizin',
  'Handwerk & Bau',
  'Immobilien',
  'Bildung & Coaching',
  'Finanz & Versicherung',
  'Marketing & Medien',
  'IT & Software',
  'Logistik & Transport',
  'Sonstiges',
]

const ALL_STATUSES: LeadStatus[] = [
  'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost',
]

interface NewLeadForm {
  name: string
  company: string
  industry: string
  status: LeadStatus
  next_step: string
  email: string
  phone: string
}

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<NewLeadForm>({
    name: '',
    company: '',
    industry: '',
    status: 'new',
    next_step: '',
    email: '',
    phone: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadLeads()
    const channel = supabase
      .channel('leads-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, loadLeads)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadLeads() {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .order('updated_at', { ascending: false })
    setLeads(data || [])
    setLoading(false)
  }

  async function createLead() {
    if (!form.name.trim()) return
    setSaving(true)
    await supabase.from('leads').insert({
      name: form.name.trim(),
      company: form.company || null,
      industry: form.industry || null,
      status: form.status,
      next_step: form.next_step || null,
      email: form.email || null,
      phone: form.phone || null,
    })
    setForm({ name: '', company: '', industry: '', status: 'new', next_step: '', email: '', phone: '' })
    setSaving(false)
    setShowModal(false)
  }

  const filtered = leads.filter((l) => {
    const matchSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.company || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.industry || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || l.status === filterStatus
    return matchSearch && matchStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Leads & Kunden</h1>
          <p className="text-sm text-gray-500 mt-0.5">{leads.length} Kontakte insgesamt</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-cyan-600 transition-colors"
        >
          <Plus size={16} />
          Neuer Lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="relative w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
          />
        </div>
        <div className="flex flex-wrap gap-1 bg-white border border-gray-200 rounded-lg p-1">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              filterStatus === 'all' ? 'bg-cyan-500 text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Alle
          </button>
          {ALL_STATUSES.filter(s => s !== 'closed_won' && s !== 'closed_lost').map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                filterStatus === s ? 'bg-cyan-500 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Lead Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">Keine Leads gefunden</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filtered.map((lead) => (
            <Link
              key={lead.id}
              to={`/leads/${lead.id}`}
              className="bg-white rounded-xl border border-gray-100 p-5 hover:border-cyan-200 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-cyan-600 transition-colors">
                    {lead.name}
                  </h3>
                  {lead.company && (
                    <p className="text-xs text-gray-500 mt-0.5">{lead.company}</p>
                  )}
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-cyan-400 transition-colors mt-0.5" />
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[lead.status]}`}>
                  {STATUS_LABELS[lead.status]}
                </span>
                {lead.industry && (
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                    {lead.industry}
                  </span>
                )}
              </div>

              {lead.next_step && (
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <p className="text-xs text-gray-500">
                    <span className="font-medium text-gray-600">Nächster Schritt:</span>{' '}
                    {lead.next_step}
                  </p>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Neuer Lead</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Max Mustermann"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Firma</label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="Musterfirma GmbH"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as LeadStatus })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Branche</label>
                <select
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
                >
                  <option value="">— Branche wählen —</option>
                  {INDUSTRIES.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">E-Mail</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="max@firma.de"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Telefon</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+49 ..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Nächster Schritt</label>
                <input
                  type="text"
                  value={form.next_step}
                  onChange={(e) => setForm({ ...form, next_step: e.target.value })}
                  placeholder="z.B. Angebot senden, Demo call..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={createLead}
                disabled={!form.name.trim() || saving}
                className="flex-1 px-4 py-2 text-sm font-medium bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Speichern...' : 'Lead anlegen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
