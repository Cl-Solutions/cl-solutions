import { useEffect, useState } from 'react'
import { Plus, X, Trash2, ExternalLink, Edit2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { QuickLink } from '../types'

const KATEGORIEN = ['Tools & Software', 'Projekte', 'Kunden', 'Ressourcen']

const FARBEN = [
  '#06b6d4','#3ecf8e','#6366f1','#f59e0b','#ef4444',
  '#8b5cf6','#ec4899','#14b8a6','#f97316','#000000',
]

const INPUT  = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400'
const SELECT = INPUT
const BTN_P  = 'flex-1 px-4 py-2 text-sm font-medium bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50'
const BTN_S  = 'flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'

export default function QuickLinks() {
  const [links, setLinks]   = useState<QuickLink[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name:'', url:'', emoji:'🔗', kategorie:'Tools & Software', farbe:'#06b6d4' })

  useEffect(() => { loadData() }, [])
  useEffect(() => {
    const ch = supabase.channel('links-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quick_links' }, loadData)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function loadData() {
    const { data } = await supabase.from('quick_links').select('*').order('erstellt_am', { ascending: true })
    setLinks(data || [])
    setLoading(false)
  }

  async function save() {
    if (!form.name.trim() || !form.url.trim()) return
    const url = form.url.startsWith('http') ? form.url : `https://${form.url}`
    const payload = { ...form, url }
    if (editingId) {
      await supabase.from('quick_links').update(payload).eq('id', editingId)
      setEditingId(null)
    } else {
      await supabase.from('quick_links').insert(payload)
    }
    setForm({ name:'', url:'', emoji:'🔗', kategorie:'Tools & Software', farbe:'#06b6d4' })
    setShowModal(false)
  }

  function editLink(l: QuickLink) {
    setForm({ name: l.name, url: l.url, emoji: l.emoji, kategorie: l.kategorie, farbe: l.farbe })
    setEditingId(l.id)
    setShowModal(true)
  }

  async function deleteLink(id: string) {
    await supabase.from('quick_links').delete().eq('id', id)
  }

  const byKategorie = KATEGORIEN.map(kat => ({
    kat,
    items: links.filter(l => l.kategorie === kat),
  })).filter(g => g.items.length > 0)

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent" />
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Quick Links</h1>
          <p className="text-xs text-gray-400 mt-0.5">{links.length} Links gespeichert</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setForm({ name:'', url:'', emoji:'🔗', kategorie:'Tools & Software', farbe:'#06b6d4' }); setShowModal(true) }}
          className="flex items-center gap-1.5 bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-cyan-600 transition-colors"
        >
          <Plus size={15} /> Link hinzufügen
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8">
        {links.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔗</p>
            <p className="text-gray-400 text-sm">Noch keine Links gespeichert</p>
          </div>
        ) : (
          byKategorie.map(({ kat, items }) => (
            <div key={kat}>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{kat}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {items.map(link => (
                  <div key={link.id} className="group relative">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all text-center"
                    >
                      {/* Icon circle */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm"
                        style={{ backgroundColor: link.farbe + '15', border: `1px solid ${link.farbe}25` }}
                      >
                        <span className="text-xl">{link.emoji}</span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-700 leading-tight">{link.name}</p>
                        <p className="text-xs text-gray-300 mt-0.5 truncate max-w-[90px]">
                          {link.url.replace(/^https?:\/\//, '').split('/')[0]}
                        </p>
                      </div>
                      <ExternalLink size={10} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2" />
                    </a>
                    {/* Edit/Delete overlay */}
                    <div className="absolute top-1.5 left-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => { e.preventDefault(); editLink(link) }}
                        className="w-6 h-6 bg-white rounded-md shadow-sm flex items-center justify-center text-gray-400 hover:text-cyan-500 border border-gray-100"
                      >
                        <Edit2 size={10} />
                      </button>
                      <button
                        onClick={e => { e.preventDefault(); deleteLink(link.id) }}
                        className="w-6 h-6 bg-white rounded-md shadow-sm flex items-center justify-center text-gray-400 hover:text-red-400 border border-gray-100"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md mx-0 sm:mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Link bearbeiten' : 'Link hinzufügen'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-[3rem_1fr] gap-3 items-end">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Icon</label>
                  <input value={form.emoji} onChange={e=>setForm({...form,emoji:e.target.value})} maxLength={4} className={INPUT + ' text-center text-xl'} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Name *</label>
                  <input autoFocus value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="z.B. Supabase" className={INPUT} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">URL *</label>
                <input value={form.url} onChange={e=>setForm({...form,url:e.target.value})} placeholder="https://..." className={INPUT} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Kategorie</label>
                  <select value={form.kategorie} onChange={e=>setForm({...form,kategorie:e.target.value})} className={SELECT}>
                    {KATEGORIEN.map(k=><option key={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Farbe</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {FARBEN.map(c => (
                      <button
                        key={c}
                        onClick={() => setForm({...form,farbe:c})}
                        className={`w-6 h-6 rounded-full transition-transform ${form.farbe===c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className={BTN_S}>Abbrechen</button>
              <button onClick={save} disabled={!form.name.trim()||!form.url.trim()} className={BTN_P}>{editingId?'Speichern':'Hinzufügen'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
