import { useEffect, useState } from 'react'
import AlertasRightRail from './AlertasRightRail'
import DashboardSidebar from './DashboardSidebar'

const SIDEBAR_COLLAPSED_KEY = 'obralog.dashboard.sidebarCollapsed'
const ALERTAS_COLLAPSED_KEY = 'obralog.dashboard.alertasCollapsed'

function readStoredFlag(key, fallback = false) {
  const rawValue = localStorage.getItem(key)

  if (rawValue === null) {
    return fallback
  }

  return rawValue === 'true'
}

function DashboardShell({ user, onLogout, children, mainClassName = '' }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => readStoredFlag(SIDEBAR_COLLAPSED_KEY))
  const [isAlertasCollapsed, setIsAlertasCollapsed] = useState(() => readStoredFlag(ALERTAS_COLLAPSED_KEY))

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  useEffect(() => {
    localStorage.setItem(ALERTAS_COLLAPSED_KEY, String(isAlertasCollapsed))
  }, [isAlertasCollapsed])

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-[#292524]">
      <div className="mx-auto flex max-w-[110rem] items-start gap-4 p-4 sm:p-6 lg:gap-6 lg:p-8">
        <DashboardSidebar
          user={user}
          onLogout={onLogout}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        <main
          className={`min-w-0 flex-1 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8 ${mainClassName}`.trim()}
        >
          {children}
        </main>

        <AlertasRightRail
          isCollapsed={isAlertasCollapsed}
          onToggleCollapse={() => setIsAlertasCollapsed((prev) => !prev)}
        />
      </div>
    </div>
  )
}

export default DashboardShell
