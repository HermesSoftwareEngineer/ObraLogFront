import { LoaderCircle, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardSidebar from '../components/DashboardSidebar'
import { clearAuthSession, getAuthToken, getStoredUser } from '../services/authStorage'
import { normalizeCollection } from '../services/responseNormalizers'
import { listRegistroAuditoria } from '../services/registrosService'

function formatDateTime(value) {
  if (!value) {
    return '-'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return String(value)
  }

  return parsed.toLocaleString('pt-BR')
}

function RegistrosAuditoriaPage() {
  const navigate = useNavigate()
  const [registroId, setRegistroId] = useState('')
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const token = useMemo(() => getAuthToken(), [])
  const currentUser = getStoredUser()

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  const handleSearch = async (event) => {
    event.preventDefault()

    const parsedRegistroId = Number(registroId)
    if (!Number.isFinite(parsedRegistroId) || parsedRegistroId <= 0) {
      setError('Informe um registro_id valido (numero maior que zero).')
      return
    }

    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const data = await listRegistroAuditoria(token, parsedRegistroId)
      const normalizedItems = normalizeCollection(data, ['items', 'auditoria', 'data'])
      setItems(normalizedItems)
      setTotal(data?.total ?? normalizedItems.length)
      setSuccess('Auditoria carregada com sucesso.')
    } catch (err) {
      setError(err.message || 'Nao foi possivel carregar a auditoria do registro.')
      setItems([])
      setTotal(0)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-[#292524]">
      <div className="mx-auto flex max-w-7xl gap-4 p-4 sm:p-6 lg:gap-6 lg:p-8">
        <DashboardSidebar user={currentUser} onLogout={handleLogout} />

        <main className="w-full rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#F97316]">Operacao</p>
              <h1 className="mt-1 font-display text-3xl font-extrabold text-stone-900">Auditoria de registros</h1>
            </div>
            <div className="rounded-xl bg-stone-100 px-4 py-2 text-sm text-stone-700">
              {currentUser ? `${currentUser.nome} (${currentUser.nivel_acesso})` : 'Carregando usuario...'}
            </div>
          </header>

          <form onSubmit={handleSearch} className="mt-8 rounded-2xl border border-stone-200 bg-white p-4">
            <h2 className="font-display text-lg font-bold text-stone-900">Consultar trilha</h2>

            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="block w-full max-w-xs">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Registro ID</span>
                <input
                  type="number"
                  min="1"
                  value={registroId}
                  onChange={(event) => setRegistroId(event.target.value)}
                  required
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                  placeholder="Ex.: 10"
                />
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1C1917] px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? <LoaderCircle size={14} className="animate-spin" /> : <Search size={14} />}
                Buscar auditoria
              </button>
            </div>
          </form>

          {error && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          {success && (
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </p>
          )}

          <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-stone-900">Eventos da trilha</h2>
              <span className="text-xs text-stone-500">Total: {total}</span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                <thead>
                  <tr className="text-left text-stone-500">
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Acao</th>
                    <th className="px-3 py-2">Ator</th>
                    <th className="px-3 py-2">Nivel</th>
                    <th className="px-3 py-2">Data</th>
                    <th className="px-3 py-2">Diff</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={String(item.id)} className="rounded-xl bg-[#F5F5F4] text-stone-700">
                      <td className="rounded-l-xl px-3 py-2 font-mono text-xs">{item.id || '-'}</td>
                      <td className="px-3 py-2">{item.acao || '-'}</td>
                      <td className="px-3 py-2">{item.actor_user_id || '-'}</td>
                      <td className="px-3 py-2">{item.actor_level || '-'}</td>
                      <td className="px-3 py-2">{formatDateTime(item.created_at)}</td>
                      <td className="rounded-r-xl px-3 py-2">
                        <pre className="max-w-md overflow-auto rounded-lg border border-stone-200 bg-white p-2 text-[11px] text-stone-700">
                          {typeof item.diff_json === 'string'
                            ? item.diff_json
                            : JSON.stringify(item.diff_json || {}, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  ))}

                  {!isLoading && items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-stone-500">
                        Nenhum evento de auditoria encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default RegistrosAuditoriaPage
