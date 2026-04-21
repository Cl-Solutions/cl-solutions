import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, CheckSquare, Clock, TrendingUp, ArrowRight,
  Wallet, Lightbulb, ExternalLink,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Lead, Task, Abo, Idee, WissensEintrag, QuickLink } from '../types'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

const STATUS_LABELS: Record<string, string> = {
  new:'Neu', contacted:'Kontaktiert', qualified:'Qualifiziert',
  proposal:'Angebot', negotiation:'Verhandlung',
  closed_won:'Gewonnen', closed_lost:'Verloren',
}
const STATUS_COLORS: Record<string, string> = {
  new:'bg-blue-100 text-blue-700', contacted:'bg-yellow-100 text-yellow-700',
  qualified:'bg-purple-100 text-purple-700', proposal:'bg-orange-100 text-orange-700',
  negotiation:'bg-pink-100 text-pink-700', closed_won:'bg-green-100 text-green-700',
  closed_lost:'bg-gray-100 text-gray-500',
}
const TASK_STATUS_LABELS: Record<string, string> = {
  todo:'To Do', in_progress:'In Progress', waiting:'Waiting', done:'Done',
}

function monatlich(abo: Abo) {
  if (abo.status === 'gekuendigt') return 0
  return abo.intervall === 'jaehrlich' ? abo.betrag / 12 : abo.betrag
}
function fmt(n: number) {
  return n.toLocaleString('de-DE', { style:'currency', currency:'EUR', minimumFractionDigits:0, maximumFractionDigits:0 })
}

export default function Dashboard() {
  const [leads, setLeads]       = useState<Lead[]>([])
  const [tasks, setTasks]       = useState<Task[]>([])
  const [abos, setAbos]         = useState<Abo[]>([])
  const [ideen, setIdeen]       = useState<Idee[]>([])
  const [wissen, setWissen]     = useState<WissensEintrag[]>([])
  const [qlinks, setQlinks]     = useState<QuickLink[]>([])
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    loadAll()
    const chs = [
      supabase.channel('db-leads').on('postgres_changes',{event:'*',schema:'public',table:'leads'},loadAll).subscribe(),
      supabase.channel('db-tasks').on('postgres_changes',{event:'*',schema:'public',table:'tasks'},loadAll).subscribe(),
      supabase.channel('db-abos').on('postgres_changes',{event:'*',schema:'public',table:'abos'},loadAll).subscribe(),
      supabase.channel('db-ideen').on('postgres_changes',{event:'*',schema:'public',table:'ideen'},loadAll).subscribe(),
      supabase.channel('db-wissen').on('postgres_changes',{event:'*',schema:'public',table:'wissensbibliothek'},loadAll).subscribe(),
      supabase.channel('db-links').on('postgres_changes',{event:'*',schema:'public',table:'quick_links'},loadAll).subscribe(),
    ]
    return () => chs.forEach(c => supabase.removeChannel(c))
  }, [])

  async function loadAll() {
    const today = format(new Date(), 'yyyy-MM-dd')
    const [l, t, a, i, w, q, td] = await Promise.all([
      supabase.from('leads').select('*').not('status','in','("closed_won","closed_lost")').order('updated_at',{ascending:false}),
      supabase.from('tasks').select('*').order('created_at',{ascending:false}),
      supabase.from('abos').select('*'),
      supabase.from('ideen').select('*').in('status',['idee','in_pruefung']),
      supabase.from('wissensbibliothek').select('*').order('erstellt_am',{ascending:false}).limit(3),
      supabase.from('quick_links').select('*').order('erstellt_am',{ascending:true}).limit(8),
      supabase.from('tasks').select('*').eq('due_date',today).neq('status','done'),
    ])
    setLeads(l.data || [])
    setTasks(t.data || [])
    setAbos(a.data || [])
    setIdeen(i.data || [])
    setWissen(w.data || [])
    setQlinks(q.data || [])
    setTodayTasks(td.data || [])
    setLoading(false)
  }

  const burnRate = abos.reduce((s, a) => s + monatlich(a), 0)
  const inProgress = tasks.filter(t => t.status === 'in_progress').length
  const waiting    = tasks.filter(t => t.status === 'waiting').length
  const done       = tasks.filter(t => t.status === 'done').length
  const todo       = tasks.filter(t => t.status === 'todo').length

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent" />
    </div>
  )

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Guten Morgen 👋</h1>
        <p className="text-sm text-gray-400 mt-0.5">{format(new Date(),'EEEE, d. MMMM yyyy',{locale:de})}</p>
      </div>

      {/* Stat tiles – 2 cols mobile, 3 tablet, 6 desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label:'Offene Leads',    value:leads.length,        icon:Users,       color:'text-cyan-600',   bg:'bg-cyan-50',   to:'/leads' },
          { label:'In Progress',     value:inProgress,          icon:TrendingUp,  color:'text-blue-600',   bg:'bg-blue-50',   to:'/tasks' },
          { label:'Waiting',         value:waiting,             icon:Clock,       color:'text-orange-500', bg:'bg-orange-50', to:'/tasks' },
          { label:'Heute fällig',    value:todayTasks.length,   icon:CheckSquare, color:'text-red-500',    bg:'bg-red-50',    to:'/tasks' },
          { label:'Burn Rate /Mo',   value:fmt(burnRate),       icon:Wallet,      color:'text-purple-600', bg:'bg-purple-50', to:'/finanzen' },
          { label:'Offene Ideen',    value:ideen.length,        icon:Lightbulb,   color:'text-amber-600',  bg:'bg-amber-50',  to:'/ideen' },
        ].map(({ label, value, icon: Icon, color, bg, to }) => (
          <Link key={label} to={to} className="bg-white rounded-xl border border-gray-100 p-3 md:p-4 hover:border-cyan-200 hover:shadow-sm transition-all">
            <div className={`w-7 h-7 md:w-8 md:h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}>
              <Icon size={14} className={color} />
            </div>
            <p className="text-lg md:text-xl font-semibold text-gray-900 leading-none">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </Link>
        ))}
      </div>

      {/* Main 2-col grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Open Leads */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Offene Leads</h2>
            <Link to="/leads" className="text-xs text-cyan-600 flex items-center gap-1">Alle <ArrowRight size={12} /></Link>
          </div>
          {leads.length === 0 ? (
            <p className="text-sm text-gray-300 text-center py-6">Keine offenen Leads</p>
          ) : (
            <div className="space-y-1">
              {leads.slice(0,5).map(lead => (
                <Link key={lead.id} to={`/leads/${lead.id}`} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-gray-50 group transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 group-hover:text-cyan-600 truncate">{lead.name}</p>
                    {lead.next_step && <p className="text-xs text-gray-400 truncate">{lead.next_step}</p>}
                  </div>
                  <span className={`ml-2 shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[lead.status]}`}>
                    {STATUS_LABELS[lead.status]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Today's Tasks */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Heute fällig</h2>
            <Link to="/tasks" className="text-xs text-cyan-600 flex items-center gap-1">Alle <ArrowRight size={12} /></Link>
          </div>
          {todayTasks.length === 0 ? (
            <p className="text-sm text-gray-300 text-center py-6">Nichts fällig heute 🎉</p>
          ) : (
            <div className="space-y-1">
              {todayTasks.slice(0,5).map(task => (
                <div key={task.id} className="flex items-start gap-3 px-2 py-2 rounded-lg">
                  <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${task.status==='in_progress'?'bg-blue-500':task.status==='waiting'?'bg-orange-400':'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{task.titel}</p>
                    <p className="text-xs text-gray-400">{TASK_STATUS_LABELS[task.status]}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      {qlinks.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Quick Links</h2>
            <Link to="/links" className="text-xs text-cyan-600 flex items-center gap-1">Alle <ArrowRight size={12} /></Link>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {qlinks.map(l => (
              <a
                key={l.id}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm"
                  style={{ backgroundColor: l.farbe + '15', border: `1px solid ${l.farbe}25` }}
                >
                  {l.emoji}
                </div>
                <p className="text-xs text-gray-600 text-center leading-tight truncate w-full">{l.name}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Bottom row: Task chart + Zuletzt gespeichert + Ideen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Task overview */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Task-Übersicht</h2>
          <div className="flex gap-3">
            {[
              { label:'To Do',      count:todo,       color:'bg-gray-200' },
              { label:'Progress',   count:inProgress, color:'bg-blue-400' },
              { label:'Waiting',    count:waiting,    color:'bg-orange-400' },
              { label:'Done',       count:done,       color:'bg-green-400' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex-1 text-center">
                <div className="flex items-end justify-center mb-1.5">
                  <div className={`${color} rounded-sm w-full`} style={{ height: Math.max(4, (count/Math.max(tasks.length,1))*48)+'px' }} />
                </div>
                <p className="text-base font-semibold text-gray-900">{count}</p>
                <p className="text-xs text-gray-400 hidden sm:block">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Zuletzt gespeichert */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Letzte Videos</h2>
            <Link to="/wissen" className="text-xs text-cyan-600 flex items-center gap-1">Alle <ArrowRight size={12} /></Link>
          </div>
          {wissen.length === 0 ? (
            <p className="text-xs text-gray-300 text-center py-4">Noch keine Ressourcen</p>
          ) : (
            <div className="space-y-2">
              {wissen.map(w => (
                <a key={w.id} href={w.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 group hover:bg-gray-50 rounded-lg p-1.5 transition-colors">
                  {w.thumbnail_url ? (
                    <img src={w.thumbnail_url} alt="" className="w-12 h-9 rounded object-cover bg-gray-100 shrink-0" onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
                  ) : (
                    <div className="w-12 h-9 rounded bg-gray-100 flex items-center justify-center shrink-0 text-sm">▶️</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate group-hover:text-cyan-600">{w.titel}</p>
                    <p className="text-xs text-gray-400">{w.plattform}</p>
                  </div>
                  <ExternalLink size={11} className="text-gray-300 shrink-0 opacity-0 group-hover:opacity-100" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Offene Ideen */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Offene Ideen</h2>
            <Link to="/ideen" className="text-xs text-cyan-600 flex items-center gap-1">Alle <ArrowRight size={12} /></Link>
          </div>
          {ideen.length === 0 ? (
            <p className="text-xs text-gray-300 text-center py-4">Keine offenen Ideen</p>
          ) : (
            <div className="space-y-2">
              {ideen.slice(0,4).map(i => (
                <div key={i.id} className="flex items-start gap-2 px-1 py-1">
                  <span className="text-sm shrink-0">{i.status==='idee'?'💡':'🔍'}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{i.titel}</p>
                    <p className="text-xs text-gray-400">{i.kategorie}</p>
                  </div>
                </div>
              ))}
              {ideen.length > 4 && (
                <Link to="/ideen" className="text-xs text-cyan-500 block text-center mt-1">+{ideen.length-4} weitere</Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
