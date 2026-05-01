import {
  Bot,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Users,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { getStoredUser } from '../services/authStorage'
import { hasAnyLevelAccess } from '../services/accessControl'

const mainItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  {
    label: 'Conversas',
    icon: MessageSquare,
    to: '/dashboard/conversas',
    allowedLevels: ['administrador'],
  },
  { label: 'Registros', icon: FileText, to: '/dashboard/registros' },
  { label: 'Diario de Obra', icon: FileText, to: '/dashboard/diario-obra' },
  { label: 'Frentes', icon: BriefcaseBusiness, to: '/dashboard/frentes-servico' },
  {
    label: 'Configuracoes',
    icon: ClipboardList,
    to: '/dashboard/configuracoes',
    allowedLevels: ['administrador', 'gerente'],
  },
]

function SidebarItem({ item, isCollapsed }) {
  const Icon = item.icon

  if (item.disabled) {
    return (
      <div
        className={`flex w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-400 ${
          isCollapsed ? 'justify-center' : 'items-center gap-3'
        }`}
        title={item.label}
      >
        <Icon size={18} />
        {!isCollapsed && item.label}
      </div>
    )
  }

  return (
    <NavLink
      to={item.to}
      end={item.to === '/dashboard'}
      title={item.label}
      className={({ isActive }) =>
        `flex w-full rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
          isCollapsed ? 'justify-center' : 'items-center gap-3'
        } ${
          isActive
            ? 'bg-[#1C1917] text-white'
            : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
        }`
      }
    >
      <Icon size={18} />
      {!isCollapsed && item.label}
    </NavLink>
  )
}

function DashboardSidebar({ user, onLogout, isCollapsed = false, onToggleCollapse }) {
  const persistedUser = getStoredUser()
  const effectiveUser = user || persistedUser
  const isAdmin = effectiveUser?.nivel_acesso === 'administrador'
  const canManageUsers = hasAnyLevelAccess(effectiveUser, ['administrador', 'gerente'])
  const visibleMainItems = mainItems.filter((item) => hasAnyLevelAccess(effectiveUser, item.allowedLevels))

  return (
    <aside
      className={`hidden shrink-0 rounded-3xl border border-stone-200 bg-white shadow-sm lg:block ${
        isCollapsed ? 'w-20 p-3' : 'w-72 p-5'
      }`}
    >
      <div className={`mb-8 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between gap-2'}`}>
        <NavLink to="/dashboard" className="inline-flex items-center gap-2" title="Dashboard">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#F97316] text-white">
            <LayoutDashboard size={20} />
          </span>
          {!isCollapsed && <span className="font-display text-lg font-extrabold text-stone-900">Diario de Obra</span>}
        </NavLink>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-300 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
          title={isCollapsed ? 'Expandir menu' : 'Colapsar menu'}
          aria-label={isCollapsed ? 'Expandir menu' : 'Colapsar menu'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="space-y-2">
        {visibleMainItems.map((item) => (
          <SidebarItem key={item.label} item={item} isCollapsed={isCollapsed} />
        ))}

        {canManageUsers && (
          <NavLink
            to="/dashboard/usuarios"
            title="Usuarios"
            className={({ isActive }) =>
              `flex w-full rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                isCollapsed ? 'justify-center' : 'items-center gap-3'
              } ${
                isActive
                  ? 'bg-[#1C1917] text-white'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`
            }
          >
            <Users size={18} />
            {!isCollapsed && 'Usuarios'}
          </NavLink>
        )}

        {isAdmin && (
          <>
            <NavLink
              to="/dashboard/agent/instrucoes"
              title="Instrucoes do Agente"
              className={({ isActive }) =>
                `flex w-full rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isCollapsed ? 'justify-center' : 'items-center gap-3'
                } ${
                  isActive
                    ? 'bg-[#1C1917] text-white'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`
              }
            >
              <Bot size={18} />
              {!isCollapsed && 'Instrucoes do Agente'}
            </NavLink>
          </>
        )}
      </nav>

      <button
        type="button"
        onClick={onLogout}
        title="Sair"
        className={`mt-8 inline-flex rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 ${
          isCollapsed ? 'w-full items-center justify-center' : 'w-full items-center justify-center gap-2'
        }`}
      >
        <LogOut size={16} />
        {!isCollapsed && 'Sair'}
      </button>
    </aside>
  )
}

export default DashboardSidebar
