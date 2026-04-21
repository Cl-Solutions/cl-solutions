import { useEffect, useState } from 'react'
import { Plus, X, Trash2, TrendingUp, TrendingDown, CreditCard, BarChart2, Edit2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Abo, AboIntervall, AboStatus, Transaktion, TransaktionTyp } from '../types'
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

type Tab = 'abos' | 'transaktionen' | 'uebersicht'

const ABO_KATEGORIEN = ['Software', 'KI', 'Tool', 'Hosting', 'Admin', 'Zahlung', 'Marketing', 'Sonstiges']
const TX_KATEGORIEN  = ['Einnahme', 'Software', 'Marketing', 'Dienstleistung', 'Gehalt', 'Sonstiges']

// ── Helpers ─────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })
}
function monatlich(abo: Abo) {
  if (abo.status === 'gekuendigt') return 0
  return abo.intervall === 'jaehrlich' ? abo.betrag / 12 : abo.betrag
}

// ── Shared UI ───────────────────────────────────────────────
const INPUT  = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400'
const SELECT = INPUT
const BTN_P  = 'flex-1 px-4 py-2 text-sm font-medium bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50'
const BTN_S  = 'flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>{children}</div>
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md mx-0 sm:mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
export default function Finanzen() {
  const [tab, setTab]               = useState<Tab>('abos')
  const [abos, setAbos]             = useState<Abo[]>([])
  const [txs, setTxs]               = useState<Transaktion[]>([])
  const [loading, setLoading]       = useState(true)
  const [showAboModal, setShowAboModal]   = useState(false)
  const [showTxModal, setShowTxModal]     = useState(false)
  const [editingAboId, setEditingAboId]   = useState<string | null>(null)

  const [aboForm, setAboForm] = useState({ name:'', kategorie:'Software', betrag:'', intervall:'monatlich' as AboIntervall, faellig_tag:'', status:'aktiv' as AboStatus, notiz:'' })
  const [txForm, setTxForm]   = useState({ datum: format(new Date(),'yyyy-MM-dd'), beschreibung:'', typ:'ausgabe' as TransaktionTyp, betrag:'', kategorie:'', notiz:'' })

  useEffect(() => { loadAll() }, [])
  useEffect(() => {
    const c1 = supabase.channel('abos-rt').on('postgres_changes',{event:'*',schema:'public',table:'abos'},loadAll).subscribe()
    const c2 = supabase.channel('tx-rt').on('postgres_changes',{event:'*',schema:'public',table:'transaktionen'},loadAll).subscribe()
    return () => { supabase.removeChannel(c1); supabase.removeChannel(c2) }
  }, [])

  async function loadAll() {
    const [{ data: a }, { data: t }] = await Promise.all([
      supabase.from('abos').select('*').order('name'),
      supabase.from('transaktionen').select('*').order('datum', { ascending: false }),
    ])
    setAbos(a || []); setTxs(t || [])
    setLoading(false)
  }

  async function saveAbo() {
    const payload = {
      name: aboForm.name.trim(),
      kategorie: aboForm.kategorie,
      betrag: parseFloat(aboForm.betrag) || 0,
      intervall: aboForm.intervall,
      faellig_tag: parseInt(aboForm.faellig_tag) || null,
      status: aboForm.status,
      notiz: aboForm.notiz || null,
    }
    if (editingAboId) {
      await supabase.from('abos').update(payload).eq('id', editingAboId)
      setEditingAboId(null)
    } else {
      await supabase.from('abos').insert(payload)
    }
    setAboForm({ name:'', kategorie:'Software', betrag:'', intervall:'monatlich', faellig_tag:'', status:'aktiv', notiz:'' })
    setShowAboModal(false)
  }

  function editAbo(a: Abo) {
    setAboForm({
      name: a.name, kategorie: a.kategorie, betrag: String(a.betrag),
      intervall: a.intervall, faellig_tag: a.faellig_tag ? String(a.faellig_tag) : '',
      status: a.status, notiz: a.notiz || '',
    })
    setEditingAboId(a.id)
    setShowAboModal(true)
  }

  async function deleteAbo(id: string) {
    if (!confirm('Abo wirklich löschen?')) return
    await supabase.from('abos').delete().eq('id', id)
  }

  async function saveTx() {
    await supabase.from('transaktionen').insert({
      datum: txForm.datum,
      beschreibung: txForm.beschreibung.trim(),
      typ: txForm.typ,
      betrag: parseFloat(txForm.betrag) || 0,
      kategorie: txForm.kategorie || null,
      notiz: txForm.notiz || null,
    })
    setTxForm({ datum: format(new Date(),'yyyy-MM-dd'), beschreibung:'', typ:'ausgabe', betrag:'', kategorie:'', notiz:'' })
    setShowTxModal(false)
  }

  async function deleteTx(id: string) {
    await supabase.from('transaktionen').delete().eq('id', id)
  }

  // ── Berechnungen ──────────────────────────────────────────
  const monatlicheKosten = abos.reduce((s, a) => s + monatlich(a), 0)
  const jaehrlicheKosten = abos.filter(a => a.status !== 'gekuendigt').reduce((s, a) =>
    s + (a.intervall === 'jaehrlich' ? a.betrag : a.betrag * 12), 0)

  const einnahmen = txs.filter(t => t.typ === 'einnahme').reduce((s, t) => s + Number(t.betrag), 0)
  const ausgaben  = txs.filter(t => t.typ === 'ausgabe').reduce((s, t) => s + Number(t.betrag), 0)
  const saldo = einnahmen - ausgaben

  // Monthly chart data (last 6 months)
  const chartData = Array.from({ length: 6 }).map((_, i) => {
    const month = subMonths(new Date(), 5 - i)
    const start = format(startOfMonth(month), 'yyyy-MM-dd')
    const end   = format(endOfMonth(month), 'yyyy-MM-dd')
    const ein = txs.filter(t => t.typ === 'einnahme' && t.datum >= start && t.datum <= end).reduce((s,t) => s + Number(t.betrag), 0)
    const aus = txs.filter(t => t.typ === 'ausgabe'  && t.datum >= start && t.datum <= end).reduce((s,t) => s + Number(t.betrag), 0)
    return { name: format(month, 'MMM', { locale: de }), Einnahmen: ein, Ausgaben: aus }
  })

  // Top costs
  const topAbos = [...abos].filter(a => a.status !== 'gekuendigt').sort((a,b) => monatlich(b) - monatlich(a)).slice(0,5)

  const STATUS_BADGE: Record<AboStatus, string> = {
    aktiv:    'bg-green-100 text-green-700',
    pausiert: 'bg-yellow-100 text-yellow-700',
    gekuendigt: 'bg-gray-100 text-gray-400 line-through',
  }
  const STATUS_LABEL: Record<AboStatus, string> = { aktiv:'Aktiv', pausiert:'Pausiert', gekuendigt:'Gekündigt' }

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
          <h1 className="text-xl font-semibold text-gray-900">Finanzen</h1>
          <p className="text-xs text-gray-400 mt-0.5">Burn Rate: {fmt(monatlicheKosten)}/Monat</p>
        </div>
        {tab === 'abos' && (
          <button onClick={() => { setEditingAboId(null); setShowAboModal(true) }}
            className="flex items-center gap-1.5 bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-cyan-600 transition-colors">
            <Plus size={15} /> <span className="hidden sm:inline">Abo hinzufügen</span><span className="sm:hidden">Neu</span>
          </button>
        )}
        {tab === 'transaktionen' && (
          <button onClick={() => setShowTxModal(true)}
            className="flex items-center gap-1.5 bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-cyan-600 transition-colors">
            <Plus size={15} /> <span className="hidden sm:inline">Transaktion</span><span className="sm:hidden">Neu</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-4 md:px-6 flex gap-1 shrink-0">
        {([['abos','📋 Abos & Kosten'],['transaktionen','💸 Einnahmen & Ausgaben'],['uebersicht','📊 Übersicht']] as [Tab,string][]).map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab===t ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">

        {/* ── TAB: Abos ─────────────────────────────────────── */}
        {tab === 'abos' && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400 mb-1">Monatliche Fixkosten</p>
                <p className="text-2xl font-semibold text-gray-900">{fmt(monatlicheKosten)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{abos.filter(a=>a.status==='aktiv').length} aktive Abos</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400 mb-1">Jährliche Kosten</p>
                <p className="text-2xl font-semibold text-gray-900">{fmt(jaehrlicheKosten)}</p>
                <p className="text-xs text-gray-400 mt-0.5">hochgerechnet</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400 mb-1">Aktive Abos</p>
                <p className="text-2xl font-semibold text-gray-900">{abos.filter(a=>a.status==='aktiv').length}</p>
                <p className="text-xs text-gray-400 mt-0.5">{abos.filter(a=>a.status==='gekuendigt').length} gekündigt</p>
              </div>
              <div className="bg-cyan-50 rounded-xl border border-cyan-100 p-4">
                <p className="text-xs text-cyan-600 mb-1">Burn Rate / Tag</p>
                <p className="text-2xl font-semibold text-cyan-700">{fmt(monatlicheKosten / 30)}</p>
                <p className="text-xs text-cyan-500 mt-0.5">Fixkosten täglich</p>
              </div>
            </div>

            {/* Abo table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-400 gap-4">
                <span>Name</span><span>Kategorie</span><span>Betrag</span><span>Intervall</span><span>Status</span><span></span>
              </div>
              {abos.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Keine Abos eingetragen</p>
              ) : (
                abos.map(a => (
                  <div key={a.id} className="group px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    {/* Mobile layout */}
                    <div className="md:hidden flex items-start justify-between">
                      <div>
                        <p className={`text-sm font-medium text-gray-800 ${a.status==='gekuendigt'?'line-through text-gray-400':''}`}>{a.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">{a.kategorie}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_BADGE[a.status]}`}>{STATUS_LABEL[a.status]}</span>
                        </div>
                        {a.notiz && <p className="text-xs text-gray-400 mt-0.5">{a.notiz}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{fmt(a.betrag)}</p>
                        <p className="text-xs text-gray-400">{a.intervall}</p>
                        <div className="flex gap-1 mt-1 justify-end">
                          <button onClick={() => editAbo(a)} className="text-gray-300 hover:text-cyan-500 transition-colors"><Edit2 size={13} /></button>
                          <button onClick={() => deleteAbo(a.id)} className="text-gray-300 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    </div>
                    {/* Desktop layout */}
                    <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-center gap-4">
                      <div>
                        <p className={`text-sm font-medium text-gray-800 ${a.status==='gekuendigt'?'line-through text-gray-400':''}`}>{a.name}</p>
                        {a.notiz && <p className="text-xs text-gray-400">{a.notiz}</p>}
                      </div>
                      <span className="text-xs text-gray-500">{a.kategorie}</span>
                      <span className="text-sm font-medium text-gray-900">{fmt(a.betrag)}</span>
                      <span className="text-xs text-gray-500 capitalize">{a.intervall}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${STATUS_BADGE[a.status]}`}>{STATUS_LABEL[a.status]}</span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => editAbo(a)} className="text-gray-300 hover:text-cyan-500 transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => deleteAbo(a.id)} className="text-gray-300 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ── TAB: Transaktionen ────────────────────────────── */}
        {tab === 'transaktionen' && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${saldo >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    {saldo >= 0 ? <TrendingUp size={13} className="text-green-500" /> : <TrendingDown size={13} className="text-red-500" />}
                  </div>
                  <p className="text-xs text-gray-400">Saldo</p>
                </div>
                <p className={`text-xl font-semibold ${saldo >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(saldo)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400 mb-1">Einnahmen</p>
                <p className="text-xl font-semibold text-green-600">{fmt(einnahmen)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400 mb-1">Ausgaben</p>
                <p className="text-xl font-semibold text-red-500">{fmt(ausgaben)}</p>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Letzte 6 Monate</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}€`} width={40} />
                  <Tooltip formatter={(v) => fmt(Number(v))} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="Einnahmen" fill="#22d3ee" radius={[4,4,0,0]} />
                  <Bar dataKey="Ausgaben"  fill="#fca5a5" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Transaction list */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {txs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Noch keine Transaktionen</p>
              ) : (
                txs.map(t => (
                  <div key={t.id} className="group flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.typ==='einnahme' ? 'bg-green-50' : 'bg-red-50'}`}>
                      {t.typ==='einnahme' ? <TrendingUp size={14} className="text-green-500" /> : <TrendingDown size={14} className="text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{t.beschreibung}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{format(parseISO(t.datum),'d. MMM yyyy',{locale:de})}</span>
                        {t.kategorie && <span className="text-xs text-gray-400">· {t.kategorie}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-semibold ${t.typ==='einnahme' ? 'text-green-600' : 'text-red-500'}`}>
                        {t.typ==='einnahme' ? '+' : '-'}{fmt(Number(t.betrag))}
                      </p>
                    </div>
                    <button onClick={() => deleteTx(t.id)} className="text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ── TAB: Übersicht ────────────────────────────────── */}
        {tab === 'uebersicht' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard size={16} className="text-cyan-600" />
                  <p className="text-sm font-medium text-cyan-700">Burn Rate</p>
                </div>
                <p className="text-3xl font-semibold text-cyan-700">{fmt(monatlicheKosten)}</p>
                <p className="text-xs text-cyan-500 mt-1">monatliche Fixkosten</p>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-green-600" />
                  <p className="text-sm font-medium text-green-700">Einnahmen</p>
                </div>
                <p className="text-3xl font-semibold text-green-700">{fmt(einnahmen)}</p>
                <p className="text-xs text-green-500 mt-1">gesamt erfasst</p>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart2 size={16} className="text-gray-500" />
                  <p className="text-sm font-medium text-gray-600">Jahreskosten</p>
                </div>
                <p className="text-3xl font-semibold text-gray-900">{fmt(jaehrlicheKosten)}</p>
                <p className="text-xs text-gray-400 mt-1">hochgerechnet</p>
              </div>
            </div>

            {/* Monthly chart */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Monatlicher Verlauf</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v=>`${v}€`} width={45} />
                  <Tooltip formatter={(v) => fmt(Number(v))} contentStyle={{ fontSize:12, borderRadius:8, border:'1px solid #e2e8f0' }} />
                  <Bar dataKey="Einnahmen" fill="#22d3ee" radius={[4,4,0,0]} />
                  <Bar dataKey="Ausgaben"  fill="#fca5a5" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top costs */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Kostenpositionen</h3>
              {topAbos.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Noch keine aktiven Abos</p>
              ) : (
                <div className="space-y-2">
                  {topAbos.map(a => (
                    <div key={a.id} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm text-gray-700 truncate">{a.name}</p>
                          <p className="text-sm font-medium text-gray-900 shrink-0 ml-2">{fmt(monatlich(a))}/Mo</p>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-cyan-400 h-1.5 rounded-full"
                            style={{ width: `${(monatlich(a)/Math.max(monatlicheKosten,1))*100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Abo Modal ──────────────────────────────────────── */}
      {showAboModal && (
        <Modal title={editingAboId ? 'Abo bearbeiten' : 'Abo hinzufügen'} onClose={() => { setShowAboModal(false); setEditingAboId(null) }}>
          <div className="space-y-3">
            <Field label="Name *">
              <input autoFocus value={aboForm.name} onChange={e=>setAboForm({...aboForm,name:e.target.value})} placeholder="z.B. n8n Cloud" className={INPUT} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Kategorie">
                <select value={aboForm.kategorie} onChange={e=>setAboForm({...aboForm,kategorie:e.target.value})} className={SELECT}>
                  {ABO_KATEGORIEN.map(k=><option key={k}>{k}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={aboForm.status} onChange={e=>setAboForm({...aboForm,status:e.target.value as AboStatus})} className={SELECT}>
                  <option value="aktiv">Aktiv</option>
                  <option value="pausiert">Pausiert</option>
                  <option value="gekuendigt">Gekündigt</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Betrag (€)">
                <input type="number" step="0.01" min="0" value={aboForm.betrag} onChange={e=>setAboForm({...aboForm,betrag:e.target.value})} placeholder="9.90" className={INPUT} />
              </Field>
              <Field label="Intervall">
                <select value={aboForm.intervall} onChange={e=>setAboForm({...aboForm,intervall:e.target.value as AboIntervall})} className={SELECT}>
                  <option value="monatlich">Monatlich</option>
                  <option value="jaehrlich">Jährlich</option>
                </select>
              </Field>
            </div>
            <Field label="Notiz">
              <input value={aboForm.notiz} onChange={e=>setAboForm({...aboForm,notiz:e.target.value})} placeholder="z.B. Variabel, Free Tier..." className={INPUT} />
            </Field>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={()=>{setShowAboModal(false);setEditingAboId(null)}} className={BTN_S}>Abbrechen</button>
            <button onClick={saveAbo} disabled={!aboForm.name.trim()} className={BTN_P}>{editingAboId?'Speichern':'Hinzufügen'}</button>
          </div>
        </Modal>
      )}

      {/* ── Transaktion Modal ──────────────────────────────── */}
      {showTxModal && (
        <Modal title="Transaktion erfassen" onClose={() => setShowTxModal(false)}>
          <div className="space-y-3">
            <Field label="Beschreibung *">
              <input autoFocus value={txForm.beschreibung} onChange={e=>setTxForm({...txForm,beschreibung:e.target.value})} placeholder="z.B. Zahlung von Kunde X" className={INPUT} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Typ">
                <select value={txForm.typ} onChange={e=>setTxForm({...txForm,typ:e.target.value as TransaktionTyp})} className={SELECT}>
                  <option value="einnahme">💚 Einnahme</option>
                  <option value="ausgabe">🔴 Ausgabe</option>
                </select>
              </Field>
              <Field label="Betrag (€)">
                <input type="number" step="0.01" min="0" value={txForm.betrag} onChange={e=>setTxForm({...txForm,betrag:e.target.value})} placeholder="0.00" className={INPUT} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Datum">
                <input type="date" value={txForm.datum} onChange={e=>setTxForm({...txForm,datum:e.target.value})} className={INPUT} />
              </Field>
              <Field label="Kategorie">
                <select value={txForm.kategorie} onChange={e=>setTxForm({...txForm,kategorie:e.target.value})} className={SELECT}>
                  <option value="">—</option>
                  {TX_KATEGORIEN.map(k=><option key={k}>{k}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Notiz">
              <input value={txForm.notiz} onChange={e=>setTxForm({...txForm,notiz:e.target.value})} placeholder="Optional..." className={INPUT} />
            </Field>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={()=>setShowTxModal(false)} className={BTN_S}>Abbrechen</button>
            <button onClick={saveTx} disabled={!txForm.beschreibung.trim()||!txForm.betrag} className={BTN_P}>Speichern</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
