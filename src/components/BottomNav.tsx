import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, CheckSquare,
  MoreHorizontal, Wallet, BookOpen, Link2, Lightbulb, X,
} from 'lucide-react'

const mainItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads',     label: 'Leads',     icon: Users },
  { to: '/tasks',     label: 'Tasks',     icon: CheckSquare },
]

const moreItems = [
  { to: '/finanzen', label: 'Finanzen',          icon: Wallet },
  { to: '/wissen',   label: 'Wissensbibliothek', icon: BookOpen },
  { to: '/links',    label: 'Quick Links',       icon: Link2 },
  { to: '/ideen',    label: 'Ideen',             icon: Lightbulb },
]

export default function BottomNav() {
  const [showMore, setShowMore] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      {/* Mehr-Drawer */}
      {showMore && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setShowMore(false)}
          />
          <div className="fixed bottom-16 left-0 right-0 z-50 bg-white border-t border-gray-100 rounded-t-2xl shadow-xl px-4 py-4">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="grid grid-cols-4 gap-2">
              {moreItems.map(({ to, label, icon: Icon }) => (
                <button
                  key={to}
                  onClick={() => { navigate(to); setShowMore(false) }}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <Icon size={22} className="text-gray-600" strokeWidth={1.8} />
                  <span className="text-xs text-gray-600 text-center leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 flex safe-area-pb">
        {mainItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setShowMore(false)}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-xs transition-colors ${
                isActive ? 'text-cyan-600' : 'text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className={isActive ? 'font-medium' : ''}>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Mehr button */}
        <button
          onClick={() => setShowMore(!showMore)}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-xs transition-colors ${
            showMore ? 'text-cyan-600' : 'text-gray-400'
          }`}
        >
          {showMore ? <X size={20} strokeWidth={2} /> : <MoreHorizontal size={20} strokeWidth={1.8} />}
          <span>Mehr</span>
        </button>
      </nav>
    </>
  )
}
