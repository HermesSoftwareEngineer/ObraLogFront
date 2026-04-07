import { Download, Eye, LoaderCircle, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardSidebar from '../components/DashboardSidebar'
import { getCurrentUser } from '../services/authService'
import { clearAuthSession, getAuthToken } from '../services/authStorage'
import {
  exportarDiarioPeriodo,
  getDiarioDia,
  getDiarioPeriodo,
  listDiarioFrentes,
} from '../services/diarioService'

const REPORT_STORAGE_KEY = 'diario_visualizacao_payload'

function normalizeFrentes(data) {
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.frentes)) {
    return data.frentes
  }

  if (Array.isArray(data?.frentes_servico)) {
    return data.frentes_servico
  }

  if (Array.isArray(data?.items)) {
    return data.items
  }

  if (Array.isArray(data?.data)) {
    return data.data
  }

  return []
}

function toIsoDate(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 10)
}

function DiarioObraPage() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)
  const [frentes, setFrentes] = useState([])
  const [diarioDia, setDiarioDia] = useState(null)
  const [diarioPeriodo, setDiarioPeriodo] = useState(null)
  const [dayFilter, setDayFilter] = useState({
    data: toIsoDate(new Date()),
    frente_servico_id: '',
  })
  const [periodFilter, setPeriodFilter] = useState({
    data_inicio: toIsoDate(new Date(new Date().setDate(new Date().getDate() - 7))),
    data_fim: toIsoDate(new Date()),
    frente_servico_id: '',
    usuario_id: '',
    apenas_impraticaveis: false,
  })
  const [isLoadingPage, setIsLoadingPage] = useState(true)
  const [isLoadingDia, setIsLoadingDia] = useState(false)
  const [isLoadingPeriodo, setIsLoadingPeriodo] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const token = useMemo(() => getAuthToken(), [])

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  const buildDayPayload = () => {
    const payload = {
      data: dayFilter.data,
    }

    if (dayFilter.frente_servico_id.trim()) {
      payload.frente_servico_id = Number(dayFilter.frente_servico_id)
    }

    return payload
  }

  const buildPeriodPayload = () => {
    const payload = {
      data_inicio: periodFilter.data_inicio,
      data_fim: periodFilter.data_fim,
      apenas_impraticaveis: Boolean(periodFilter.apenas_impraticaveis),
    }

    if (periodFilter.frente_servico_id.trim()) {
      payload.frente_servico_id = Number(periodFilter.frente_servico_id)
    }

    if (periodFilter.usuario_id.trim()) {
      payload.usuario_id = Number(periodFilter.usuario_id)
    }

    return payload
  }

  const validatePeriodFilters = () => {
    if (!periodFilter.data_inicio || !periodFilter.data_fim) {
      return 'Preencha data_inicio e data_fim.'
    }

    const startDate = new Date(periodFilter.data_inicio)
    const endDate = new Date(periodFilter.data_fim)

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return 'Datas invalidas para o periodo.'
    }

    if (endDate < startDate) {
      return 'data_fim nao pode ser anterior a data_inicio.'
    }

    const diffInDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24))
    if (diffInDays > 365) {
      return 'Periodo maximo permitido e de 365 dias.'
    }

    return ''
  }

  const handleLoadDia = async (showSuccess = false) => {
    if (!dayFilter.data) {
      setError('Informe a data para buscar o diario do dia.')
      return
    }

    setError('')
    setSuccess('')
    setIsLoadingDia(true)

    try {
      const payload = buildDayPayload()
      const data = await getDiarioDia(token, payload)
      setDiarioDia(data)
      if (showSuccess) {
        setSuccess('Diario do dia carregado com sucesso.')
      }
    } catch (err) {
      if (err.status === 404) {
        setDiarioDia(null)
        setError('Nenhum registro encontrado para os filtros do diario do dia.')
      } else {
        setError(err.message || 'Nao foi possivel carregar o diario do dia.')
      }
    } finally {
      setIsLoadingDia(false)
    }
  }

  const handleLoadPeriodo = async (showSuccess = false) => {
    const validationError = validatePeriodFilters()
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setSuccess('')
    setIsLoadingPeriodo(true)

    try {
      const payload = buildPeriodPayload()
      const data = await getDiarioPeriodo(token, payload)
      setDiarioPeriodo(data)
      if (showSuccess) {
        setSuccess('Relatorio de periodo carregado com sucesso.')
      }
    } catch (err) {
      if (err.status === 404) {
        setDiarioPeriodo(null)
        setError('Nenhum registro encontrado para os filtros do periodo.')
      } else {
        setError(err.message || 'Nao foi possivel carregar o diario do periodo.')
      }
    } finally {
      setIsLoadingPeriodo(false)
    }
  }

  const handleExportPeriodo = async () => {
    const validationError = validatePeriodFilters()
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setSuccess('')
    setIsExporting(true)

    try {
      const payload = buildPeriodPayload()
      const data = await exportarDiarioPeriodo(token, payload)
      const fileName = `diario_${payload.data_inicio.replaceAll('-', '')}_${payload.data_fim.replaceAll('-', '')}.json`
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = fileName
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(url)
      setSuccess('Exportacao JSON concluida com sucesso.')
    } catch (err) {
      setError(err.message || 'Nao foi possivel exportar o diario.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleVisualizarLaudo = (tipo) => {
    const payload = tipo === 'periodo' ? diarioPeriodo : diarioDia

    if (!payload) {
      setError('Nao ha dados para visualizar. Faca uma consulta antes.')
      return
    }

    const filtros = tipo === 'periodo' ? buildPeriodPayload() : buildDayPayload()

    const reportPayload = {
      tipo,
      payload,
      filtros,
      generatedAt: new Date().toISOString(),
      usuario: currentUser,
    }

    sessionStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(reportPayload))
    navigate('/dashboard/diario-obra/visualizar')
  }

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        navigate('/login', { replace: true })
        return
      }

      setIsLoadingPage(true)
      setError('')

      try {
        const [meData, frentesData] = await Promise.all([
          getCurrentUser(token),
          listDiarioFrentes(token),
        ])

        setCurrentUser(meData.user)
        setFrentes(normalizeFrentes(frentesData))
        await Promise.all([handleLoadDia(false), handleLoadPeriodo(false)])
      } catch (err) {
        setError(err.message || 'Nao foi possivel carregar a pagina de diario de obra.')
        if (err.status === 401 || err.status === 403) {
          handleLogout()
        }
      } finally {
        setIsLoadingPage(false)
      }
    }

    bootstrap()
  }, [token, navigate])

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-[#292524]">
      <div className="mx-auto flex max-w-7xl gap-4 p-4 sm:p-6 lg:gap-6 lg:p-8">
        <DashboardSidebar user={currentUser} onLogout={handleLogout} />

        <main className="w-full rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#F97316]">Relatorios</p>
              <h1 className="mt-1 font-display text-3xl font-extrabold text-stone-900">Diario de obra</h1>
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

          {isLoadingPage && (
            <div className="mt-10 flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
              <LoaderCircle size={16} className="animate-spin" />
              Carregando diarios...
            </div>
          )}

          {!isLoadingPage && (
            <div className="mt-8 grid gap-6">
              <section className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-xl font-bold text-stone-900">Consulta por dia</h2>
                  <div className="flex items-center gap-2">
                    {diarioDia && (
                      <button
                        type="button"
                        onClick={() => handleVisualizarLaudo('dia')}
                        className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        <Eye size={14} />
                        Visualizar
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleLoadDia(true)}
                      disabled={isLoadingDia}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#1C1917] px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isLoadingDia ? <LoaderCircle size={14} className="animate-spin" /> : <Search size={14} />}
                      Buscar dia
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-stone-600">Data *</span>
                    <input
                      type="date"
                      value={dayFilter.data}
                      onChange={(event) => setDayFilter((prev) => ({ ...prev, data: event.target.value }))}
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-stone-600">Frente (opcional)</span>
                    <select
                      value={dayFilter.frente_servico_id}
                      onChange={(event) =>
                        setDayFilter((prev) => ({ ...prev, frente_servico_id: event.target.value }))
                      }
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                    >
                      <option value="">Todas as frentes</option>
                      {frentes.map((frente) => (
                        <option key={frente.id} value={frente.id}>
                          {frente.nome || `Frente #${frente.id}`}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Resultado do dia</p>
                  {diarioDia ? (
                    <div className="mt-2 rounded-lg bg-white p-3 text-sm text-stone-700">
                      Consulta concluida. Clique em <span className="font-semibold">Visualizar</span> para abrir o laudo completo.
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-stone-600">Sem dados carregados para o dia selecionado.</p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-xl font-bold text-stone-900">Consulta por periodo</h2>
                  <div className="flex items-center gap-2">
                    {diarioPeriodo && (
                      <button
                        type="button"
                        onClick={() => handleVisualizarLaudo('periodo')}
                        className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        <Eye size={14} />
                        Visualizar
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleLoadPeriodo(true)}
                      disabled={isLoadingPeriodo}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#1C1917] px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isLoadingPeriodo ? (
                        <LoaderCircle size={14} className="animate-spin" />
                      ) : (
                        <Search size={14} />
                      )}
                      Buscar periodo
                    </button>

                    <button
                      type="button"
                      onClick={handleExportPeriodo}
                      disabled={isExporting}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isExporting ? (
                        <LoaderCircle size={14} className="animate-spin" />
                      ) : (
                        <Download size={14} />
                      )}
                      Exportar JSON
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-stone-600">Data inicio *</span>
                    <input
                      type="date"
                      value={periodFilter.data_inicio}
                      onChange={(event) =>
                        setPeriodFilter((prev) => ({ ...prev, data_inicio: event.target.value }))
                      }
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-stone-600">Data fim *</span>
                    <input
                      type="date"
                      value={periodFilter.data_fim}
                      onChange={(event) =>
                        setPeriodFilter((prev) => ({ ...prev, data_fim: event.target.value }))
                      }
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-stone-600">Frente (opcional)</span>
                    <select
                      value={periodFilter.frente_servico_id}
                      onChange={(event) =>
                        setPeriodFilter((prev) => ({ ...prev, frente_servico_id: event.target.value }))
                      }
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                    >
                      <option value="">Todas as frentes</option>
                      {frentes.map((frente) => (
                        <option key={frente.id} value={frente.id}>
                          {frente.nome || `Frente #${frente.id}`}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-stone-600">Usuario ID (opcional)</span>
                    <input
                      type="number"
                      min="1"
                      value={periodFilter.usuario_id}
                      onChange={(event) =>
                        setPeriodFilter((prev) => ({ ...prev, usuario_id: event.target.value }))
                      }
                      placeholder="Ex.: 3"
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                    />
                  </label>

                  <label className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-stone-700">
                    <input
                      type="checkbox"
                      checked={periodFilter.apenas_impraticaveis}
                      onChange={(event) =>
                        setPeriodFilter((prev) => ({ ...prev, apenas_impraticaveis: event.target.checked }))
                      }
                      className="h-4 w-4 rounded border-stone-300 text-[#F97316] focus:ring-orange-200"
                    />
                    Apenas impraticaveis
                  </label>
                </div>

                <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Resumo do periodo</p>
                    <span className="text-xs text-stone-600">Estado: {diarioPeriodo ? 'consulta pronta' : 'sem dados'}</span>
                  </div>

                  <div className="mt-2 rounded-lg bg-white p-3 text-sm text-stone-700">
                    {diarioPeriodo
                      ? 'Consulta concluida. Clique em Visualizar para abrir o laudo completo do periodo.'
                      : 'Sem dados carregados para o periodo selecionado.'}
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default DiarioObraPage
