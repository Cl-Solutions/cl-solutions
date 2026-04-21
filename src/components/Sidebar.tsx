import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, CheckSquare, Zap,
  Wallet, BookOpen, Link2, Lightbulb,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard',        icon: LayoutDashboard },
  { to: '/leads',     label: 'Leads & Kunden',   icon: Users },
  { to: '/tasks',     label: 'Tasks',             icon: CheckSquare },
  { to: '/finanzen',  label: 'Finanzen',          icon: Wallet },
  { to: '/wissen',    label: 'Wissensbibliothek', icon: BookOpen },
  { to: '/links',     label: 'Quick Links',       icon: Link2 },
  { to: '/ideen',     label: 'Ideen',             icon: Lightbulb },
]

export default function Sidebar() {
  return (
    <aside className="w-56 lg:w-60 bg-white border-r border-gray-100 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-cyan-500 rounded-xl flex items-center justify-center shadow-sm">
            <Zap size={15} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-none">CL-Solutions</p>
            <p className="text-xs text-cyan-500 mt-0.5 font-medium">HQ</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
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

      <div className="px-5 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">Berkay & Mario</p>
      </div>
    </aside>
  )
}
