import { Download, Eye, LoaderCircle, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardShell from '../components/DashboardShell'
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

function parseDiasPeriodo(payload) {
  if (!payload) {
    return []
  }

  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload?.dias)) {
    return payload.dias
  }

  if (Array.isArray(payload?.items)) {
    return payload.items
  }

  if (Array.isArray(payload?.data)) {
    return payload.data
  }

  return []
}

function extractRegistrosFromObject(source) {
  if (!source || typeof source !== 'object') {
    return []
  }

  const candidates = [source.registros, source.items, source.data]
  const found = candidates.find((entry) => Array.isArray(entry))
  return found || []
}

function buildDiaRecords(payload) {
  if (!payload) {
    return []
  }

  return extractRegistrosFromObject(payload).map((registro, index) => ({
    ...registro,
    __result_key: `dia-${registro?.id || registro?.registro_id || index}`,
    __result_data: payload?.data || '-',
    __result_frente: payload?.frente_nome || payload?.frente_servico_id || '-',
  }))
}

function buildPeriodoRecords(payload) {
  const dias = parseDiasPeriodo(payload)

  return dias.flatMap((dia, dayIndex) =>
    extractRegistrosFromObject(dia).map((registro, recordIndex) => ({
      ...registro,
      __result_key: `periodo-${dia?.data || dayIndex}-${registro?.id || registro?.registro_id || recordIndex}`,
      __result_data: dia?.data || '-',
      __result_frente: dia?.frente_nome || dia?.frente_servico_id || '-',
    }))
  )
}

function formatRecordDate(value) {
  if (!value) {
    return '-'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return String(value)
  }

  return parsed.toLocaleString('pt-BR')
}

function recordDescription(record) {
  return (
    record?.descricao ||
    record?.description ||
    record?.observacao ||
    record?.raw_text ||
    record?.texto ||
    'Sem descricao informada.'
  )
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
  const [queryType, setQueryType] = useState('dia')
  const [hasSearchedDia, setHasSearchedDia] = useState(false)
  const [hasSearchedPeriodo, setHasSearchedPeriodo] = useState(false)

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
      setHasSearchedDia(true)
      if (showSuccess) {
        setSuccess('Diario do dia carregado com sucesso.')
      }
    } catch (err) {
      setHasSearchedDia(true)
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
      setHasSearchedPeriodo(true)
      if (showSuccess) {
        setSuccess('Relatorio de periodo carregado com sucesso.')
      }
    } catch (err) {
      setHasSearchedPeriodo(true)
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

  const resultadoConsultado = queryType === 'dia' ? hasSearchedDia : hasSearchedPeriodo
  const resultadoRegistros = useMemo(() => {
    if (queryType === 'dia') {
      return buildDiaRecords(diarioDia)
    }

    return buildPeriodoRecords(diarioPeriodo)
  }, [queryType, diarioDia, diarioPeriodo])

  return (
    <DashboardShell user={currentUser} onLogout={handleLogout}>
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
                  <h2 className="font-display text-xl font-bold text-stone-900">Filtros da consulta</h2>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-stone-600">Tipo de consulta</span>
                    <select
                      value={queryType}
                      onChange={(event) => {
                        setQueryType(event.target.value)
                        setError('')
                        setSuccess('')
                      }}
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                    >
                      <option value="dia">Por dia</option>
                      <option value="periodo">Por periodo</option>
                    </select>
                  </label>
                </div>

                {queryType === 'dia' ? (
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
                ) : (
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
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => (queryType === 'dia' ? handleLoadDia(true) : handleLoadPeriodo(true))}
                    disabled={queryType === 'dia' ? isLoadingDia : isLoadingPeriodo}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#1C1917] px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {(queryType === 'dia' ? isLoadingDia : isLoadingPeriodo) ? (
                      <LoaderCircle size={14} className="animate-spin" />
                    ) : (
                      <Search size={14} />
                    )}
                    {queryType === 'dia' ? 'Buscar dia' : 'Buscar periodo'}
                  </button>

                  {queryType === 'dia' && diarioDia && (
                    <button
                      type="button"
                      onClick={() => handleVisualizarLaudo('dia')}
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      <Eye size={14} />
                      Visualizar
                    </button>
                  )}

                  {queryType === 'periodo' && diarioPeriodo && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleVisualizarLaudo('periodo')}
                        className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        <Eye size={14} />
                        Visualizar
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
                    </>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display text-xl font-bold text-stone-900">Resultado da consulta</h2>
                  <span className="text-xs text-stone-600">
                    Estado: {resultadoConsultado ? `${resultadoRegistros.length} registro(s)` : 'aguardando consulta'}
                  </span>
                </div>

                {!resultadoConsultado ? (
                  <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
                    Selecione os filtros e clique em Buscar para listar os registros.
                  </div>
                ) : resultadoRegistros.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Nenhum registro encontrado para os filtros informados.
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3">
                    {resultadoRegistros.map((registro, index) => {
                      const idRegistro = registro?.id || registro?.registro_id || `registro-${index + 1}`

                      return (
                        <article key={registro.__result_key} className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Registro</p>
                              <h3 className="mt-1 font-display text-lg font-bold text-stone-900">#{idRegistro}</h3>
                            </div>
                            <div className="text-right text-xs text-stone-600">
                              <p>Data da consulta: {registro.__result_data}</p>
                              <p>Frente: {registro.__result_frente}</p>
                              <p>Criado em: {formatRecordDate(registro?.created_at || registro?.data)}</p>
                            </div>
                          </div>

                          <div className="mt-3 text-sm text-stone-700">
                            <p>
                              Resultado: <span className="font-semibold">{registro?.resultado ?? '-'}</span> | Estaca:{' '}
                              <span className="font-semibold">{registro?.estaca_inicial ?? '-'}</span> -{' '}
                              <span className="font-semibold">{registro?.estaca_final ?? '-'}</span>
                            </p>
                            <p className="mt-1 text-xs text-stone-600">
                              Registrador: {registro?.usuario_nome || registro?.registrador_nome || '-'}
                            </p>
                            <p className="mt-2 text-xs text-stone-600">Observacao: {recordDescription(registro)}</p>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </section>
            </div>
          )}
    </DashboardShell>
  )
}

export default DiarioObraPage
