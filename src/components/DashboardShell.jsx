import { useState } from 'react'
import AlertasRightRail from './AlertasRightRail'
import DashboardSidebar from './DashboardSidebar'

function DashboardShell({ user, onLogout, children, mainClassName = '' }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isAlertasCollapsed, setIsAlertasCollapsed] = useState(false)

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
