import { useEffect, useState } from 'react'
import { Plus, X, ChevronDown, Calendar, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Task, TaskCategory, TaskStatus } from '../types'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

const CATEGORIES: { key: TaskCategory; label: string; emoji: string }[] = [
  { key: 'sales_leads', label: 'Sales & Leads', emoji: '🎯' },
  { key: 'website', label: 'Website', emoji: '🌐' },
  { key: 'marketing', label: 'Marketing', emoji: '📣' },
  { key: 'systems_tech', label: 'Systeme & Tech', emoji: '⚙️' },
  { key: 'admin_legal', label: 'Admin & Legal', emoji: '📋' },
]

const STATUSES: { key: TaskStatus; label: string; color: string; dot: string }[] = [
  { key: 'todo', label: 'To Do', color: 'bg-gray-50 border-gray-200', dot: 'bg-gray-300' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-blue-50 border-blue-100', dot: 'bg-blue-400' },
  { key: 'waiting', label: 'Waiting', color: 'bg-orange-50 border-orange-100', dot: 'bg-orange-400' },
  { key: 'done', label: 'Done', color: 'bg-green-50 border-green-100', dot: 'bg-green-400' },
]

interface NewTaskForm {
  title: string
  description: string
  category: TaskCategory
  status: TaskStatus
  due_date: string
  assigned_to: string
}

const defaultForm: NewTaskForm = {
  title: '',
  description: '',
  category: 'sales_leads',
  status: 'todo',
  due_date: '',
  assigned_to: '',
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<TaskCategory>('sales_leads')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<NewTaskForm>({ ...defaultForm, category: activeCategory })
  const [saving, setSaving] = useState(false)
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  useEffect(() => {
    loadTasks()
    const channel = supabase
      .channel('tasks-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, loadTasks)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadTasks() {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: true })
    setTasks(data || [])
    setLoading(false)
  }

  async function createTask() {
    if (!form.title.trim()) return
    setSaving(true)
    await supabase.from('tasks').insert({
      title: form.title.trim(),
      description: form.description || null,
      category: form.category,
      status: form.status,
      due_date: form.due_date || null,
      assigned_to: form.assigned_to || null,
    })
    setForm({ ...defaultForm, category: activeCategory })
    setSaving(false)
    setShowModal(false)
  }

  async function updateStatus(taskId: string, newStatus: TaskStatus) {
    await supabase.from('tasks').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', taskId)
  }

  async function deleteTask(taskId: string) {
    await supabase.from('tasks').delete().eq('id', taskId)
  }

  const categoryTasks = tasks.filter((t) => t.category === activeCategory)
  const byStatus = (status: TaskStatus) => categoryTasks.filter((t) => t.status === status)

  const openModal = (status: TaskStatus = 'todo') => {
    setForm({ ...defaultForm, category: activeCategory, status })
    setShowModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">{tasks.length} Tasks insgesamt</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-cyan-600 transition-colors"
        >
          <Plus size={16} />
          Neuer Task
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 mb-6 bg-white border border-gray-100 rounded-xl p-1.5 w-fit">
        {CATEGORIES.map(({ key, label, emoji }) => {
          const count = tasks.filter(t => t.category === key && t.status !== 'done').length
          return (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeCategory === key
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span>{emoji}</span>
              <span>{label}</span>
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeCategory === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-4 gap-4">
        {STATUSES.map(({ key, label, color, dot }) => (
          <div key={key} className={`rounded-xl border ${color} p-3`}>
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${dot}`} />
                <span className="text-xs font-semibold text-gray-600">{label}</span>
                <span className="text-xs text-gray-400">{byStatus(key).length}</span>
              </div>
              <button
                onClick={() => openModal(key)}
                className="text-gray-300 hover:text-cyan-500 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Task Cards */}
            <div className="space-y-2 min-h-[4rem]">
              {byStatus(key).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isExpanded={expandedTask === task.id}
                  onToggleExpand={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                  onStatusChange={(s) => updateStatus(task.id, s)}
                  onDelete={() => deleteTask(task.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Neuer Task</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Titel *</label>
                <input
                  autoFocus
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') createTask() }}
                  placeholder="Task beschreiben..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Beschreibung</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Details..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Kategorie</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as TaskCategory })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
                  >
                    {CATEGORIES.map(({ key, label }) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
                  >
                    {STATUSES.map(({ key, label }) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Fälligkeitsdatum</label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Zugewiesen an</label>
                  <select
                    value={form.assigned_to}
                    onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
                  >
                    <option value="">—</option>
                    <option value="Berkay">Berkay</option>
                    <option value="Mario">Mario</option>
                    <option value="Beide">Beide</option>
                  </select>
                </div>
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
                onClick={createTask}
                disabled={!form.title.trim() || saving}
                className="flex-1 px-4 py-2 text-sm font-medium bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50"
              >
                {saving ? 'Speichern...' : 'Task anlegen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface TaskCardProps {
  task: Task
  isExpanded: boolean
  onToggleExpand: () => void
  onStatusChange: (s: TaskStatus) => void
  onDelete: () => void
}

function TaskCard({ task, isExpanded, onToggleExpand, onStatusChange, onDelete }: TaskCardProps) {
  const isOverdue = task.due_date && task.due_date < format(new Date(), 'yyyy-MM-dd') && task.status !== 'done'

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-3 group hover:border-cyan-200 transition-all">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 leading-snug">{task.title}</p>
          {task.due_date && (
            <div className={`flex items-center gap-1 mt-1 ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}>
              <Calendar size={10} />
              <span className="text-xs">
                {format(parseISO(task.due_date), 'd. MMM', { locale: de })}
                {isOverdue && ' · Überfällig'}
              </span>
            </div>
          )}
          {task.assigned_to && (
            <span className="text-xs text-cyan-600 mt-1 inline-block">{task.assigned_to}</span>
          )}
        </div>
        <button
          onClick={onToggleExpand}
          className="shrink-0 text-gray-200 hover:text-gray-500 transition-colors mt-0.5"
        >
          <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-50 space-y-2">
          {task.description && (
            <p className="text-xs text-gray-500">{task.description}</p>
          )}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Status:</label>
            <select
              value={task.status}
              onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
              className="text-xs border border-gray-200 rounded px-2 py-0.5 text-gray-600 focus:outline-none focus:border-cyan-300"
            >
              {STATUSES.map(({ key, label }) => (
                <option key={key} value={key}>{label}</option>
              ))}
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
