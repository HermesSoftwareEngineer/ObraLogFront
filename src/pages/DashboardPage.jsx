import {
  Activity,
  AlertTriangle,
  HardHat,
  LoaderCircle,
  MessageSquareWarning,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import DashboardShell from '../components/DashboardShell'
import { getCurrentUser, linkTelegramChatId } from '../services/authService'
import { clearAuthSession, getAuthToken, getStoredUser } from '../services/authStorage'
import {
  getDashboardAlertas,
  getDashboardEquipe,
  getDashboardOverview,
  getDashboardProducao,
} from '../services/dashboardService'

const PIE_COLORS = ['#1D4ED8', '#2563EB', '#60A5FA', '#93C5FD', '#BFDBFE']

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function formatDate(value) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date)
}

function formatNumber(value, maxFractionDigits = 2) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: maxFractionDigits }).format(toNumber(value))
}

function compactDateLabel(value) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
}

function normalizePieFromObject(data = {}) {
  return Object.entries(data || {}).map(([name, value]) => ({ name, value: toNumber(value) }))
}

function Panel({ title, subtitle, right, children, className = '' }) {
  return (
    <section className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`.trim()}>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {right}
      </header>
      {children}
    </section>
  )
}

function KpiCard({ icon: Icon, label, value, tone = 'blue' }) {
  const toneClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  }

  return (
    <article className={`rounded-2xl border p-4 ${toneClasses[tone] || toneClasses.slate}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
        <Icon size={16} />
      </div>
      <p className="mt-3 text-2xl font-black text-slate-900">{value}</p>
    </article>
  )
}

function FilterField({ label, children }) {
  return (
    <label className="space-y-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function ChartBox({ title, children }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="mb-3 text-sm font-bold text-slate-800">{title}</h3>
      <div className="h-64 w-full">{children}</div>
    </article>
  )
}

function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(getStoredUser())

  const [overview, setOverview] = useState(null)
  const [alertas, setAlertas] = useState(null)
  const [equipe, setEquipe] = useState(null)
  const [producao, setProducao] = useState(null)

  const [isLoadingOverview, setIsLoadingOverview] = useState(true)
  const [isLoadingAlertas, setIsLoadingAlertas] = useState(true)
  const [isLoadingEquipe, setIsLoadingEquipe] = useState(true)
  const [isLoadingProducao, setIsLoadingProducao] = useState(false)

  const [errorOverview, setErrorOverview] = useState('')
  const [errorAlertas, setErrorAlertas] = useState('')
  const [errorEquipe, setErrorEquipe] = useState('')
  const [errorProducao, setErrorProducao] = useState('')

  const [telegramChatId, setTelegramChatId] = useState('')
  const [telegramLinkError, setTelegramLinkError] = useState('')
  const [telegramLinkSuccess, setTelegramLinkSuccess] = useState('')
  const [isLinkingTelegramChat, setIsLinkingTelegramChat] = useState(false)

  const [overviewFilters, setOverviewFilters] = useState({ days: '30', obra_id: '' })
  const [alertasFilters, setAlertasFilters] = useState({ days: '30', obra_id: '' })
  const [equipeFilters, setEquipeFilters] = useState({ days: '30' })
  const [producaoFilters, setProducaoFilters] = useState({
    data_inicio: '',
    data_fim: '',
    frente_id: '',
    obra_id: '',
  })

  const token = useMemo(() => getAuthToken(), [])

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  const buildOptionalQuery = (filters) => {
    const query = {}

    Object.entries(filters).forEach(([key, value]) => {
      if (value === '') {
        return
      }

      query[key] = value
    })

    return query
  }

  const loadOverview = async () => {
    setIsLoadingOverview(true)
    setErrorOverview('')

    try {
      const data = await getDashboardOverview(token, buildOptionalQuery(overviewFilters))
      setOverview(data)
    } catch (err) {
      setErrorOverview(err.message || 'Nao foi possivel carregar o overview do dashboard.')
      if (err.status === 401 || err.status === 403) {
        handleLogout()
      }
    } finally {
      setIsLoadingOverview(false)
    }
  }

  const loadAlertas = async () => {
    setIsLoadingAlertas(true)
    setErrorAlertas('')

    try {
      const data = await getDashboardAlertas(token, buildOptionalQuery(alertasFilters))
      setAlertas(data)
    } catch (err) {
      setErrorAlertas(err.message || 'Nao foi possivel carregar os dados de alertas.')
      if (err.status === 401 || err.status === 403) {
        handleLogout()
      }
    } finally {
      setIsLoadingAlertas(false)
    }
  }

  const loadEquipe = async () => {
    setIsLoadingEquipe(true)
    setErrorEquipe('')

    try {
      const data = await getDashboardEquipe(token, buildOptionalQuery(equipeFilters))
      setEquipe(data)
    } catch (err) {
      setErrorEquipe(err.message || 'Nao foi possivel carregar os dados de equipe.')
      if (err.status === 401 || err.status === 403) {
        handleLogout()
      }
    } finally {
      setIsLoadingEquipe(false)
    }
  }

  const handleOverviewFilterChange = (field, value) => {
    setOverviewFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleAlertasFilterChange = (field, value) => {
    setAlertasFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleEquipeFilterChange = (field, value) => {
    setEquipeFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleProducaoFilterChange = (field, value) => {
    setProducaoFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmitProducao = async (event) => {
    event.preventDefault()

    if (!producaoFilters.data_inicio || !producaoFilters.data_fim) {
      setErrorProducao('Informe data inicial e data final para consultar producao.')
      return
    }

    setIsLoadingProducao(true)
    setErrorProducao('')

    try {
      const data = await getDashboardProducao(token, buildOptionalQuery(producaoFilters))
      setProducao(data)
    } catch (err) {
      setErrorProducao(err.message || 'Nao foi possivel carregar os dados de producao.')
      if (err.status === 401 || err.status === 403) {
        handleLogout()
      }
    } finally {
      setIsLoadingProducao(false)
    }
  }

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        navigate('/login', { replace: true })
        return
      }

      try {
        const meData = await getCurrentUser(token)
        setUser(meData.user)
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
          handleLogout()
        }
      }

      await Promise.all([loadOverview(), loadAlertas(), loadEquipe()])
    }

    bootstrap()
  }, [navigate, token])

  const handleLinkTelegram = async (event) => {
    event.preventDefault()

    if (!token) {
      return
    }

    setTelegramLinkError('')
    setTelegramLinkSuccess('')
    setIsLinkingTelegramChat(true)

    try {
      const data = await linkTelegramChatId(token, telegramChatId.trim())
      setUser(data.user)
      setTelegramLinkSuccess('Telegram vinculado com sucesso.')
      setTelegramChatId('')
    } catch (err) {
      setTelegramLinkError(err.message || 'Nao foi possivel vincular o Telegram.')
    } finally {
      setIsLinkingTelegramChat(false)
    }
  }

  const serieOverview = (overview?.charts?.serie_diaria || []).map((item) => ({
    ...item,
    label: compactDateLabel(item.date),
  }))

  const topEncarregadosOverview = overview?.charts?.top_encarregados || []
  const progressoPorFrente = overview?.charts?.progresso_por_frente || []

  const severidadePieOverview = normalizePieFromObject(overview?.charts?.alertas_por_severidade)
  const statusPieOverview = normalizePieFromObject(overview?.charts?.alertas_por_status)

  const alertasSerie = (alertas?.charts?.serie_diaria || []).map((item) => ({
    ...item,
    label: compactDateLabel(item.date),
  }))
  const alertasPorTipo = alertas?.charts?.por_tipo || []

  const equipeRanking = equipe?.charts?.ranking_encarregados || []
  const equipeAtividadeSemana = equipe?.charts?.atividade_por_dia_semana || []

  const producaoAcumulado = (producao?.charts?.progresso_acumulado || []).map((item) => ({
    ...item,
    label: compactDateLabel(item.date),
  }))

  const producaoPorFrente = producao?.charts?.por_frente || []
  const climaManhaPie = normalizePieFromObject(producao?.charts?.clima_manha)
  const climaTardePie = normalizePieFromObject(producao?.charts?.clima_tarde)

  return (
    <DashboardShell user={user} onLogout={handleLogout}>
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900 p-6 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute -left-10 -top-10 h-44 w-44 rounded-full bg-blue-400 blur-3xl" />
          <div className="absolute -bottom-14 right-0 h-48 w-48 rounded-full bg-cyan-300 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">Painel inteligente</p>
            <h1 className="mt-3 font-display text-4xl font-black leading-tight">Dashboard Operacional</h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-100/90">
              Visao consolidada da obra com produtividade, alertas e desempenho da equipe em tempo real.
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm backdrop-blur">
            {user ? `Bem-vindo, ${user.nome}` : 'Carregando usuario...'}
          </div>
        </div>
      </section>

      <Panel
        title="Overview"
        subtitle={`Periodo: ${overview?.periodo?.inicio || '-'} a ${overview?.periodo?.fim || '-'} (${overview?.periodo?.days || 0} dias)`}
        className="mt-6"
        right={
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              loadOverview()
            }}
          >
            <FilterField label="Dias">
              <input
                type="number"
                min={7}
                max={365}
                value={overviewFilters.days}
                onChange={(event) => handleOverviewFilterChange('days', event.target.value)}
                className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
              />
            </FilterField>
            <FilterField label="Obra ID">
              <input
                value={overviewFilters.obra_id}
                onChange={(event) => handleOverviewFilterChange('obra_id', event.target.value)}
                className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
              />
            </FilterField>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              Atualizar
            </button>
          </form>
        }
      >
        {isLoadingOverview && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <LoaderCircle size={14} className="animate-spin" />
            Carregando overview...
          </div>
        )}

        {errorOverview && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorOverview}</p>
        )}

        {!isLoadingOverview && !errorOverview && overview && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard icon={Users} label="Usuarios" value={formatNumber(overview.kpis?.usuarios_total, 0)} tone="blue" />
              <KpiCard icon={HardHat} label="Frentes" value={formatNumber(overview.kpis?.frentes_total, 0)} tone="emerald" />
              <KpiCard
                icon={Activity}
                label="Obras ativas"
                value={formatNumber(overview.kpis?.obras_ativas, 0)}
                tone="amber"
              />
              <KpiCard
                icon={TrendingUp}
                label="Progresso total"
                value={formatNumber(overview.kpis?.progresso_total)}
                tone="slate"
              />
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <ChartBox title="Ritmo diario (registros e progresso)">
                <ResponsiveContainer>
                  <AreaChart data={serieOverview}>
                    <defs>
                      <linearGradient id="gradProgress" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
                    <Tooltip
                      formatter={(value) => formatNumber(value)}
                      contentStyle={{ borderRadius: 12, borderColor: '#CBD5E1' }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      name="Progresso"
                      dataKey="progresso"
                      stroke="#2563EB"
                      fill="url(#gradProgress)"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      name="Registros"
                      dataKey="registros"
                      stroke="#0F172A"
                      strokeWidth={2}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartBox>

              <ChartBox title="Top encarregados por progresso">
                <ResponsiveContainer>
                  <BarChart data={topEncarregadosOverview} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} />
                    <YAxis dataKey="usuario_nome" type="category" width={110} tick={{ fill: '#64748B', fontSize: 11 }} />
                    <Tooltip formatter={(value) => formatNumber(value)} contentStyle={{ borderRadius: 12 }} />
                    <Bar dataKey="progresso" fill="#0EA5E9" radius={[6, 6, 6, 6]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartBox>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-3">
              <ChartBox title="Progresso por frente">
                <ResponsiveContainer>
                  <BarChart data={progressoPorFrente}>
                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                    <XAxis dataKey="frente_nome" tick={{ fill: '#64748B', fontSize: 10 }} interval={0} angle={-15} height={50} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
                    <Tooltip formatter={(value) => formatNumber(value)} contentStyle={{ borderRadius: 12 }} />
                    <Bar dataKey="progresso" fill="#1D4ED8" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartBox>

              <ChartBox title="Alertas por severidade">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={severidadePieOverview} dataKey="value" nameKey="name" innerRadius={55} outerRadius={86}>
                      {severidadePieOverview.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatNumber(value, 0)} contentStyle={{ borderRadius: 12 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartBox>

              <ChartBox title="Alertas por status">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={statusPieOverview} dataKey="value" nameKey="name" innerRadius={55} outerRadius={86}>
                      {statusPieOverview.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatNumber(value, 0)} contentStyle={{ borderRadius: 12 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartBox>
            </div>
          </>
        )}
      </Panel>

      <Panel
        title="Alertas"
        subtitle="Taxa de resolucao, volume diario e tipologias de ocorrencia"
        className="mt-6"
        right={
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              loadAlertas()
            }}
          >
            <FilterField label="Dias">
              <input
                type="number"
                min={7}
                max={365}
                value={alertasFilters.days}
                onChange={(event) => handleAlertasFilterChange('days', event.target.value)}
                className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
              />
            </FilterField>
            <FilterField label="Obra ID">
              <input
                value={alertasFilters.obra_id}
                onChange={(event) => handleAlertasFilterChange('obra_id', event.target.value)}
                className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
              />
            </FilterField>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              Atualizar
            </button>
          </form>
        }
      >
        {isLoadingAlertas && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <LoaderCircle size={14} className="animate-spin" />
            Carregando alertas...
          </div>
        )}

        {errorAlertas && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorAlertas}</p>
        )}

        {!isLoadingAlertas && !errorAlertas && alertas && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <KpiCard icon={AlertTriangle} label="Total periodo" value={formatNumber(alertas.kpis?.total_periodo, 0)} tone="blue" />
              <KpiCard icon={UserCheck} label="Resolvidos" value={formatNumber(alertas.kpis?.resolvidos_periodo, 0)} tone="emerald" />
              <KpiCard
                icon={TrendingUp}
                label="Taxa resolucao"
                value={`${formatNumber(alertas.kpis?.taxa_resolucao_pct)}%`}
                tone="slate"
              />
              <KpiCard
                icon={Activity}
                label="Tempo medio (h)"
                value={formatNumber(alertas.kpis?.tempo_medio_resolucao_horas)}
                tone="amber"
              />
              <KpiCard
                icon={MessageSquareWarning}
                label="Criticos abertos"
                value={formatNumber(alertas.kpis?.abertos_criticos_atual, 0)}
                tone="rose"
              />
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <ChartBox title="Serie diaria de alertas">
                <ResponsiveContainer>
                  <LineChart data={alertasSerie}>
                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
                    <Tooltip formatter={(value) => formatNumber(value, 0)} contentStyle={{ borderRadius: 12 }} />
                    <Legend />
                    <Line type="monotone" dataKey="total" name="Total" stroke="#1D4ED8" strokeWidth={2} dot={false} />
                    <Line
                      type="monotone"
                      dataKey="resolvidos"
                      name="Resolvidos"
                      stroke="#0F766E"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartBox>

              <ChartBox title="Alertas por tipo">
                <ResponsiveContainer>
                  <BarChart data={alertasPorTipo}>
                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                    <XAxis dataKey="tipo" tick={{ fill: '#64748B', fontSize: 10 }} interval={0} angle={-10} height={40} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
                    <Tooltip formatter={(value) => formatNumber(value, 0)} contentStyle={{ borderRadius: 12 }} />
                    <Bar dataKey="total" fill="#0F172A" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartBox>
            </div>
          </>
        )}
      </Panel>

      <Panel
        title="Equipe"
        subtitle="Capacidade da equipe, atividade e ranking por produtividade"
        className="mt-6"
        right={
          <form
            className="flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              loadEquipe()
            }}
          >
            <FilterField label="Dias">
              <input
                type="number"
                min={7}
                max={365}
                value={equipeFilters.days}
                onChange={(event) => handleEquipeFilterChange('days', event.target.value)}
                className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
              />
            </FilterField>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              Atualizar
            </button>
          </form>
        }
      >
        {isLoadingEquipe && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <LoaderCircle size={14} className="animate-spin" />
            Carregando equipe...
          </div>
        )}

        {errorEquipe && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorEquipe}</p>
        )}

        {!isLoadingEquipe && !errorEquipe && equipe && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard icon={Users} label="Total usuarios" value={formatNumber(equipe.kpis?.total_usuarios, 0)} tone="blue" />
              <KpiCard
                icon={UserCheck}
                label="Telegram vinculado"
                value={formatNumber(equipe.kpis?.com_telegram_vinculado, 0)}
                tone="emerald"
              />
              <KpiCard
                icon={TrendingUp}
                label="Percentual vinculado"
                value={`${formatNumber(equipe.kpis?.pct_telegram_vinculado)}%`}
                tone="amber"
              />
              <KpiCard
                icon={HardHat}
                label="Encarregados"
                value={formatNumber(equipe.kpis?.por_nivel?.encarregado, 0)}
                tone="slate"
              />
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <ChartBox title="Ranking de encarregados">
                <ResponsiveContainer>
                  <BarChart data={equipeRanking} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} />
                    <YAxis dataKey="nome" type="category" width={110} tick={{ fill: '#64748B', fontSize: 11 }} />
                    <Tooltip formatter={(value) => formatNumber(value)} contentStyle={{ borderRadius: 12 }} />
                    <Bar dataKey="progresso" fill="#0284C7" radius={[6, 6, 6, 6]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartBox>

              <ChartBox title="Atividade por dia da semana">
                <ResponsiveContainer>
                  <BarChart data={equipeAtividadeSemana}>
                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                    <XAxis dataKey="nome" tick={{ fill: '#64748B', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
                    <Tooltip formatter={(value) => formatNumber(value)} contentStyle={{ borderRadius: 12 }} />
                    <Legend />
                    <Bar dataKey="registros" name="Registros" fill="#334155" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="progresso" name="Progresso" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartBox>
            </div>
          </>
        )}
      </Panel>

      <Panel title="Producao" subtitle="Analise detalhada com progresso acumulado e clima" className="mt-6">
        <form onSubmit={handleSubmitProducao} className="grid gap-3 md:grid-cols-5">
          <FilterField label="Data inicio">
            <input
              type="date"
              value={producaoFilters.data_inicio}
              onChange={(event) => handleProducaoFilterChange('data_inicio', event.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
            />
          </FilterField>

          <FilterField label="Data fim">
            <input
              type="date"
              value={producaoFilters.data_fim}
              onChange={(event) => handleProducaoFilterChange('data_fim', event.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
            />
          </FilterField>

          <FilterField label="Frente ID">
            <input
              value={producaoFilters.frente_id}
              onChange={(event) => handleProducaoFilterChange('frente_id', event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
            />
          </FilterField>

          <FilterField label="Obra ID">
            <input
              value={producaoFilters.obra_id}
              onChange={(event) => handleProducaoFilterChange('obra_id', event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
            />
          </FilterField>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isLoadingProducao}
              className="w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
            >
              {isLoadingProducao ? 'Consultando...' : 'Consultar'}
            </button>
          </div>
        </form>

        {errorProducao && (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorProducao}</p>
        )}

        {producao && !errorProducao && (
          <>
            <p className="mt-4 text-xs text-slate-500">
              Periodo consultado: {formatDate(producao.periodo?.inicio)} a {formatDate(producao.periodo?.fim)}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard icon={Activity} label="Registros" value={formatNumber(producao.resumo?.total_registros, 0)} tone="blue" />
              <KpiCard
                icon={TrendingUp}
                label="Progresso total"
                value={formatNumber(producao.resumo?.progresso_total)}
                tone="emerald"
              />
              <KpiCard
                icon={HardHat}
                label="Dias trabalhados"
                value={formatNumber(producao.resumo?.dias_trabalhados, 0)}
                tone="amber"
              />
              <KpiCard
                icon={AlertTriangle}
                label="Impraticaveis"
                value={formatNumber(producao.resumo?.dias_impraticaveis, 0)}
                tone="rose"
              />
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <ChartBox title="Progresso acumulado">
                <ResponsiveContainer>
                  <LineChart data={producaoAcumulado}>
                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
                    <Tooltip formatter={(value) => formatNumber(value)} contentStyle={{ borderRadius: 12 }} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="progresso_dia"
                      name="Progresso dia"
                      stroke="#0F766E"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="progresso_acumulado"
                      name="Acumulado"
                      stroke="#1D4ED8"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartBox>

              <ChartBox title="Producao por frente">
                <ResponsiveContainer>
                  <BarChart data={producaoPorFrente}>
                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                    <XAxis dataKey="frente_nome" tick={{ fill: '#64748B', fontSize: 10 }} interval={0} angle={-10} height={40} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
                    <Tooltip formatter={(value) => formatNumber(value)} contentStyle={{ borderRadius: 12 }} />
                    <Bar dataKey="progresso" fill="#0F172A" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartBox>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <ChartBox title="Clima manha">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={climaManhaPie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={84}>
                      {climaManhaPie.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatNumber(value, 0)} contentStyle={{ borderRadius: 12 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartBox>

              <ChartBox title="Clima tarde">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={climaTardePie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={84}>
                      {climaTardePie.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatNumber(value, 0)} contentStyle={{ borderRadius: 12 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartBox>
            </div>
          </>
        )}
      </Panel>

      <Panel title="Telegram" subtitle="Vincule um chat para notificacoes operacionais" className="mt-6">
        <form onSubmit={handleLinkTelegram} className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            value={telegramChatId}
            onChange={(event) => setTelegramChatId(event.target.value)}
            placeholder="telegram_chat_id"
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            disabled={isLinkingTelegramChat}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-80"
          >
            {isLinkingTelegramChat && <LoaderCircle size={16} className="animate-spin" />}
            Vincular
          </button>
        </form>

        <p className="mt-3 text-xs text-slate-600">
          Telegram atual: <span className="font-semibold">{user?.telegram_chat_id || 'nao vinculado'}</span>
        </p>

        {telegramLinkError && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{telegramLinkError}</p>
        )}

        {telegramLinkSuccess && (
          <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {telegramLinkSuccess}
          </p>
        )}
      </Panel>
    </DashboardShell>
  )
}

export default DashboardPage
