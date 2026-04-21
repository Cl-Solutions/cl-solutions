import { useEffect, useState } from 'react'
import { Plus, X, Search, ExternalLink, Trash2, Play, ImageIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { WissensEintrag, WissenPlattform } from '../types'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

const KATEGORIEN = ['KI-Tools', 'Marketing', 'Sales', 'Design', 'Tech', 'Business', 'Allgemein']
const PLATTFORMEN: WissenPlattform[] = ['YouTube', 'Instagram', 'TikTok', 'Sonstiges']

const INPUT  = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400'
const SELECT = INPUT
const BTN_P  = 'flex-1 px-4 py-2 text-sm font-medium bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50'
const BTN_S  = 'flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
  return match ? match[1] : null
}

function detectPlatform(url: string): WissenPlattform {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube'
  if (url.includes('instagram.com')) return 'Instagram'
  if (url.includes('tiktok.com')) return 'TikTok'
  return 'Sonstiges'
}

function getThumbnail(url: string, platform: WissenPlattform, manual?: string | null): string | null {
  if (manual) return manual
  if (platform === 'YouTube') {
    const id = extractYouTubeId(url)
    return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null
  }
  return null
}

const PLATFORM_COLORS: Record<WissenPlattform, string> = {
  YouTube: 'bg-red-100 text-red-600',
  Instagram: 'bg-pink-100 text-pink-600',
  TikTok: 'bg-gray-900 text-white',
  Sonstiges: 'bg-gray-100 text-gray-600',
}

export default function Wissensbibliothek() {
  const [eintraege, setEintraege] = useState<WissensEintrag[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterKat, setFilterKat] = useState('alle')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving]       = useState(false)

  const [form, setForm] = useState({
    url: '', titel: '', beschreibung: '',
    kategorie: 'Allgemein', plattform: 'Sonstiges' as WissenPlattform,
    thumbnail_url: '',
  })

  useEffect(() => { loadData() }, [])
  useEffect(() => {
    const ch = supabase.channel('wissen-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wissensbibliothek' }, loadData)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function loadData() {
    const { data } = await supabase.from('wissensbibliothek').select('*').order('erstellt_am', { ascending: false })
    setEintraege(data || [])
    setLoading(false)
  }

  function handleUrlChange(url: string) {
    const platform = detectPlatform(url)
    setForm(f => ({ ...f, url, plattform: platform }))
  }

  async function save() {
    if (!form.url.trim() || !form.titel.trim()) return
    setSaving(true)
    const thumbnail = getThumbnail(form.url, form.plattform, form.thumbnail_url || null)
    await supabase.from('wissensbibliothek').insert({
      url: form.url.trim(),
      titel: form.titel.trim(),
      beschreibung: form.beschreibung || null,
      kategorie: form.kategorie,
      plattform: form.plattform,
      thumbnail_url: thumbnail,
    })
    setForm({ url:'', titel:'', beschreibung:'', kategorie:'Allgemein', plattform:'Sonstiges', thumbnail_url:'' })
    setSaving(false)
    setShowModal(false)
  }

  async function deleteEntry(id: string) {
    await supabase.from('wissensbibliothek').delete().eq('id', id)
  }

  const filtered = eintraege.filter(e => {
    const q = search.toLowerCase()
    const matchSearch = e.titel.toLowerCase().includes(q) || (e.beschreibung||'').toLowerCase().includes(q)
    const matchKat = filterKat === 'alle' || e.kategorie === filterKat
    return matchSearch && matchKat
  })

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
          <h1 className="text-xl font-semibold text-gray-900">Wissensbibliothek</h1>
          <p className="text-xs text-gray-400 mt-0.5">{eintraege.length} gespeicherte Ressourcen</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-cyan-600 transition-colors"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Ressource speichern</span>
          <span className="sm:hidden">Neu</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 flex flex-col gap-2 shrink-0">
        <div className="relative w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Suchen..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {['alle', ...KATEGORIEN].map(k => (
            <button
              key={k}
              onClick={() => setFilterKat(k)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterKat === k ? 'bg-cyan-500 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {k === 'alle' ? 'Alle' : k}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📚</p>
            <p className="text-gray-400 text-sm">Noch keine Ressourcen gespeichert</p>
            <button onClick={() => setShowModal(true)} className="mt-3 text-xs text-cyan-500 underline">Erste Ressource hinzufügen</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filtered.map(e => {
              const thumb = getThumbnail(e.url, e.plattform, e.thumbnail_url)
              return (
                <div key={e.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-cyan-200 hover:shadow-sm transition-all group">
                  {/* Thumbnail */}
                  <a href={e.url} target="_blank" rel="noopener noreferrer" className="block relative">
                    {thumb ? (
                      <img src={thumb} alt={e.titel} className="w-full h-40 object-cover bg-gray-100" onError={ev => { (ev.target as HTMLImageElement).style.display='none' }} />
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                        {e.plattform === 'YouTube' && <Play size={32} className="text-red-400" />}
                        {e.plattform === 'Instagram' && <ImageIcon size={32} className="text-pink-400" />}
                        {(e.plattform === 'TikTok' || e.plattform === 'Sonstiges') && <ExternalLink size={28} className="text-gray-300" />}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <ExternalLink size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </a>

                  {/* Content */}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">{e.titel}</h3>
                      <button onClick={() => deleteEntry(e.id)} className="shrink-0 text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    {e.beschreibung && <p className="text-xs text-gray-500 line-clamp-2 mb-2">{e.beschreibung}</p>}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLATFORM_COLORS[e.plattform]}`}>{e.plattform}</span>
                      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{e.kategorie}</span>
                      <span className="text-xs text-gray-300 ml-auto">{format(parseISO(e.erstellt_am), 'd. MMM', { locale: de })}</span>
                    </div>
                  </div>
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
              <h2 className="text-lg font-semibold text-gray-900">Ressource speichern</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">URL *</label>
                <input
                  autoFocus
                  value={form.url}
                  onChange={e => handleUrlChange(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className={INPUT}
                />
                {form.plattform !== 'Sonstiges' && (
                  <p className="text-xs text-cyan-500 mt-1">✓ {form.plattform} erkannt</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Titel *</label>
                <input value={form.titel} onChange={e => setForm({...form,titel:e.target.value})} placeholder="Titel des Videos/Links" className={INPUT} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Beschreibung / Notiz</label>
                <textarea value={form.beschreibung} onChange={e => setForm({...form,beschreibung:e.target.value})} rows={2} placeholder="Worum geht es? Was ist der Key Takeaway?" className={INPUT + ' resize-none'} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Kategorie</label>
                  <select value={form.kategorie} onChange={e => setForm({...form,kategorie:e.target.value})} className={SELECT}>
                    {KATEGORIEN.map(k => <option key={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Plattform</label>
                  <select value={form.plattform} onChange={e => setForm({...form,plattform:e.target.value as WissenPlattform})} className={SELECT}>
                    {PLATTFORMEN.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className={BTN_S}>Abbrechen</button>
              <button onClick={save} disabled={!form.url.trim() || !form.titel.trim() || saving} className={BTN_P}>
                {saving ? 'Speichern...' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
