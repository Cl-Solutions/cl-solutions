import { useEffect, useState } from 'react'
import { Plus, X, Trash2, Flame, Zap, Waves } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Idee, IdeenStatus, IdeenKategorie, TaskPriority } from '../types'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

const KATEGORIEN: IdeenKategorie[] = ['Produkt', 'Marketing', 'Intern', 'Kunde']
const STATUSES: { key: IdeenStatus; label: string; color: string; bg: string }[] = [
  { key: 'idee',       label: '💡 Idee',       color: 'text-blue-600',  bg: 'bg-blue-50 border-blue-100' },
  { key: 'in_pruefung',label: '🔍 In Prüfung', color: 'text-orange-600',bg: 'bg-orange-50 border-orange-100' },
  { key: 'umgesetzt',  label: '✅ Umgesetzt',  color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
  { key: 'verworfen',  label: '❌ Verworfen',  color: 'text-gray-400',  bg: 'bg-gray-50 border-gray-200' },
]
const PRIO_CONFIG: Record<TaskPriority, { label: string; icon: React.ReactNode; color: string }> = {
  hoch:    { label: 'Hoch',    icon: <Flame  size={11} />, color: 'text-red-500 bg-red-50' },
  mittel:  { label: 'Mittel',  icon: <Zap    size={11} />, color: 'text-orange-500 bg-orange-50' },
  niedrig: { label: 'Niedrig', icon: <Waves  size={11} />, color: 'text-blue-400 bg-blue-50' },
}

const INPUT  = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400'
const SELECT = INPUT
const BTN_P  = 'flex-1 px-4 py-2 text-sm font-medium bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50'
const BTN_S  = 'flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'

export default function Ideen() {
  const [ideen, setIdeen]         = useState<Idee[]>([])
  const [loading, setLoading]     = useState(true)
  const [filterStatus, setFilterStatus] = useState<IdeenStatus | 'alle'>('alle')
  const [filterKat, setFilterKat] = useState<IdeenKategorie | 'alle'>('alle')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving]       = useState(false)

  const [form, setForm] = useState({
    titel: '', beschreibung: '', kategorie: 'Produkt' as IdeenKategorie,
    status: 'idee' as IdeenStatus, prioritaet: 'mittel' as TaskPriority,
  })

  useEffect(() => { loadData() }, [])
  useEffect(() => {
    const ch = supabase.channel('ideen-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ideen' }, loadData)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function loadData() {
    const { data } = await supabase.from('ideen').select('*').order('erstellt_am', { ascending: false })
    setIdeen(data || [])
    setLoading(false)
  }

  async function save() {
    if (!form.titel.trim()) return
    setSaving(true)
    await supabase.from('ideen').insert({
      titel: form.titel.trim(),
      beschreibung: form.beschreibung || null,
      kategorie: form.kategorie,
      status: form.status,
      prioritaet: form.prioritaet,
    })
    setForm({ titel:'', beschreibung:'', kategorie:'Produkt', status:'idee', prioritaet:'mittel' })
    setSaving(false)
    setShowModal(false)
  }

  async function updateStatus(id: string, status: IdeenStatus) {
    await supabase.from('ideen').update({ status }).eq('id', id)
  }

  async function deleteIdee(id: string) {
    await supabase.from('ideen').delete().eq('id', id)
  }

  const filtered = ideen.filter(i => {
    const okStatus = filterStatus === 'alle' || i.status === filterStatus
    const okKat    = filterKat === 'alle' || i.kategorie === filterKat
    return okStatus && okKat
  })

  const countByStatus = (s: IdeenStatus) => ideen.filter(i => i.status === s).length

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
          <h1 className="text-xl font-semibold text-gray-900">Ideen</h1>
          <p className="text-xs text-gray-400 mt-0.5">{ideen.filter(i=>i.status==='idee'||i.status==='in_pruefung').length} offene Ideen</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-cyan-600 transition-colors"
        >
          <Plus size={15} /> Idee hinzufügen
        </button>
      </div>

      {/* Status summary + filters */}
      <div className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 shrink-0">
        {/* Status pills */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <button
            onClick={() => setFilterStatus('alle')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus==='alle' ? 'bg-cyan-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            Alle ({ideen.length})
          </button>
          {STATUSES.map(s => (
            <button
              key={s.key}
              onClick={() => setFilterStatus(s.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus===s.key ? 'bg-cyan-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              {s.label} ({countByStatus(s.key)})
            </button>
          ))}
        </div>
        {/* Category filter */}
        <div className="flex flex-wrap gap-1.5">
          {(['alle', ...KATEGORIEN] as (IdeenKategorie|'alle')[]).map(k => (
            <button
              key={k}
              onClick={() => setFilterKat(k)}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors ${filterKat===k ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-100'}`}
            >
              {k === 'alle' ? 'Alle Kategorien' : k}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">💡</p>
            <p className="text-gray-400 text-sm">Noch keine Ideen — lass sie sprudeln!</p>
            <button onClick={() => setShowModal(true)} className="mt-3 text-xs text-cyan-500 underline">Erste Idee hinzufügen</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(idee => {
              const statusConf = STATUSES.find(s => s.key === idee.status)!
              const prioConf   = PRIO_CONFIG[idee.prioritaet]
              return (
                <div key={idee.id} className={`bg-white rounded-xl border p-4 hover:shadow-sm transition-all group ${statusConf.bg}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConf.bg} ${statusConf.color} border`}>
                        {statusConf.label}
                      </span>
                      <span className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${prioConf.color}`}>
                        {prioConf.icon} {prioConf.label}
                      </span>
                    </div>
                    <button onClick={() => deleteIdee(idee.id)} className="text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <h3 className={`text-sm font-semibold mb-1 ${idee.status==='verworfen' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {idee.titel}
                  </h3>
                  {idee.beschreibung && (
                    <p className="text-xs text-gray-500 mb-3 leading-relaxed">{idee.beschreibung}</p>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/50">
                    <span className="text-xs text-gray-400 bg-white/60 px-2 py-0.5 rounded-full">{idee.kategorie}</span>
                    <div className="flex items-center gap-1">
                      {/* Quick status change */}
                      {idee.status !== 'umgesetzt' && (
                        <button
                          onClick={() => updateStatus(idee.id, idee.status === 'idee' ? 'in_pruefung' : idee.status === 'in_pruefung' ? 'umgesetzt' : 'idee')}
                          className="text-xs text-gray-400 hover:text-cyan-600 transition-colors px-2 py-0.5 rounded hover:bg-white/80"
                        >
                          {idee.status === 'idee' ? '→ Prüfen' : idee.status === 'in_pruefung' ? '→ Umsetzen' : '→ Idee'}
                        </button>
                      )}
                      {idee.status !== 'verworfen' && (
                        <button
                          onClick={() => updateStatus(idee.id, 'verworfen')}
                          className="text-xs text-gray-300 hover:text-red-400 transition-colors px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 mt-2">{format(parseISO(idee.erstellt_am), 'd. MMM yyyy', { locale: de })}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md mx-0 sm:mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Neue Idee</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Titel *</label>
                <input
                  autoFocus
                  value={form.titel}
                  onChange={e => setForm({...form,titel:e.target.value})}
                  onKeyDown={e => { if (e.key === 'Enter') save() }}
                  placeholder="Was ist die Idee?"
                  className={INPUT}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Beschreibung</label>
                <textarea value={form.beschreibung} onChange={e=>setForm({...form,beschreibung:e.target.value})} rows={3} placeholder="Details, Kontext, warum das wichtig wäre..." className={INPUT + ' resize-none'} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Kategorie</label>
                  <select value={form.kategorie} onChange={e=>setForm({...form,kategorie:e.target.value as IdeenKategorie})} className={SELECT}>
                    {KATEGORIEN.map(k=><option key={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Status</label>
                  <select value={form.status} onChange={e=>setForm({...form,status:e.target.value as IdeenStatus})} className={SELECT}>
                    <option value="idee">Idee</option>
                    <option value="in_pruefung">In Prüfung</option>
                    <option value="umgesetzt">Umgesetzt</option>
                    <option value="verworfen">Verworfen</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Priorität</label>
                  <select value={form.prioritaet} onChange={e=>setForm({...form,prioritaet:e.target.value as TaskPriority})} className={SELECT}>
                    <option value="hoch">🔥 Hoch</option>
                    <option value="mittel">⚡ Mittel</option>
                    <option value="niedrig">🌊 Niedrig</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className={BTN_S}>Abbrechen</button>
              <button onClick={save} disabled={!form.titel.trim() || saving} className={BTN_P}>
                {saving ? 'Speichern...' : 'Idee speichern'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
