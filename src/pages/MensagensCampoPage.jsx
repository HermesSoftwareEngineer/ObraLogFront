import { Eye, LoaderCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardSidebar from '../components/DashboardSidebar'
import { getCurrentUser } from '../services/authService'
import { clearAuthSession, getAuthToken } from '../services/authStorage'
import { getMensagemCampoById, listMensagensCampo } from '../services/mensagensCampoService'
import { getEntityId, normalizeCollection, normalizeEntity } from '../services/responseNormalizers'

const STATUS_OPTIONS = ['pendente', 'processada', 'erro']

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

function MensagensCampoPage() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)
  const [mensagens, setMensagens] = useState([])
  const [selectedMensagem, setSelectedMensagem] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    telegram_chat_id: '',
    limit: '50',
  })
  const [activeFilters, setActiveFilters] = useState({ limit: 50 })

  const token = useMemo(() => getAuthToken(), [])

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  const buildFilterPayload = () => {
    const payload = {}

    if (filters.status.trim()) {
      payload.status = filters.status
    }

    if (filters.telegram_chat_id.trim()) {
      payload.telegram_chat_id = filters.telegram_chat_id.trim()
    }

    const parsedLimit = Number(filters.limit)
    if (Number.isFinite(parsedLimit) && parsedLimit >= 1 && parsedLimit <= 200) {
      payload.limit = parsedLimit
    }

    return payload
  }

  const loadMensagens = async (filterParams = activeFilters) => {
    const data = await listMensagensCampo(token, filterParams)
    setMensagens(normalizeCollection(data, ['items', 'mensagens', 'data']))
  }

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        navigate('/login', { replace: true })
        return
      }

      setIsLoading(true)
      setError('')

      try {
        const meData = await getCurrentUser(token)
        setCurrentUser(meData.user)
        await loadMensagens({ limit: 50 })
      } catch (err) {
        setError(err.message || 'Nao foi possivel carregar mensagens de campo.')
        if (err.status === 401 || err.status === 403) {
          handleLogout()
        }
      } finally {
        setIsLoading(false)
      }
    }

    bootstrap()
  }, [token, navigate])

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleApplyFilters = async () => {
    setError('')
    setSuccess('')

    const payload = buildFilterPayload()
    setActiveFilters(payload)

    try {
      await loadMensagens(payload)
      setSuccess('Filtros aplicados com sucesso.')
    } catch (err) {
      setError(err.message || 'Nao foi possivel aplicar filtros.')
    }
  }

  const handleClearFilters = async () => {
    setError('')
    setSuccess('')

    const defaultFilters = {
      status: '',
      telegram_chat_id: '',
      limit: '50',
    }

    setFilters(defaultFilters)
    setActiveFilters({ limit: 50 })

    try {
      await loadMensagens({ limit: 50 })
      setSuccess('Filtros limpos com sucesso.')
    } catch (err) {
      setError(err.message || 'Nao foi possivel limpar filtros.')
    }
  }

  const handleOpenDetail = async (mensagemId) => {
    if (!mensagemId) {
      return
    }

    setError('')
    setIsLoadingDetail(true)

    try {
      const data = await getMensagemCampoById(token, mensagemId)
      setSelectedMensagem(normalizeEntity(data, ['mensagem', 'item', 'data']))
    } catch (err) {
      setError(err.message || 'Nao foi possivel carregar o detalhe da mensagem.')
    } finally {
      setIsLoadingDetail(false)
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
              <h1 className="mt-1 font-display text-3xl font-extrabold text-stone-900">Mensagens de campo</h1>
            </div>
            <div className="rounded-xl bg-stone-100 px-4 py-2 text-sm text-stone-700">
              {currentUser ? `${currentUser.nome} (${currentUser.nivel_acesso})` : 'Carregando usuario...'}
            </div>
          </header>

          {error && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          {success && (
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </p>
          )}

          {isLoading ? (
            <div className="mt-8 flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
              <LoaderCircle size={16} className="animate-spin" />
              Carregando mensagens de campo...
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              <section className="rounded-2xl border border-stone-200 bg-white p-4">
                <h2 className="font-display text-lg font-bold text-stone-900">Filtros</h2>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-stone-600">Status</span>
                    <select
                      value={filters.status}
                      onChange={(event) => handleFilterChange('status', event.target.value)}
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                    >
                      <option value="">Todos</option>
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-1 block text-xs font-semibold text-stone-600">Telegram chat id</span>
                    <input
                      value={filters.telegram_chat_id}
                      onChange={(event) => handleFilterChange('telegram_chat_id', event.target.value)}
                      placeholder="Ex.: 1751541108"
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-stone-600">Limite (1..200)</span>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={filters.limit}
                      onChange={(event) => handleFilterChange('limit', event.target.value)}
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                    />
                  </label>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApplyFilters}
                    className="rounded-xl bg-[#1C1917] px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
                  >
                    Aplicar
                  </button>
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
                  >
                    Limpar
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                    <thead>
                      <tr className="text-left text-stone-500">
                        <th className="px-3 py-2">ID</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Telegram</th>
                        <th className="px-3 py-2">Criado em</th>
                        <th className="px-3 py-2">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mensagens.map((mensagem) => {
                        const mensagemId = getEntityId(mensagem, ['id', 'mensagem_id', 'uuid'])

                        return (
                          <tr key={String(mensagemId)} className="rounded-xl bg-[#F5F5F4] text-stone-700">
                            <td className="rounded-l-xl px-3 py-2 font-mono text-xs">{mensagemId || '-'}</td>
                            <td className="px-3 py-2">{mensagem.status || '-'}</td>
                            <td className="px-3 py-2">{mensagem.telegram_chat_id || '-'}</td>
                            <td className="px-3 py-2">{formatDateTime(mensagem.created_at)}</td>
                            <td className="rounded-r-xl px-3 py-2">
                              <button
                                type="button"
                                onClick={() => handleOpenDetail(mensagemId)}
                                disabled={!mensagemId || isLoadingDetail}
                                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isLoadingDetail ? <LoaderCircle size={14} className="animate-spin" /> : <Eye size={14} />}
                                Detalhes
                              </button>
                            </td>
                          </tr>
                        )
                      })}

                      {mensagens.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-3 py-8 text-center text-stone-500">
                            Nenhuma mensagem encontrada.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-2xl border border-stone-200 bg-white p-4">
                <h2 className="font-display text-lg font-bold text-stone-900">Detalhe da mensagem</h2>

                {!selectedMensagem && (
                  <p className="mt-2 text-sm text-stone-600">Selecione uma mensagem para visualizar o detalhe completo.</p>
                )}

                {selectedMensagem && (
                  <pre className="mt-3 max-h-[420px] overflow-auto rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs text-stone-700">
                    {JSON.stringify(selectedMensagem, null, 2)}
                  </pre>
                )}
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default MensagensCampoPage
