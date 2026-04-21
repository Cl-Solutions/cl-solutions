import { useEffect, useState } from 'react'
import { Plus, X, ChevronDown, Calendar, Trash2, Flame, Zap, Waves } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Task, TaskStatus, TaskPriority, TaskKategorie } from '../types'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

const STATUSES: { key: TaskStatus; label: string; bg: string; dot: string }[] = [
  { key: 'todo',        label: 'To Do',       bg: 'bg-gray-50 border-gray-200',      dot: 'bg-gray-300' },
  { key: 'in_progress', label: 'In Progress', bg: 'bg-blue-50 border-blue-100',      dot: 'bg-blue-400' },
  { key: 'waiting',     label: 'Waiting',     bg: 'bg-orange-50 border-orange-100',  dot: 'bg-orange-400' },
  { key: 'done',        label: 'Done',        bg: 'bg-green-50 border-green-100',    dot: 'bg-green-400' },
]

const PRIORITIES: { key: TaskPriority; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'hoch',    label: 'Hoch',    icon: <Flame  size={11} />, color: 'text-red-500 bg-red-50' },
  { key: 'mittel',  label: 'Mittel',  icon: <Zap    size={11} />, color: 'text-orange-500 bg-orange-50' },
  { key: 'niedrig', label: 'Niedrig', icon: <Waves  size={11} />, color: 'text-blue-400 bg-blue-50' },
]

const DEFAULT_ASSIGNED = ['Berkay', 'Mario', 'Beide']

interface TaskForm {
  title: string; notiz: string; category: string
  status: TaskStatus; priority: TaskPriority
  due_date: string; assigned_to: string
}
const emptyForm = (cat = ''): TaskForm => ({
  title: '', notiz: '', category: cat,
  status: 'todo', priority: 'mittel', due_date: '', assigned_to: '',
})

export default function Tasks() {
  const [kategorien, setKategorien] = useState<TaskKategorie[]>([])
  const [tasks, setTasks]           = useState<Task[]>([])
  const [loading, setLoading]       = useState(true)
  const [activeKat, setActiveKat]   = useState<string>('')
  const [activeStatus, setActiveStatus] = useState<TaskStatus>('todo') // mobile status tab

  const [showTaskModal, setShowTaskModal]   = useState(false)
  const [showKatModal, setShowKatModal]     = useState(false)
  const [form, setForm]                     = useState<TaskForm>(emptyForm())
  const [saving, setSaving]                 = useState(false)
  const [expandedId, setExpandedId]         = useState<string | null>(null)

  const [newKatName, setNewKatName]   = useState('')
  const [newKatEmoji, setNewKatEmoji] = useState('📌')

  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    const ch1 = supabase.channel('tasks-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, loadAll)
      .subscribe()
    const ch2 = supabase.channel('kat-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_kategorien' }, loadAll)
      .subscribe()
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2) }
  }, [])

  async function loadAll() {
    const [{ data: kats }, { data: t }] = await Promise.all([
      supabase.from('task_kategorien').select('*').order('sort_order'),
      supabase.from('tasks').select('*').order('created_at', { ascending: true }),
    ])
    const katList = kats || []
    setKategorien(katList)
    setTasks(t || [])
    if (katList.length > 0 && !activeKat) setActiveKat(katList[0].name)
    setLoading(false)
  }

  async function createTask() {
    if (!form.title.trim()) return
    setSaving(true)
    await supabase.from('tasks').insert({
      title: form.title.trim(),
      notiz: form.notiz || null,
      category: form.category || activeKat,
      status: form.status,
      priority: form.priority,
      due_date: form.due_date || null,
      assigned_to: form.assigned_to || null,
    })
    setForm(emptyForm(activeKat))
    setSaving(false)
    setShowTaskModal(false)
  }

  async function updateStatus(id: string, status: TaskStatus) {
    await supabase.from('tasks').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
  }

  async function createKategorie() {
    if (!newKatName.trim()) return
    const maxOrder = Math.max(0, ...kategorien.map(k => k.sort_order))
    await supabase.from('task_kategorien').insert({
      name: newKatName.trim(), emoji: newKatEmoji, sort_order: maxOrder + 1,
    })
    setNewKatName(''); setNewKatEmoji('📌')
    setShowKatModal(false)
  }

  async function deleteKategorie(id: string, name: string) {
    if (!confirm(`Kategorie "${name}" löschen? Zugehörige Tasks bleiben erhalten.`)) return
    await supabase.from('task_kategorien').delete().eq('id', id)
    if (activeKat === name) setActiveKat(kategorien[0]?.name || '')
  }

  const catTasks = tasks.filter(t => t.category === activeKat)
  const byStatus = (s: TaskStatus) => catTasks.filter(t => t.status === s)
  const openModal = (status: TaskStatus = 'todo') => {
    setForm(emptyForm(activeKat))
    setForm(f => ({ ...f, status }))
    setShowTaskModal(true)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent" />
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 flex items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Tasks</h1>
          <p className="text-xs text-gray-400 mt-0.5">{tasks.length} Tasks · {kategorien.length} Kategorien</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowKatModal(true)}
            className="hidden md:flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Plus size={13} /> Kategorie
          </button>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-1.5 bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-cyan-600 transition-colors"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Neuer Task</span>
            <span className="sm:hidden">Neu</span>
          </button>
        </div>
      </div>

      {/* Category tabs – horizontal scroll */}
      <div className="bg-white border-b border-gray-100 px-4 md:px-6 shrink-0">
        <div className="flex flex-wrap gap-1 py-2">
          {kategorien.map(kat => {
            const openCount = tasks.filter(t => t.category === kat.name && t.status !== 'done').length
            return (
              <button
                key={kat.id}
                onClick={() => setActiveKat(kat.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  activeKat === kat.name
                    ? 'bg-cyan-500 text-white font-medium'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <span>{kat.emoji}</span>
                <span className="hidden sm:inline">{kat.name}</span>
                {openCount > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeKat === kat.name ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>{openCount}</span>
                )}
              </button>
            )
          })}
          <button
            onClick={() => setShowKatModal(true)}
            className="md:hidden flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:bg-gray-100 border border-dashed border-gray-200 transition-colors"
          >
            <Plus size={12} /> Kat.
          </button>
        </div>
      </div>

      {/* DESKTOP: 4-column kanban */}
      <div className="hidden md:grid md:grid-cols-4 gap-4 flex-1 overflow-hidden p-4 lg:p-5">
        {STATUSES.map(({ key, label, bg, dot }) => (
          <div key={key} className={`flex flex-col rounded-xl border ${bg} overflow-hidden min-h-0`}>
            <div className="flex items-center justify-between px-3 py-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${dot}`} />
                <span className="text-xs font-semibold text-gray-600">{label}</span>
                <span className="text-xs text-gray-400">{byStatus(key).length}</span>
              </div>
              <button onClick={() => openModal(key)} className="text-gray-300 hover:text-cyan-500 transition-colors">
                <Plus size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 min-h-[60px]">
              {byStatus(key).map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isExpanded={expandedId === task.id}
                  onToggle={() => setExpandedId(expandedId === task.id ? null : task.id)}
                  onStatusChange={s => updateStatus(task.id, s)}
                  onDelete={() => deleteTask(task.id)}
                  statuses={STATUSES}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* MOBILE: status tabs + list */}
      <div className="md:hidden flex flex-col flex-1 overflow-hidden">
        {/* Status tabs */}
        <div className="flex bg-white border-b border-gray-100 shrink-0">
          {STATUSES.map(({ key, label, dot }) => (
            <button
              key={key}
              onClick={() => setActiveStatus(key)}
              className={`flex-1 flex flex-col items-center py-2.5 gap-1 text-xs transition-colors border-b-2 ${
                activeStatus === key
                  ? 'border-cyan-500 text-cyan-600'
                  : 'border-transparent text-gray-400'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${dot}`} />
              <span>{label}</span>
              <span className="font-semibold text-gray-700">{byStatus(key).length}</span>
            </button>
          ))}
        </div>
        {/* Task list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {byStatus(activeStatus).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-300 text-sm">Keine Tasks hier</p>
              <button onClick={() => openModal(activeStatus)} className="mt-3 text-xs text-cyan-500 underline">
                Task hinzufügen
              </button>
            </div>
          ) : (
            byStatus(activeStatus).map(task => (
              <TaskCard
                key={task.id}
                task={task}
                isExpanded={expandedId === task.id}
                onToggle={() => setExpandedId(expandedId === task.id ? null : task.id)}
                onStatusChange={s => updateStatus(task.id, s)}
                onDelete={() => deleteTask(task.id)}
                statuses={STATUSES}
              />
            ))
          )}
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <Modal title="Neuer Task" onClose={() => setShowTaskModal(false)}>
          <div className="space-y-3">
            <Field label="Titel *">
              <input
                autoFocus
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') createTask() }}
                placeholder="Was muss erledigt werden?"
                className={INPUT}
              />
            </Field>
            <Field label="Notiz">
              <textarea
                value={form.notiz}
                onChange={e => setForm({ ...form, notiz: e.target.value })}
                placeholder="Details, Links, Kontext..."
                rows={2}
                className={INPUT + ' resize-none'}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Kategorie">
                <select value={form.category || activeKat} onChange={e => setForm({ ...form, category: e.target.value })} className={SELECT}>
                  {kategorien.map(k => <option key={k.id} value={k.name}>{k.emoji} {k.name}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as TaskStatus })} className={SELECT}>
                  {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Priorität">
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as TaskPriority })} className={SELECT}>
                  {PRIORITIES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
              </Field>
              <Field label="Fällig am">
                <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className={INPUT} />
              </Field>
            </div>
            <Field label="Zugewiesen an">
              <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} className={SELECT}>
                <option value="">—</option>
                {DEFAULT_ASSIGNED.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setShowTaskModal(false)} className={BTN_SECONDARY}>Abbrechen</button>
            <button onClick={createTask} disabled={!form.title.trim() || saving} className={BTN_PRIMARY}>
              {saving ? 'Speichern...' : 'Task anlegen'}
            </button>
          </div>
        </Modal>
      )}

      {/* Kategorie Modal */}
      {showKatModal && (
        <Modal title="Kategorie hinzufügen" onClose={() => setShowKatModal(false)}>
          <div className="space-y-3">
            <Field label="Emoji">
              <input
                value={newKatEmoji}
                onChange={e => setNewKatEmoji(e.target.value)}
                maxLength={4}
                className={INPUT + ' text-2xl w-20'}
                placeholder="📌"
              />
            </Field>
            <Field label="Name *">
              <input
                autoFocus
                value={newKatName}
                onChange={e => setNewKatName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') createKategorie() }}
                placeholder="z.B. Kundenprojekte"
                className={INPUT}
              />
            </Field>
          </div>
          {/* Existing categories with delete */}
          {kategorien.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Bestehende Kategorien</p>
              <div className="space-y-1">
                {kategorien.map(k => (
                  <div key={k.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-50 group">
                    <span className="text-sm text-gray-700">{k.emoji} {k.name}</span>
                    <button onClick={() => deleteKategorie(k.id, k.name)} className="text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3 mt-5">
            <button onClick={() => setShowKatModal(false)} className={BTN_SECONDARY}>Abbrechen</button>
            <button onClick={createKategorie} disabled={!newKatName.trim()} className={BTN_PRIMARY}>Erstellen</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────

interface TaskCardProps {
  task: Task
  isExpanded: boolean
  onToggle: () => void
  onStatusChange: (s: TaskStatus) => void
  onDelete: () => void
  statuses: typeof STATUSES
}

function TaskCard({ task, isExpanded, onToggle, onStatusChange, onDelete, statuses }: TaskCardProps) {
  const isOverdue = task.due_date && task.due_date < format(new Date(), 'yyyy-MM-dd') && task.status !== 'done'
  const prio = PRIORITIES.find(p => p.key === task.priority)

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-3 hover:border-cyan-200 transition-all group">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className={`text-sm text-gray-800 leading-snug ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
            {task.title}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {prio && task.priority !== 'mittel' && (
              <span className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${prio.color}`}>
                {prio.icon} {prio.label}
              </span>
            )}
            {task.due_date && (
              <span className={`inline-flex items-center gap-1 text-xs ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}>
                <Calendar size={10} />
                {format(parseISO(task.due_date), 'd. MMM', { locale: de })}
                {isOverdue && ' ⚠️'}
              </span>
            )}
            {task.assigned_to && (
              <span className="text-xs text-cyan-600">{task.assigned_to}</span>
            )}
          </div>
        </div>
        <button onClick={onToggle} className="shrink-0 text-gray-200 hover:text-gray-500 transition-colors mt-0.5">
          <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-50 space-y-2">
          {task.notiz && <p className="text-xs text-gray-500 italic">{task.notiz}</p>}
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-xs text-gray-400">Status:</label>
            <select
              value={task.status}
              onChange={e => onStatusChange(e.target.value as TaskStatus)}
              className="text-xs border border-gray-200 rounded px-2 py-0.5 text-gray-600 focus:outline-none focus:border-cyan-300"
            >
              {statuses.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <button onClick={onDelete} className="ml-auto text-gray-200 hover:text-red-400 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Shared UI helpers ─────────────────────────────────────
const INPUT = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400'
const SELECT = INPUT
const BTN_PRIMARY = 'flex-1 px-4 py-2 text-sm font-medium bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
const BTN_SECONDARY = 'flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
      {children}
    </div>
  )
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
