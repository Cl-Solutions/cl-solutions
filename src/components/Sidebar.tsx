import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, CheckSquare, Zap } from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads', label: 'Leads & Kunden', icon: Users },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
]

export default function Sidebar() {
  return (
    <aside className="w-56 bg-white border-r border-gray-100 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-cyan-500 rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-700 text-gray-900 leading-none font-semibold">CL-Solutions</p>
            <p className="text-xs text-gray-400 mt-0.5">AI Agentur CRM</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-cyan-50 text-cyan-600 font-medium'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">Berkay & Mario</p>
      </div>
    </aside>
  )
}
