import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, CheckSquare, Clock, TrendingUp, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Lead, Task } from '../types'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

const STATUS_LABELS: Record<string, string> = {
  new: 'Neu',
  contacted: 'Kontaktiert',
  qualified: 'Qualifiziert',
  proposal: 'Angebot',
  negotiation: 'Verhandlung',
  closed_won: 'Gewonnen',
  closed_lost: 'Verloren',
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-purple-100 text-purple-700',
  proposal: 'bg-orange-100 text-orange-700',
  negotiation: 'bg-pink-100 text-pink-700',
  closed_won: 'bg-green-100 text-green-700',
  closed_lost: 'bg-gray-100 text-gray-500',
}

const TASK_STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  waiting: 'Waiting',
  done: 'Done',
}

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()

    const leadsChannel = supabase
      .channel('dashboard-leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => loadData())
      .subscribe()

    const tasksChannel = supabase
      .channel('dashboard-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => loadData())
      .subscribe()

    return () => {
      supabase.removeChannel(leadsChannel)
      supabase.removeChannel(tasksChannel)
    }
  }, [])

  async function loadData() {
    const today = format(new Date(), 'yyyy-MM-dd')

    const [{ data: leadsData }, { data: tasksData }, { data: todayData }] = await Promise.all([
      supabase
        .from('leads')
        .select('*')
        .not('status', 'in', '("closed_won","closed_lost")')
        .order('updated_at', { ascending: false }),
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase
        .from('tasks')
        .select('*')
        .eq('due_date', today)
        .neq('status', 'done')
        .order('created_at', { ascending: false }),
    ])

    setLeads(leadsData || [])
    setAllTasks(tasksData || [])
    setTodayTasks(todayData || [])
    setLoading(false)
  }

  const openLeads = leads.length
  const inProgressTasks = allTasks.filter((t) => t.status === 'in_progress').length
  const waitingTasks = allTasks.filter((t) => t.status === 'waiting').length
  const doneTasks = allTasks.filter((t) => t.status === 'done').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Guten Morgen 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {format(new Date(), "EEEE, d. MMMM yyyy", { locale: de })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Offene Leads', value: openLeads, icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-50' },
          { label: 'In Progress', value: inProgressTasks, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Waiting', value: waitingTasks, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Heute fällig', value: todayTasks.length, icon: CheckSquare, color: 'text-red-500', bg: 'bg-red-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Open Leads */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Offene Leads</h2>
            <Link to="/leads" className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
              Alle <ArrowRight size={12} />
            </Link>
          </div>
          {leads.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Keine offenen Leads</p>
          ) : (
            <div className="space-y-2">
              {leads.slice(0, 6).map((lead) => (
                <Link
                  key={lead.id}
                  to={`/leads/${lead.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800 group-hover:text-cyan-600 transition-colors">
                      {lead.name}
                    </p>
                    {lead.industry && (
                      <p className="text-xs text-gray-400">{lead.industry}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[lead.status]}`}>
                    {STATUS_LABELS[lead.status]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Today's Tasks */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Heute fällig</h2>
            <Link to="/tasks" className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
              Alle <ArrowRight size={12} />
            </Link>
          </div>
          {todayTasks.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Nichts fällig heute 🎉</p>
          ) : (
            <div className="space-y-2">
              {todayTasks.slice(0, 6).map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                    task.status === 'in_progress' ? 'bg-blue-500' :
                    task.status === 'waiting' ? 'bg-orange-400' : 'bg-gray-300'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{task.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{TASK_STATUS_LABELS[task.status]}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick stats bottom */}
      <div className="mt-6 bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Task-Übersicht</h2>
        <div className="flex gap-4">
          {[
            { label: 'To Do', count: allTasks.filter(t => t.status === 'todo').length, color: 'bg-gray-200' },
            { label: 'In Progress', count: inProgressTasks, color: 'bg-blue-400' },
            { label: 'Waiting', count: waitingTasks, color: 'bg-orange-400' },
            { label: 'Done', count: doneTasks, color: 'bg-green-400' },
          ].map(({ label, count, color }) => (
            <div key={label} className="flex-1 text-center">
              <div className="flex items-end justify-center gap-1 mb-2">
                <div
                  className={`${color} rounded-sm w-full`}
                  style={{ height: Math.max(4, (count / Math.max(allTasks.length, 1)) * 60) + 'px' }}
                />
              </div>
              <p className="text-lg font-semibold text-gray-900">{count}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
