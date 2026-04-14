import {
  AlertTriangle,
  Bell,
  BellOff,
  Eye,
  LoaderCircle,
  Pencil,
  Plus,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardSidebar from '../components/DashboardSidebar'
import { getCurrentUser } from '../services/authService'
import { clearAuthSession, getAuthToken } from '../services/authStorage'
import {
  createAlerta,
  getAlertaById,
  listAlertas,
  markAlertaAsRead,
  markAlertaAsUnread,
  updateAlertaStatus,
} from '../services/alertasService'

const alertStatuses = ['aberto', 'em_atendimento', 'aguardando_peca', 'resolvido', 'cancelado']
const alertSeverities = ['baixa', 'media', 'alta', 'critica']

function ModalShell({ title, icon, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/55 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl sm:p-6">
        <header className="mb-5 flex items-start justify-between gap-3 sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="font-display text-xl font-bold text-stone-900">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-300 p-1.5 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
            aria-label="Fechar modal"
          >
            <X size={16} />
          </button>
        </header>

        {children}
      </div>
    </div>
  )
}

function normalizeAlertas(data) {
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.alertas)) {
    return data.alertas
  }

  if (Array.isArray(data?.alerts)) {
    return data.alerts
  }

  if (Array.isArray(data?.items)) {
    return data.items
  }

  if (Array.isArray(data?.data)) {
    return data.data
  }

  return []
}

function normalizeAlerta(data) {
  if (data?.alerta) {
    return data.alerta
  }

  if (data?.alert) {
    return data.alert
  }

  if (data?.data) {
    return data.data
  }

  return data
}

function getAlertaId(alerta) {
  return alerta?.id || alerta?.alert_id || alerta?.uuid || alerta?.alert_uuid || null
}

function prettyStatus(status) {
  if (!status) {
    return '-'
  }

  return status.replaceAll('_', ' ')
}

function prettySeverity(severity) {
  if (!severity) {
    return '-'
  }

  return severity
}

function isAlertaRead(alerta) {
  if (!alerta || typeof alerta !== 'object') {
    return false
  }

  const parseReadValue = (value) => {
    if (typeof value === 'boolean') {
      return value
    }

    if (typeof value === 'number') {
      return value === 1
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()
      if (['true', '1', 'sim', 'yes'].includes(normalized)) {
        return true
      }

      if (['false', '0', 'nao', 'não', 'no'].includes(normalized)) {
        return false
      }
    }

    return null
  }

  const directRead = [
    alerta.lido,
    alerta.is_read,
    alerta.read_by_me,
    alerta.lido_por_mim,
  ]
    .map(parseReadValue)
    .find((value) => value !== null)

  if (directRead !== undefined) {
    return directRead ?? false
  }

  if (alerta.read_at || alerta.lido_em || alerta.alert_read_at || alerta.last_read_at) {
    return true
  }

  if (Array.isArray(alerta.alert_reads) && alerta.alert_reads.length > 0) {
    return true
  }

  return false
}

function AlertasPage() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)
  const [alertas, setAlertas] = useState([])
  const [selectedAlerta, setSelectedAlerta] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    type: '',
    severity: 'media',
    title: '',
    description: '',
    telegram_message_id: '',
    raw_text: '',
    location_detail: '',
    equipment_name: '',
    photo_urls: '',
    priority_score: '',
    notified_channels: '',
  })
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    apenas_nao_lidos: false,
  })
  const [activeFilters, setActiveFilters] = useState({})
  const [statusForm, setStatusForm] = useState({
    status: 'aberto',
    resolution_notes: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false)
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false)
  const [markingReadId, setMarkingReadId] = useState(null)
  const [readStateOverrides, setReadStateOverrides] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const token = useMemo(() => getAuthToken(), [])

  const isManagerOrAdmin =
    currentUser?.nivel_acesso === 'administrador' || currentUser?.nivel_acesso === 'gerente'

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  const loadAlertas = async (filterParams = activeFilters) => {
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    const alertasData = await listAlertas(token, filterParams)
    setAlertas(normalizeAlertas(alertasData))
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
        await loadAlertas({})
      } catch (err) {
        setError(err.message || 'Nao foi possivel carregar os alertas.')
        if (err.status === 401 || err.status === 403) {
          handleLogout()
        }
      } finally {
        setIsLoading(false)
      }
    }

    bootstrap()
  }, [token, navigate])

  const handleCreateChange = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const buildFilterPayload = () => {
    const payload = {}

    if (filters.status.trim()) {
      payload.status = filters.status
    }

    if (filters.severity.trim()) {
      payload.severity = filters.severity
    }

    payload.apenas_nao_lidos = Boolean(filters.apenas_nao_lidos)

    return payload
  }

  const handleApplyFilters = async () => {
    setError('')
    const payload = buildFilterPayload()
    setActiveFilters(payload)

    try {
      await loadAlertas(payload)
    } catch (err) {
      setError(err.message || 'Nao foi possivel aplicar os filtros.')
    }
  }

  const handleClearFilters = async () => {
    setError('')
    const emptyFilters = {
      status: '',
      severity: '',
      apenas_nao_lidos: false,
    }
    setFilters(emptyFilters)
    setActiveFilters({})

    try {
      await loadAlertas({})
    } catch (err) {
      setError(err.message || 'Nao foi possivel limpar os filtros.')
    }
  }

  const parseCsvArray = (value) => {
    if (!value || !value.trim()) {
      return []
    }

    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  const handleCreateAlerta = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSubmittingCreate(true)

    try {
      const payload = {
        type: createForm.type.trim(),
        severity: createForm.severity,
        title: createForm.title.trim(),
      }

      if (!payload.type || !payload.title) {
        throw new Error('Preencha os campos obrigatorios: tipo, severidade e titulo.')
      }

      if (createForm.description.trim()) {
        payload.description = createForm.description.trim()
      }

      if (createForm.telegram_message_id.trim()) {
        payload.telegram_message_id = Number(createForm.telegram_message_id)
      }

      if (createForm.raw_text.trim()) {
        payload.raw_text = createForm.raw_text.trim()
      }

      if (createForm.location_detail.trim()) {
        payload.location_detail = createForm.location_detail.trim()
      }

      if (createForm.equipment_name.trim()) {
        payload.equipment_name = createForm.equipment_name.trim()
      }

      const photoUrls = parseCsvArray(createForm.photo_urls)
      if (photoUrls.length > 0) {
        payload.photo_urls = photoUrls
      }

      const channels = parseCsvArray(createForm.notified_channels)
      if (channels.length > 0) {
        payload.notified_channels = channels
      }

      if (createForm.priority_score.trim()) {
        payload.priority_score = Number(createForm.priority_score)
      }

      await createAlerta(token, payload)
      setSuccess('Alerta criado com sucesso.')
      setCreateForm({
        type: '',
        severity: 'media',
        title: '',
        description: '',
        telegram_message_id: '',
        raw_text: '',
        location_detail: '',
        equipment_name: '',
        photo_urls: '',
        priority_score: '',
        notified_channels: '',
      })
      setIsCreateModalOpen(false)
      await loadAlertas(activeFilters)
    } catch (err) {
      setError(err.message || 'Nao foi possivel criar o alerta.')
    } finally {
      setIsSubmittingCreate(false)
    }
  }

  const handleOpenDetails = async (alertId) => {
    if (!alertId) {
      return
    }

    setError('')
    setSuccess('')
    setIsLoadingDetails(true)

    try {
      const data = await getAlertaById(token, alertId)
      const alerta = normalizeAlerta(data)
      setSelectedAlerta(alerta)
      setStatusForm({
        status: alerta?.status || 'aberto',
        resolution_notes: '',
      })
      setIsDetailsModalOpen(true)
    } catch (err) {
      setError(err.message || 'Nao foi possivel carregar os detalhes do alerta.')
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const handleStatusChange = (field, value) => {
    setStatusForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleUpdateStatus = async (event) => {
    event.preventDefault()

    const alertId = getAlertaId(selectedAlerta)
    if (!alertId || !statusForm.status) {
      return
    }

    setError('')
    setSuccess('')
    setIsSubmittingStatus(true)

    try {
      const payload = {
        status: statusForm.status,
      }

      if (statusForm.resolution_notes.trim()) {
        payload.resolution_notes = statusForm.resolution_notes.trim()
      }

      await updateAlertaStatus(token, alertId, payload)
      setSuccess('Status do alerta atualizado com sucesso.')

      const data = await getAlertaById(token, alertId)
      const updatedAlerta = normalizeAlerta(data)
      setSelectedAlerta(updatedAlerta)

      await loadAlertas(activeFilters)
    } catch (err) {
      setError(err.message || 'Nao foi possivel atualizar o status do alerta.')
    } finally {
      setIsSubmittingStatus(false)
    }
  }

  const handleToggleRead = async (alerta) => {
    const alertId = getAlertaId(alerta)
    if (!alertId) {
      return
    }

    const currentOverride = readStateOverrides[String(alertId)]
    const currentlyRead =
      typeof currentOverride === 'boolean' ? currentOverride : isAlertaRead(alerta)
    const nextReadState = !currentlyRead

    setError('')
    setSuccess('')
    setMarkingReadId(alertId)
    setReadStateOverrides((prev) => ({
      ...prev,
      [String(alertId)]: nextReadState,
    }))

    try {
      if (currentlyRead) {
        await markAlertaAsUnread(token, alertId)
      } else {
        await markAlertaAsRead(token, alertId)
      }

      setSuccess(`Alerta marcado como ${currentlyRead ? 'nao lido' : 'lido'}.`)
      await loadAlertas(activeFilters)

      if (getAlertaId(selectedAlerta) === alertId) {
        const data = await getAlertaById(token, alertId)
        setSelectedAlerta(normalizeAlerta(data))
      }
    } catch (err) {
      setReadStateOverrides((prev) => ({
        ...prev,
        [String(alertId)]: currentlyRead,
      }))
      setError(err.message || 'Nao foi possivel atualizar o estado de leitura do alerta.')
    } finally {
      setMarkingReadId(null)
    }
  }

  const getAlertaReadState = (alerta) => {
    const alertId = getAlertaId(alerta)
    if (!alertId) {
      return isAlertaRead(alerta)
    }

    const override = readStateOverrides[String(alertId)]
    if (typeof override === 'boolean') {
      return override
    }

    return isAlertaRead(alerta)
  }

  const formatDate = (date) => {
    if (!date) {
      return '-'
    }

    return new Date(date).toLocaleString('pt-BR')
  }

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-[#292524]">
      <div className="mx-auto flex max-w-7xl gap-4 p-4 sm:p-6 lg:gap-6 lg:p-8">
        <DashboardSidebar user={currentUser} onLogout={handleLogout} />

        <main className="w-full rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#F97316]">Operacao</p>
              <h1 className="mt-1 font-display text-3xl font-extrabold text-stone-900">Alertas</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-xl bg-stone-100 px-4 py-2 text-sm text-stone-700">
                {currentUser ? `${currentUser.nome} (${currentUser.nivel_acesso})` : 'Carregando usuario...'}
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-500"
              >
                <Plus size={16} />
                Novo alerta
              </button>
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
            <div className="mt-10 flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
              <LoaderCircle size={16} className="animate-spin" />
              Carregando alertas...
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              <section className="rounded-2xl border border-stone-200 bg-white p-4">
                <h2 className="font-display text-lg font-bold text-stone-900">Filtros</h2>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-stone-600">Status</span>
                    <select
                      value={filters.status}
                      onChange={(event) => handleFilterChange('status', event.target.value)}
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                    >
                      <option value="">Todos</option>
                      {alertStatuses.map((status) => (
                        <option key={status} value={status}>
                          {prettyStatus(status)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-stone-600">Severidade</span>
                    <select
                      value={filters.severity}
                      onChange={(event) => handleFilterChange('severity', event.target.value)}
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                    >
                      <option value="">Todas</option>
                      {alertSeverities.map((severity) => (
                        <option key={severity} value={severity}>
                          {prettySeverity(severity)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-stone-700">
                    <input
                      type="checkbox"
                      checked={filters.apenas_nao_lidos}
                      onChange={(event) => handleFilterChange('apenas_nao_lidos', event.target.checked)}
                      className="h-4 w-4 rounded border-stone-300 text-[#F97316] focus:ring-orange-200"
                    />
                    Apenas nao lidos
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
                        <th className="px-3 py-2">Titulo</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Severidade</th>
                        <th className="px-3 py-2">Criado em</th>
                        <th className="px-3 py-2">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alertas.map((alerta) => {
                        const alertId = getAlertaId(alerta)
                        const alertaRead = getAlertaReadState(alerta)

                        return (
                          <tr key={String(alertId)} className="rounded-xl bg-[#F5F5F4] text-stone-700">
                            <td className="rounded-l-xl px-3 py-2 font-mono text-xs">{alertId || '-'}</td>
                            <td className="px-3 py-2 font-semibold">{alerta.title || '-'}</td>
                            <td className="px-3 py-2 capitalize">{prettyStatus(alerta.status)}</td>
                            <td className="px-3 py-2 uppercase">{prettySeverity(alerta.severity)}</td>
                            <td className="px-3 py-2">{formatDate(alerta.created_at)}</td>
                            <td className="rounded-r-xl px-3 py-2">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenDetails(alertId)}
                                  disabled={isLoadingDetails}
                                  className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {isLoadingDetails ? (
                                    <LoaderCircle size={14} className="animate-spin" />
                                  ) : (
                                    <Eye size={14} />
                                  )}
                                  Visualizar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleRead(alerta)}
                                  disabled={!alertId || markingReadId === alertId}
                                  title={alertaRead ? 'Marcar como nao lido' : 'Marcar como lido'}
                                  aria-label={alertaRead ? 'Marcar como nao lido' : 'Marcar como lido'}
                                  className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white p-1.5 text-stone-600 hover:bg-stone-100 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {markingReadId === alertId ? (
                                    <LoaderCircle size={14} className="animate-spin" />
                                  ) : (
                                    <>{alertaRead ? <BellOff size={14} /> : <Bell size={14} />}</>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}

                      {alertas.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-3 py-8 text-center text-stone-500">
                            Nenhum alerta encontrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {isCreateModalOpen && (
        <ModalShell
          title="Novo alerta operacional"
          icon={<Plus size={18} className="text-[#F97316]" />}
          onClose={() => setIsCreateModalOpen(false)}
        >
          <form onSubmit={handleCreateAlerta} className="grid gap-3 pb-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Tipo *</span>
                <input
                  value={createForm.type}
                  onChange={(event) => handleCreateChange('type', event.target.value)}
                  required
                  placeholder="Ex.: maquina_quebrada"
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Severidade *</span>
                <select
                  value={createForm.severity}
                  onChange={(event) => handleCreateChange('severity', event.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                >
                  {alertSeverities.map((severity) => (
                    <option key={severity} value={severity}>
                      {prettySeverity(severity)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="md:col-span-2 block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Titulo *</span>
                <input
                  value={createForm.title}
                  onChange={(event) => handleCreateChange('title', event.target.value)}
                  required
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                />
              </label>

              <label className="md:col-span-2 block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Descricao</span>
                <textarea
                  value={createForm.description}
                  onChange={(event) => handleCreateChange('description', event.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200 resize-none"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Telegram message ID</span>
                <input
                  type="number"
                  value={createForm.telegram_message_id}
                  onChange={(event) => handleCreateChange('telegram_message_id', event.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Detalhe local</span>
                <input
                  value={createForm.location_detail}
                  onChange={(event) => handleCreateChange('location_detail', event.target.value)}
                  placeholder="Ex.: km 12"
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Equipamento</span>
                <input
                  value={createForm.equipment_name}
                  onChange={(event) => handleCreateChange('equipment_name', event.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                />
              </label>


              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Priority score</span>
                <input
                  type="number"
                  min="0"
                  value={createForm.priority_score}
                  onChange={(event) => handleCreateChange('priority_score', event.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                />
              </label>

              <label className="md:col-span-2 block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Photo URLs (separadas por virgula)</span>
                <input
                  value={createForm.photo_urls}
                  onChange={(event) => handleCreateChange('photo_urls', event.target.value)}
                  placeholder="https://.../foto1.jpg, https://.../foto2.jpg"
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                />
              </label>

              <label className="md:col-span-2 block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Notified channels (separados por virgula)</span>
                <input
                  value={createForm.notified_channels}
                  onChange={(event) => handleCreateChange('notified_channels', event.target.value)}
                  placeholder="telegram, email"
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                />
              </label>

              <label className="md:col-span-2 block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Raw text</span>
                <textarea
                  value={createForm.raw_text}
                  onChange={(event) => handleCreateChange('raw_text', event.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200 resize-none"
                />
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmittingCreate}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-80"
              >
                {isSubmittingCreate && <LoaderCircle size={16} className="animate-spin" />}
                Criar alerta
              </button>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100"
              >
                Cancelar
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {isDetailsModalOpen && selectedAlerta && (
        <ModalShell
          title={`Alerta ${getAlertaId(selectedAlerta) || ''}`}
          icon={<Bell size={18} className="text-blue-600" />}
          onClose={() => {
            setIsDetailsModalOpen(false)
            setSelectedAlerta(null)
          }}
        >
          <section className="grid gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Titulo</p>
              <p className="mt-1 font-semibold text-stone-900">{selectedAlerta.title || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Tipo</p>
              <p className="mt-1">{selectedAlerta.type || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Status</p>
              <p className="mt-1 capitalize">{prettyStatus(selectedAlerta.status)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Severidade</p>
              <p className="mt-1 uppercase">{prettySeverity(selectedAlerta.severity)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Obra</p>
              <p className="mt-1">{selectedAlerta.obra_nome || selectedAlerta.obra_id || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Criado em</p>
              <p className="mt-1">{formatDate(selectedAlerta.created_at)}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Descricao</p>
              <p className="mt-1">{selectedAlerta.description || '-'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Resolution notes</p>
              <p className="mt-1">{selectedAlerta.resolution_notes || '-'}</p>
            </div>
          </section>

          {isManagerOrAdmin ? (
            <form onSubmit={handleUpdateStatus} className="mt-4 grid gap-3 rounded-xl border border-stone-200 bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                <Pencil size={14} />
                Atualizar status
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-stone-600">Novo status</span>
                  <select
                    value={statusForm.status}
                    onChange={(event) => handleStatusChange('status', event.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                  >
                    {alertStatuses.map((status) => (
                      <option key={status} value={status}>
                        {prettyStatus(status)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="md:col-span-1 block">
                  <span className="mb-1 block text-xs font-semibold text-stone-600">Resolution notes</span>
                  <input
                    value={statusForm.resolution_notes}
                    onChange={(event) => handleStatusChange('resolution_notes', event.target.value)}
                    placeholder="Opcional"
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmittingStatus}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1C1917] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-80"
              >
                {isSubmittingStatus && <LoaderCircle size={16} className="animate-spin" />}
                Salvar status
              </button>
            </form>
          ) : (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <span className="inline-flex items-center gap-2 font-semibold">
                <AlertTriangle size={14} />
                Apenas administrador/gerente pode atualizar o status.
              </span>
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => handleToggleRead(selectedAlerta)}
              disabled={!getAlertaId(selectedAlerta) || markingReadId === getAlertaId(selectedAlerta)}
              title={getAlertaReadState(selectedAlerta) ? 'Marcar como nao lido' : 'Marcar como lido'}
              aria-label={getAlertaReadState(selectedAlerta) ? 'Marcar como nao lido' : 'Marcar como lido'}
              className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white p-2.5 text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {markingReadId === getAlertaId(selectedAlerta) ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : (
                <>{getAlertaReadState(selectedAlerta) ? <BellOff size={14} /> : <Bell size={14} />}</>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsDetailsModalOpen(false)
                setSelectedAlerta(null)
              }}
              className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100"
            >
              Fechar
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  )
}

export default AlertasPage
