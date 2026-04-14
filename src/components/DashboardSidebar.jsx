import {
  Bot,
  Bell,
  BriefcaseBusiness,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  ScrollText,
  Users,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { getStoredUser } from '../services/authStorage'
import { hasAnyLevelAccess } from '../services/accessControl'

const mainItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Mensagens de Campo', icon: MessageSquare, to: '/dashboard/mensagens-campo' },
  { label: 'Registros', icon: FileText, to: '/dashboard/registros' },
  {
    label: 'Auditoria Registros',
    icon: ScrollText,
    to: '/dashboard/registros/auditoria',
    allowedLevels: ['gerente'],
  },
  { label: 'Diario de Obra', icon: FileText, to: '/dashboard/diario-obra' },
  { label: 'Frentes', icon: BriefcaseBusiness, to: '/dashboard/frentes-servico' },
  { label: 'Alertas', icon: Bell, to: '/dashboard/alertas' },
]

function SidebarItem({ item }) {
  const Icon = item.icon

  if (item.disabled) {
    return (
      <div className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-400">
        <Icon size={18} />
        {item.label}
      </div>
    )
  }

  return (
    <NavLink
      to={item.to}
      end={item.to === '/dashboard'}
      className={({ isActive }) =>
        `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
          isActive
            ? 'bg-[#1C1917] text-white'
            : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
        }`
      }
    >
      <Icon size={18} />
      {item.label}
    </NavLink>
  )
}

function DashboardSidebar({ user, onLogout }) {
  const persistedUser = getStoredUser()
  const effectiveUser = user || persistedUser
  const isAdmin = effectiveUser?.nivel_acesso === 'administrador'
  const visibleMainItems = mainItems.filter((item) => hasAnyLevelAccess(effectiveUser, item.allowedLevels))

  return (
    <aside className="hidden w-72 shrink-0 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm lg:block">
      <NavLink to="/dashboard" className="mb-8 inline-flex items-center gap-2">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#F97316] text-white">
          <LayoutDashboard size={20} />
        </span>
        <span className="font-display text-lg font-extrabold text-stone-900">Diario de Obra</span>
      </NavLink>

      <nav className="space-y-2">
        {visibleMainItems.map((item) => (
          <SidebarItem key={item.label} item={item} />
        ))}

        {isAdmin && (
          <>
            <NavLink
              to="/dashboard/usuarios"
              className={({ isActive }) =>
                `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-[#1C1917] text-white'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`
              }
            >
              <Users size={18} />
              Usuarios
            </NavLink>

            <NavLink
              to="/dashboard/agent/instrucoes"
              className={({ isActive }) =>
                `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-[#1C1917] text-white'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`
              }
            >
              <Bot size={18} />
              Instrucoes do Agente
            </NavLink>
          </>
        )}
      </nav>

      <button
        type="button"
        onClick={onLogout}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
      >
        <LogOut size={16} />
        Sair
      </button>
    </aside>
  )
}

export default DashboardSidebar
