import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Edit2, Check, X, Plus, Trash2, Calendar,
  Package, CheckSquare, Square, StickyNote, Mail, Phone,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Lead, LeadNote, LeadProduct, LeadItem, LeadStatus } from '../types'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

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

const ALL_STATUSES: LeadStatus[] = [
  'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost',
]

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [lead, setLead] = useState<Lead | null>(null)
  const [notes, setNotes] = useState<LeadNote[]>([])
  const [products, setProducts] = useState<LeadProduct[]>([])
  const [items, setItems] = useState<LeadItem[]>([])
  const [loading, setLoading] = useState(true)

  // Edit lead fields
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // New note
  const [newNote, setNewNote] = useState('')
  const [noteDate, setNoteDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [savingNote, setSavingNote] = useState(false)

  // New product
  const [showProductForm, setShowProductForm] = useState(false)
  const [productName, setProductName] = useState('')
  const [productSpecs, setProductSpecs] = useState('')

  // New item
  const [newItem, setNewItem] = useState('')

  const noteRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!id) return
    loadAll()
    const channels = [
      supabase.channel('lead-detail-lead').on('postgres_changes', { event: '*', schema: 'public', table: 'leads', filter: `id=eq.${id}` }, loadAll).subscribe(),
      supabase.channel('lead-detail-notes').on('postgres_changes', { event: '*', schema: 'public', table: 'lead_notes', filter: `lead_id=eq.${id}` }, loadAll).subscribe(),
      supabase.channel('lead-detail-products').on('postgres_changes', { event: '*', schema: 'public', table: 'lead_products', filter: `lead_id=eq.${id}` }, loadAll).subscribe(),
      supabase.channel('lead-detail-items').on('postgres_changes', { event: '*', schema: 'public', table: 'lead_items', filter: `lead_id=eq.${id}` }, loadAll).subscribe(),
    ]
    return () => { channels.forEach(c => supabase.removeChannel(c)) }
  }, [id])

  async function loadAll() {
    if (!id) return
    const [
      { data: leadData },
      { data: notesData },
      { data: productsData },
      { data: itemsData },
    ] = await Promise.all([
      supabase.from('leads').select('*').eq('id', id).single(),
      supabase.from('lead_notes').select('*').eq('lead_id', id).order('note_date', { ascending: false }),
      supabase.from('lead_products').select('*').eq('lead_id', id).order('created_at', { ascending: true }),
      supabase.from('lead_items').select('*').eq('lead_id', id).order('created_at', { ascending: true }),
    ])
    setLead(leadData)
    setNotes(notesData || [])
    setProducts(productsData || [])
    setItems(itemsData || [])
    setLoading(false)
  }

  async function updateLead(field: string, value: string) {
    if (!id) return
    await supabase.from('leads').update({ [field]: value || null, updated_at: new Date().toISOString() }).eq('id', id)
    setEditingField(null)
    loadAll()
  }

  async function addNote() {
    if (!newNote.trim() || !id) return
    setSavingNote(true)
    await supabase.from('lead_notes').insert({ lead_id: id, content: newNote.trim(), note_date: noteDate })
    setNewNote('')
    setNoteDate(format(new Date(), 'yyyy-MM-dd'))
    setSavingNote(false)
  }

  async function deleteNote(noteId: string) {
    await supabase.from('lead_notes').delete().eq('id', noteId)
  }

  async function addProduct() {
    if (!productName.trim() || !id) return
    await supabase.from('lead_products').insert({
      lead_id: id,
      name: productName.trim(),
      specifications: productSpecs.trim() || null,
    })
    setProductName('')
    setProductSpecs('')
    setShowProductForm(false)
  }

  async function deleteProduct(productId: string) {
    await supabase.from('lead_products').delete().eq('id', productId)
  }

  async function addItem() {
    if (!newItem.trim() || !id) return
    await supabase.from('lead_items').insert({ lead_id: id, title: newItem.trim(), completed: false })
    setNewItem('')
  }

  async function toggleItem(item: LeadItem) {
    await supabase.from('lead_items').update({ completed: !item.completed }).eq('id', item.id)
  }

  async function deleteItem(itemId: string) {
    await supabase.from('lead_items').delete().eq('id', itemId)
  }

  async function deleteLead() {
    if (!id || !confirm('Lead wirklich löschen?')) return
    await supabase.from('leads').delete().eq('id', id)
    navigate('/leads')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent" />
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400">Lead nicht gefunden.</p>
        <Link to="/leads" className="text-cyan-600 text-sm mt-2 inline-block">Zurück</Link>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          <Link to="/leads" className="mt-1 text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            {editingField === 'name' ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') updateLead('name', editValue); if (e.key === 'Escape') setEditingField(null) }}
                  className="text-2xl font-semibold border-b-2 border-cyan-400 bg-transparent outline-none text-gray-900"
                />
                <button onClick={() => updateLead('name', editValue)} className="text-green-500 hover:text-green-600"><Check size={18} /></button>
                <button onClick={() => setEditingField(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-gray-900">{lead.name}</h1>
                <button onClick={() => { setEditingField('name'); setEditValue(lead.name) }} className="text-gray-300 hover:text-gray-500 transition-colors">
                  <Edit2 size={14} />
                </button>
              </div>
            )}
            {lead.company && (
              <p className="text-sm text-gray-500 mt-0.5 ml-0">{lead.company}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={lead.status}
            onChange={(e) => updateLead('status', e.target.value)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium border-0 cursor-pointer focus:ring-2 focus:ring-cyan-500/20 focus:outline-none ${STATUS_COLORS[lead.status]}`}
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <button onClick={deleteLead} className="text-gray-300 hover:text-red-400 transition-colors p-1">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column: Info + Notes */}
        <div className="col-span-2 space-y-6">

          {/* Contact Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Kontaktinfos</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { field: 'industry', label: 'Branche', value: lead.industry },
                { field: 'next_step', label: 'Nächster Schritt', value: lead.next_step },
                { field: 'email', label: 'E-Mail', value: lead.email },
                { field: 'phone', label: 'Telefon', value: lead.phone },
              ].map(({ field, label, value }) => (
                <div key={field}>
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  {editingField === field ? (
                    <div className="flex items-center gap-1">
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') updateLead(field, editValue); if (e.key === 'Escape') setEditingField(null) }}
                        className="text-sm border-b border-cyan-400 bg-transparent outline-none text-gray-800 w-full"
                      />
                      <button onClick={() => updateLead(field, editValue)} className="text-green-500"><Check size={14} /></button>
                      <button onClick={() => setEditingField(null)} className="text-gray-400"><X size={14} /></button>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-1 group cursor-pointer"
                      onClick={() => { setEditingField(field); setEditValue(value || '') }}
                    >
                      <span className="text-sm text-gray-700">{value || <span className="text-gray-300 italic">—</span>}</span>
                      <Edit2 size={11} className="text-gray-200 group-hover:text-gray-400 transition-colors" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <StickyNote size={15} className="text-cyan-500" />
              <h2 className="text-sm font-semibold text-gray-700">Gesprächsnotizen</h2>
            </div>

            {/* Add Note */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={13} className="text-gray-400" />
                <input
                  type="date"
                  value={noteDate}
                  onChange={(e) => setNoteDate(e.target.value)}
                  className="text-xs text-gray-600 bg-transparent border-0 outline-none cursor-pointer"
                />
              </div>
              <textarea
                ref={noteRef}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Notiz hinzufügen..."
                rows={3}
                className="w-full text-sm text-gray-700 bg-transparent border-0 outline-none resize-none placeholder:text-gray-300"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={addNote}
                  disabled={!newNote.trim() || savingNote}
                  className="text-xs px-3 py-1.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-40"
                >
                  Notiz speichern
                </button>
              </div>
            </div>

            {/* Notes List */}
            {notes.length === 0 ? (
              <p className="text-sm text-gray-300 text-center py-4">Noch keine Notizen</p>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="group flex gap-3">
                    <div className="shrink-0 text-xs text-gray-400 mt-0.5 w-20">
                      {format(parseISO(note.note_date), 'd. MMM', { locale: de })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                    </div>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="shrink-0 text-gray-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Products + Open Items */}
        <div className="space-y-6">

          {/* Products / Solutions */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package size={15} className="text-cyan-500" />
                <h2 className="text-sm font-semibold text-gray-700">Produkte & Lösungen</h2>
              </div>
              <button
                onClick={() => setShowProductForm(!showProductForm)}
                className="text-gray-300 hover:text-cyan-500 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>

            {showProductForm && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <input
                  autoFocus
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Produkt / Lösung"
                  className="w-full text-sm border-b border-gray-200 bg-transparent outline-none pb-1 mb-2"
                />
                <textarea
                  value={productSpecs}
                  onChange={(e) => setProductSpecs(e.target.value)}
                  placeholder="Spezifikationen (optional)"
                  rows={2}
                  className="w-full text-xs text-gray-600 bg-transparent border-0 outline-none resize-none placeholder:text-gray-300"
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={addProduct} disabled={!productName.trim()} className="text-xs px-2 py-1 bg-cyan-500 text-white rounded hover:bg-cyan-600 disabled:opacity-40">Hinzufügen</button>
                  <button onClick={() => { setShowProductForm(false); setProductName(''); setProductSpecs('') }} className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700">Abbrechen</button>
                </div>
              </div>
            )}

            {products.length === 0 ? (
              <p className="text-xs text-gray-300 text-center py-3">Noch keine Produkte</p>
            ) : (
              <div className="space-y-2">
                {products.map((p) => (
                  <div key={p.id} className="group flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700">{p.name}</p>
                      {p.specifications && (
                        <p className="text-xs text-gray-400 mt-0.5">{p.specifications}</p>
                      )}
                    </div>
                    <button onClick={() => deleteProduct(p.id)} className="shrink-0 text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all mt-0.5">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Open Items / Checkboxes */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckSquare size={15} className="text-cyan-500" />
              <h2 className="text-sm font-semibold text-gray-700">Offene Punkte</h2>
            </div>

            <div className="space-y-1.5 mb-3">
              {items.map((item) => (
                <div key={item.id} className="group flex items-center gap-2">
                  <button
                    onClick={() => toggleItem(item)}
                    className={`shrink-0 transition-colors ${item.completed ? 'text-green-500' : 'text-gray-300 hover:text-cyan-400'}`}
                  >
                    {item.completed ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                  <span className={`flex-1 text-sm ${item.completed ? 'line-through text-gray-300' : 'text-gray-700'}`}>
                    {item.title}
                  </span>
                  <button onClick={() => deleteItem(item.id)} className="shrink-0 text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addItem() }}
                placeholder="+ Neuer Punkt"
                className="flex-1 text-sm text-gray-700 bg-transparent border-b border-gray-100 outline-none pb-1 placeholder:text-gray-300 focus:border-cyan-300 transition-colors"
              />
              <button onClick={addItem} disabled={!newItem.trim()} className="text-cyan-500 hover:text-cyan-600 disabled:opacity-30">
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Contact Quick Links */}
          {(lead.email || lead.phone) && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Kontakt</h2>
              <div className="space-y-2">
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-cyan-600 transition-colors">
                    <Mail size={14} className="text-gray-400" />
                    {lead.email}
                  </a>
                )}
                {lead.phone && (
                  <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-cyan-600 transition-colors">
                    <Phone size={14} className="text-gray-400" />
                    {lead.phone}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
