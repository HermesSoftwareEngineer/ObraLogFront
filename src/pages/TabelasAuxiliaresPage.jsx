import { BellRing, ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardShell from '../components/DashboardShell'
import { clearAuthSession, getAuthToken, getStoredUser } from '../services/authStorage'

function TabelasAuxiliaresPage() {
  const navigate = useNavigate()
  const user = useMemo(() => getStoredUser(), [])

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  const token = getAuthToken()
  if (!token) {
    navigate('/login', { replace: true })
    return null
  }

  return (
    <DashboardShell user={user} onLogout={handleLogout}>
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-[#F97316]">Configuracoes</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-stone-900">Tabelas Auxiliares</h1>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <button
          type="button"
          onClick={() => navigate('/dashboard/configuracoes/tabelas-auxiliares/tipos-alerta')}
          className="group rounded-2xl border border-stone-200 bg-white p-5 text-left transition hover:border-stone-300 hover:bg-stone-50"
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <BellRing size={18} />
            </span>
            <ChevronRight size={18} className="text-stone-400 transition group-hover:text-stone-700" />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold text-stone-900">Tipos de Alerta</h2>
          <p className="mt-2 text-sm text-stone-600">CRUD completo dos tipos simples de alerta.</p>
        </button>
      </section>
    </DashboardShell>
  )
}

export default TabelasAuxiliaresPage
