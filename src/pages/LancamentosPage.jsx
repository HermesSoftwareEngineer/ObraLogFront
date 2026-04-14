import {
  CheckCircle2,
  LoaderCircle,
  Plus,
  Save,
  Send,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardSidebar from '../components/DashboardSidebar'
import { getCurrentUser } from '../services/authService'
import { isManagerOrAdmin } from '../services/accessControl'
import { clearAuthSession, getAuthToken } from '../services/authStorage'
import { listFrentesServico } from '../services/frentesServicoService'
import {
  addLancamentoItem,
  addLancamentoMidia,
  addLancamentoRecurso,
  confirmarLancamento,
  consolidarLancamento,
  createLancamento,
  descartarLancamento,
  listLancamentos,
  updateLancamento,
} from '../services/lancamentosService'
import { getEntityId, normalizeCollection } from '../services/responseNormalizers'
import { listUsers } from '../services/usersService'

const STATUS_OPTIONS = ['rascunho', 'confirmado', 'consolidado', 'descartado']
const TEMPO_OPTIONS = ['limpo', 'nublado', 'impraticavel']

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

function toDateInput(value) {
  if (!value) {
    return ''
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return parsed.toISOString().slice(0, 10)
}

function LancamentosPage() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)
  const [frentes, setFrentes] = useState([])
  const [users, setUsers] = useState([])
  const [lancamentos, setLancamentos] = useState([])
  const [selectedLancamento, setSelectedLancamento] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false)
  const [isSubmittingStatusPatch, setIsSubmittingStatusPatch] = useState(false)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [isAddingRecurso, setIsAddingRecurso] = useState(false)
  const [isAddingMidia, setIsAddingMidia] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isDiscarding, setIsDiscarding] = useState(false)
  const [isConsolidating, setIsConsolidating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [filters, setFilters] = useState({
    status: '',
    frente_servico_id: '',
    usuario_id: '',
    data_referencia: '',
    include_children: true,
    limit: '100',
  })
  const [activeFilters, setActiveFilters] = useState({ include_children: true, limit: 100 })

  const [createForm, setCreateForm] = useState({
    frente_servico_id: '',
    data_referencia: toDateInput(new Date()),
    usuario_id: '',
    origem_mensagem_id: '',
    resumo_operacional: '',
    observacoes_gerais: '',
    confianca_extracao: '',
  })

  const [statusPatchForm, setStatusPatchForm] = useState({
    status: 'rascunho',
    resumo_operacional: '',
    observacoes_gerais: '',
    confianca_extracao: '',
  })

  const [itemForm, setItemForm] = useState({
    tipo_item: 'atividade',
    descricao: '',
  })

  const [recursoForm, setRecursoForm] = useState({
    categoria: 'mao_obra',
    nome_recurso: '',
    quantidade: '',
  })

  const [midiaForm, setMidiaForm] = useState({
    tipo_midia: 'imagem',
    url: '',
    descricao: '',
  })

  const [consolidarForm, setConsolidarForm] = useState({
    estaca_inicial: '',
    estaca_final: '',
    tempo_manha: '',
    tempo_tarde: '',
    resultado: '',
    lado_pista: '',
    pista: '',
    observacao: '',
    raw_text: '',
    frente_servico_id: '',
    usuario_registrador_id: '',
    data: '',
  })

  const token = useMemo(() => getAuthToken(), [])
  const canManageUsuarioScope = isManagerOrAdmin(currentUser)

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  const buildFilterPayload = () => {
    const payload = {}

    if (filters.status.trim()) {
      payload.status = filters.status
    }

    if (filters.frente_servico_id.trim()) {
      payload.frente_servico_id = Number(filters.frente_servico_id)
    }

    if (canManageUsuarioScope && filters.usuario_id.trim()) {
      payload.usuario_id = Number(filters.usuario_id)
    }

    if (filters.data_referencia.trim()) {
      payload.data_referencia = filters.data_referencia
    }

    payload.include_children = Boolean(filters.include_children)

    const parsedLimit = Number(filters.limit)
    if (Number.isFinite(parsedLimit) && parsedLimit >= 1 && parsedLimit <= 300) {
      payload.limit = parsedLimit
    }

    return payload
  }

  const loadLancamentos = async (filterParams = activeFilters) => {
    const data = await listLancamentos(token, filterParams)
    const normalized = normalizeCollection(data, ['items', 'lancamentos', 'data'])
    setLancamentos(normalized)

    if (selectedLancamento) {
      const selectedId = getEntityId(selectedLancamento, ['id', 'lancamento_id', 'uuid'])
      const refreshed = normalized.find(
        (item) => String(getEntityId(item, ['id', 'lancamento_id', 'uuid'])) === String(selectedId)
      )
      if (refreshed) {
        setSelectedLancamento(refreshed)
      }
    }
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
        const [meData, frentesData, usersData] = await Promise.all([
          getCurrentUser(token),
          listFrentesServico(token),
          listUsers(token),
        ])

        setCurrentUser(meData.user)
        setFrentes(normalizeCollection(frentesData, ['items', 'frentes_servico', 'frentesServico']))
        setUsers(normalizeCollection(usersData, ['users', 'usuarios', 'items']))
        await loadLancamentos({ include_children: true, limit: 100 })
      } catch (err) {
        setError(err.message || 'Nao foi possivel carregar lancamentos.')
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

  const handleApplyFilters = async () => {
    setError('')
    setSuccess('')

    const payload = buildFilterPayload()
    setActiveFilters(payload)

    try {
      await loadLancamentos(payload)
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
      frente_servico_id: '',
      usuario_id: '',
      data_referencia: '',
      include_children: true,
      limit: '100',
    }

    setFilters(defaultFilters)
    setActiveFilters({ include_children: true, limit: 100 })

    try {
      await loadLancamentos({ include_children: true, limit: 100 })
      setSuccess('Filtros limpos com sucesso.')
    } catch (err) {
      setError(err.message || 'Nao foi possivel limpar filtros.')
    }
  }

  const handleCreateLancamento = async (event) => {
    event.preventDefault()

    if (!createForm.frente_servico_id.trim() || !createForm.data_referencia.trim()) {
      setError('Preencha os campos obrigatorios: frente_servico_id e data_referencia.')
      return
    }

    setError('')
    setSuccess('')
    setIsSubmittingCreate(true)

    try {
      const payload = {
        frente_servico_id: Number(createForm.frente_servico_id),
        data_referencia: createForm.data_referencia,
      }

      if (canManageUsuarioScope && createForm.usuario_id.trim()) {
        payload.usuario_id = Number(createForm.usuario_id)
      }

      if (createForm.origem_mensagem_id.trim()) {
        payload.origem_mensagem_id = createForm.origem_mensagem_id.trim()
      }

      if (createForm.resumo_operacional.trim()) {
        payload.resumo_operacional = createForm.resumo_operacional.trim()
      }

      if (createForm.observacoes_gerais.trim()) {
        payload.observacoes_gerais = createForm.observacoes_gerais.trim()
      }

      if (createForm.confianca_extracao.trim()) {
        payload.confianca_extracao = Number(createForm.confianca_extracao)
      }

      await createLancamento(token, payload)
      setSuccess('Lancamento criado com sucesso.')
      await loadLancamentos(activeFilters)
    } catch (err) {
      setError(err.message || 'Nao foi possivel criar lancamento.')
    } finally {
      setIsSubmittingCreate(false)
    }
  }

  const handleSelectLancamento = (item) => {
    setSelectedLancamento(item)
    setStatusPatchForm({
      status: item?.status || 'rascunho',
      resumo_operacional: item?.resumo_operacional || '',
      observacoes_gerais: item?.observacoes_gerais || '',
      confianca_extracao:
        item?.confianca_extracao !== null && item?.confianca_extracao !== undefined
          ? String(item.confianca_extracao)
          : '',
    })
  }

  const withSelectedLancamento = () => {
    const lancamentoId = getEntityId(selectedLancamento, ['id', 'lancamento_id', 'uuid'])
    if (!lancamentoId) {
      throw new Error('Selecione um lancamento antes de executar esta acao.')
    }

    return lancamentoId
  }

  const handlePatchLancamento = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess('')
    setIsSubmittingStatusPatch(true)

    try {
      const lancamentoId = withSelectedLancamento()
      const payload = {
        status: statusPatchForm.status,
      }

      if (statusPatchForm.resumo_operacional.trim()) {
        payload.resumo_operacional = statusPatchForm.resumo_operacional.trim()
      }

      if (statusPatchForm.observacoes_gerais.trim()) {
        payload.observacoes_gerais = statusPatchForm.observacoes_gerais.trim()
      }

      if (statusPatchForm.confianca_extracao.trim()) {
        payload.confianca_extracao = Number(statusPatchForm.confianca_extracao)
      }

      await updateLancamento(token, lancamentoId, payload)
      setSuccess('Lancamento atualizado com sucesso.')
      await loadLancamentos(activeFilters)
    } catch (err) {
      setError(err.message || 'Nao foi possivel atualizar o lancamento.')
    } finally {
      setIsSubmittingStatusPatch(false)
    }
  }

  const handleAddItem = async (event) => {
    event.preventDefault()

    if (!itemForm.tipo_item.trim() || !itemForm.descricao.trim()) {
      setError('Preencha os campos obrigatorios para item: tipo_item e descricao.')
      return
    }

    setError('')
    setSuccess('')
    setIsAddingItem(true)

    try {
      const lancamentoId = withSelectedLancamento()
      await addLancamentoItem(token, lancamentoId, {
        tipo_item: itemForm.tipo_item.trim(),
        descricao: itemForm.descricao.trim(),
      })
      setSuccess('Item adicionado com sucesso.')
      setItemForm({ tipo_item: 'atividade', descricao: '' })
      await loadLancamentos(activeFilters)
    } catch (err) {
      setError(err.message || 'Nao foi possivel adicionar item.')
    } finally {
      setIsAddingItem(false)
    }
  }

  const handleAddRecurso = async (event) => {
    event.preventDefault()

    if (!recursoForm.categoria.trim() || !recursoForm.nome_recurso.trim() || !recursoForm.quantidade.trim()) {
      setError('Preencha os campos obrigatorios para recurso: categoria, nome_recurso e quantidade.')
      return
    }

    setError('')
    setSuccess('')
    setIsAddingRecurso(true)

    try {
      const lancamentoId = withSelectedLancamento()
      await addLancamentoRecurso(token, lancamentoId, {
        categoria: recursoForm.categoria.trim(),
        nome_recurso: recursoForm.nome_recurso.trim(),
        quantidade: Number(recursoForm.quantidade),
      })
      setSuccess('Recurso adicionado com sucesso.')
      setRecursoForm({ categoria: 'mao_obra', nome_recurso: '', quantidade: '' })
      await loadLancamentos(activeFilters)
    } catch (err) {
      setError(err.message || 'Nao foi possivel adicionar recurso.')
    } finally {
      setIsAddingRecurso(false)
    }
  }

  const handleAddMidia = async (event) => {
    event.preventDefault()

    if (!midiaForm.url.trim()) {
      setError('Informe uma URL para adicionar a midia.')
      return
    }

    setError('')
    setSuccess('')
    setIsAddingMidia(true)

    try {
      const lancamentoId = withSelectedLancamento()
      const payload = {
        url: midiaForm.url.trim(),
      }

      if (midiaForm.tipo_midia.trim()) {
        payload.tipo_midia = midiaForm.tipo_midia.trim()
      }

      if (midiaForm.descricao.trim()) {
        payload.descricao = midiaForm.descricao.trim()
      }

      await addLancamentoMidia(token, lancamentoId, payload)
      setSuccess('Midia adicionada com sucesso.')
      setMidiaForm({ tipo_midia: 'imagem', url: '', descricao: '' })
      await loadLancamentos(activeFilters)
    } catch (err) {
      setError(err.message || 'Nao foi possivel adicionar midia.')
    } finally {
      setIsAddingMidia(false)
    }
  }

  const handleConfirmar = async () => {
    setError('')
    setSuccess('')
    setIsConfirming(true)

    try {
      const lancamentoId = withSelectedLancamento()
      await confirmarLancamento(token, lancamentoId)
      setSuccess('Lancamento confirmado com sucesso.')
      await loadLancamentos(activeFilters)
    } catch (err) {
      setError(err.message || 'Nao foi possivel confirmar lancamento.')
    } finally {
      setIsConfirming(false)
    }
  }

  const handleDescartar = async () => {
    setError('')
    setSuccess('')
    setIsDiscarding(true)

    try {
      const lancamentoId = withSelectedLancamento()
      await descartarLancamento(token, lancamentoId)
      setSuccess('Lancamento descartado com sucesso.')
      await loadLancamentos(activeFilters)
    } catch (err) {
      setError(err.message || 'Nao foi possivel descartar lancamento.')
    } finally {
      setIsDiscarding(false)
    }
  }

  const handleConsolidar = async (event) => {
    event.preventDefault()

    const required = [
      'estaca_inicial',
      'estaca_final',
      'tempo_manha',
      'tempo_tarde',
    ]

    const hasMissing = required.some((key) => !String(consolidarForm[key]).trim())
    if (hasMissing) {
      setError('Preencha os campos obrigatorios para consolidar: estaca_inicial, estaca_final, tempo_manha e tempo_tarde.')
      return
    }

    if (!TEMPO_OPTIONS.includes(consolidarForm.tempo_manha) || !TEMPO_OPTIONS.includes(consolidarForm.tempo_tarde)) {
      setError('Tempo da manha e da tarde devem ser: limpo, nublado ou impraticavel.')
      return
    }

    setError('')
    setSuccess('')
    setIsConsolidating(true)

    try {
      const lancamentoId = withSelectedLancamento()
      const payload = {
        estaca_inicial: Number(consolidarForm.estaca_inicial),
        estaca_final: Number(consolidarForm.estaca_final),
        tempo_manha: consolidarForm.tempo_manha,
        tempo_tarde: consolidarForm.tempo_tarde,
      }

      if (consolidarForm.resultado.trim()) {
        payload.resultado = Number(consolidarForm.resultado)
      }

      if (consolidarForm.lado_pista.trim()) {
        payload.lado_pista = consolidarForm.lado_pista.trim()
      }

      if (consolidarForm.pista.trim()) {
        payload.pista = consolidarForm.pista.trim()
      }

      if (consolidarForm.observacao.trim()) {
        payload.observacao = consolidarForm.observacao.trim()
      }

      if (consolidarForm.raw_text.trim()) {
        payload.raw_text = consolidarForm.raw_text.trim()
      }

      if (consolidarForm.frente_servico_id.trim()) {
        payload.frente_servico_id = Number(consolidarForm.frente_servico_id)
      }

      if (consolidarForm.usuario_registrador_id.trim()) {
        payload.usuario_registrador_id = Number(consolidarForm.usuario_registrador_id)
      }

      if (consolidarForm.data.trim()) {
        payload.data = consolidarForm.data.trim()
      }

      await consolidarLancamento(token, lancamentoId, payload)
      setSuccess('Lancamento consolidado com sucesso.')
      await loadLancamentos(activeFilters)
    } catch (err) {
      setError(err.message || 'Nao foi possivel consolidar lancamento.')
    } finally {
      setIsConsolidating(false)
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
              <h1 className="mt-1 font-display text-3xl font-extrabold text-stone-900">Lancamentos operacionais</h1>
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
              Carregando lancamentos...
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              <section className="rounded-2xl border border-stone-200 bg-white p-4">
                <h2 className="font-display text-lg font-bold text-stone-900">Criar rascunho</h2>

                <form onSubmit={handleCreateLancamento} className="mt-4 grid gap-3 md:grid-cols-3">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-stone-600">Frente de servico *</span>
                    <select
                      value={createForm.frente_servico_id}
                      onChange={(event) => handleCreateChange('frente_servico_id', event.target.value)}
                      required
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                    >
                      <option value="">Selecione</option>
                      {frentes.map((frente) => (
                        <option key={frente.id} value={frente.id}>
                          {frente.nome || `Frente #${frente.id}`}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-stone-600">Data referencia *</span>
                    <input
                      type="date"
                      value={createForm.data_referencia}
                      onChange={(event) => handleCreateChange('data_referencia', event.target.value)}
                      required
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                    />
                  </label>

                  {canManageUsuarioScope && (
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-stone-600">Usuario (opcional)</span>
                      <select
                        value={createForm.usuario_id}
                        onChange={(event) => handleCreateChange('usuario_id', event.target.value)}
                        className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                      >
                        <option value="">Nenhum</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.nome}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  <label className="block md:col-span-3">
                    <span className="mb-1 block text-xs font-semibold text-stone-600">Resumo operacional</span>
                    <input
                      value={createForm.resumo_operacional}
                      onChange={(event) => handleCreateChange('resumo_operacional', event.target.value)}
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                    />
                  </label>

                  <div className="md:col-span-3">
                    <button
                      type="submit"
                      disabled={isSubmittingCreate}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-80"
                    >
                      {isSubmittingCreate ? <LoaderCircle size={14} className="animate-spin" /> : <Plus size={14} />}
                      Criar lancamento
                    </button>
                  </div>
                </form>
              </section>

              <section className="rounded-2xl border border-stone-200 bg-white p-4">
                <h2 className="font-display text-lg font-bold text-stone-900">Filtros</h2>

                <div className="mt-4 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-stone-600">Status</span>
                    <select
                      value={filters.status}
                      onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
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

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-stone-600">Frente</span>
                    <select
                      value={filters.frente_servico_id}
                      onChange={(event) =>
                        setFilters((prev) => ({ ...prev, frente_servico_id: event.target.value }))
                      }
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                    >
                      <option value="">Todas</option>
                      {frentes.map((frente) => (
                        <option key={frente.id} value={frente.id}>
                          {frente.nome || `Frente #${frente.id}`}
                        </option>
                      ))}
                    </select>
                  </label>

                  {canManageUsuarioScope && (
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-stone-600">Usuario</span>
                      <input
                        type="number"
                        min="1"
                        value={filters.usuario_id}
                        onChange={(event) => setFilters((prev) => ({ ...prev, usuario_id: event.target.value }))}
                        className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                      />
                    </label>
                  )}

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-stone-600">Data referencia</span>
                    <input
                      type="date"
                      value={filters.data_referencia}
                      onChange={(event) =>
                        setFilters((prev) => ({ ...prev, data_referencia: event.target.value }))
                      }
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-stone-600">Limite</span>
                    <input
                      type="number"
                      min="1"
                      max="300"
                      value={filters.limit}
                      onChange={(event) => setFilters((prev) => ({ ...prev, limit: event.target.value }))}
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                    />
                  </label>

                  <label className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-stone-700">
                    <input
                      type="checkbox"
                      checked={filters.include_children}
                      onChange={(event) =>
                        setFilters((prev) => ({ ...prev, include_children: event.target.checked }))
                      }
                      className="h-4 w-4 rounded border-stone-300 text-[#F97316] focus:ring-orange-200"
                    />
                    Incluir filhos
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
                <h2 className="font-display text-lg font-bold text-stone-900">Lista de lancamentos</h2>

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                    <thead>
                      <tr className="text-left text-stone-500">
                        <th className="px-3 py-2">ID</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Frente</th>
                        <th className="px-3 py-2">Data ref.</th>
                        <th className="px-3 py-2">Usuario</th>
                        <th className="px-3 py-2">Atualizado</th>
                        <th className="px-3 py-2">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lancamentos.map((item) => {
                        const itemId = getEntityId(item, ['id', 'lancamento_id', 'uuid'])

                        return (
                          <tr key={String(itemId)} className="rounded-xl bg-[#F5F5F4] text-stone-700">
                            <td className="rounded-l-xl px-3 py-2 font-mono text-xs">{itemId || '-'}</td>
                            <td className="px-3 py-2">{item.status || '-'}</td>
                            <td className="px-3 py-2">{item.frente_servico_id || '-'}</td>
                            <td className="px-3 py-2">{item.data_referencia || '-'}</td>
                            <td className="px-3 py-2">{item.usuario_id || '-'}</td>
                            <td className="px-3 py-2">{formatDateTime(item.updated_at || item.created_at)}</td>
                            <td className="rounded-r-xl px-3 py-2">
                              <button
                                type="button"
                                onClick={() => handleSelectLancamento(item)}
                                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                              >
                                <CheckCircle2 size={14} />
                                Selecionar
                              </button>
                            </td>
                          </tr>
                        )
                      })}

                      {lancamentos.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-3 py-8 text-center text-stone-500">
                            Nenhum lancamento encontrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-2xl border border-stone-200 bg-white p-4">
                <h2 className="font-display text-lg font-bold text-stone-900">Acoes no lancamento selecionado</h2>

                {!selectedLancamento && (
                  <p className="mt-2 text-sm text-stone-600">Selecione um lancamento da tabela para habilitar as acoes.</p>
                )}

                {selectedLancamento && (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700">
                      <p>
                        <span className="font-semibold">ID:</span> {getEntityId(selectedLancamento, ['id', 'lancamento_id', 'uuid'])}
                      </p>
                      <p>
                        <span className="font-semibold">Status:</span> {selectedLancamento.status || '-'}
                      </p>
                    </div>

                    <form onSubmit={handlePatchLancamento} className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                        <Save size={14} />
                        Patch de status e metadados
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="block">
                          <span className="mb-1 block text-xs font-semibold text-stone-600">Status</span>
                          <select
                            value={statusPatchForm.status}
                            onChange={(event) =>
                              setStatusPatchForm((prev) => ({ ...prev, status: event.target.value }))
                            }
                            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="block">
                          <span className="mb-1 block text-xs font-semibold text-stone-600">Confianca</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={statusPatchForm.confianca_extracao}
                            onChange={(event) =>
                              setStatusPatchForm((prev) => ({ ...prev, confianca_extracao: event.target.value }))
                            }
                            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                          />
                        </label>

                        <label className="block md:col-span-2">
                          <span className="mb-1 block text-xs font-semibold text-stone-600">Resumo</span>
                          <input
                            value={statusPatchForm.resumo_operacional}
                            onChange={(event) =>
                              setStatusPatchForm((prev) => ({ ...prev, resumo_operacional: event.target.value }))
                            }
                            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                          />
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingStatusPatch}
                        className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#1C1917] px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isSubmittingStatusPatch ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}
                        Salvar patch
                      </button>
                    </form>

                    <div className="grid gap-4 lg:grid-cols-3">
                      <form onSubmit={handleAddItem} className="rounded-xl border border-stone-200 bg-white p-4">
                        <h3 className="text-sm font-bold text-stone-900">Adicionar item</h3>
                        <div className="mt-3 space-y-2">
                          <input
                            value={itemForm.tipo_item}
                            onChange={(event) => setItemForm((prev) => ({ ...prev, tipo_item: event.target.value }))}
                            placeholder="tipo_item"
                            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                          />
                          <input
                            value={itemForm.descricao}
                            onChange={(event) => setItemForm((prev) => ({ ...prev, descricao: event.target.value }))}
                            placeholder="descricao"
                            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                          />
                          <button
                            type="submit"
                            disabled={isAddingItem}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#1C1917] px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {isAddingItem ? <LoaderCircle size={12} className="animate-spin" /> : <Plus size={12} />}
                            Adicionar
                          </button>
                        </div>
                      </form>

                      <form onSubmit={handleAddRecurso} className="rounded-xl border border-stone-200 bg-white p-4">
                        <h3 className="text-sm font-bold text-stone-900">Adicionar recurso</h3>
                        <div className="mt-3 space-y-2">
                          <input
                            value={recursoForm.categoria}
                            onChange={(event) =>
                              setRecursoForm((prev) => ({ ...prev, categoria: event.target.value }))
                            }
                            placeholder="categoria"
                            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                          />
                          <input
                            value={recursoForm.nome_recurso}
                            onChange={(event) =>
                              setRecursoForm((prev) => ({ ...prev, nome_recurso: event.target.value }))
                            }
                            placeholder="nome_recurso"
                            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                          />
                          <input
                            type="number"
                            min="0"
                            value={recursoForm.quantidade}
                            onChange={(event) =>
                              setRecursoForm((prev) => ({ ...prev, quantidade: event.target.value }))
                            }
                            placeholder="quantidade"
                            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                          />
                          <button
                            type="submit"
                            disabled={isAddingRecurso}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#1C1917] px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {isAddingRecurso ? <LoaderCircle size={12} className="animate-spin" /> : <Plus size={12} />}
                            Adicionar
                          </button>
                        </div>
                      </form>

                      <form onSubmit={handleAddMidia} className="rounded-xl border border-stone-200 bg-white p-4">
                        <h3 className="text-sm font-bold text-stone-900">Adicionar midia</h3>
                        <div className="mt-3 space-y-2">
                          <input
                            value={midiaForm.tipo_midia}
                            onChange={(event) => setMidiaForm((prev) => ({ ...prev, tipo_midia: event.target.value }))}
                            placeholder="tipo_midia"
                            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                          />
                          <input
                            value={midiaForm.url}
                            onChange={(event) => setMidiaForm((prev) => ({ ...prev, url: event.target.value }))}
                            placeholder="url"
                            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                          />
                          <input
                            value={midiaForm.descricao}
                            onChange={(event) => setMidiaForm((prev) => ({ ...prev, descricao: event.target.value }))}
                            placeholder="descricao"
                            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                          />
                          <button
                            type="submit"
                            disabled={isAddingMidia}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#1C1917] px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {isAddingMidia ? <LoaderCircle size={12} className="animate-spin" /> : <Plus size={12} />}
                            Adicionar
                          </button>
                        </div>
                      </form>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmar}
                        disabled={isConfirming}
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isConfirming ? <LoaderCircle size={14} className="animate-spin" /> : <Send size={14} />}
                        Confirmar
                      </button>

                      <button
                        type="button"
                        onClick={handleDescartar}
                        disabled={isDiscarding}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isDiscarding ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        Descartar
                      </button>
                    </div>

                    <form onSubmit={handleConsolidar} className="rounded-xl border border-stone-200 bg-white p-4">
                      <h3 className="text-sm font-bold text-stone-900">Consolidar em registro oficial</h3>

                      <div className="mt-3 grid gap-3 md:grid-cols-4">
                        <input
                          type="number"
                          step="0.1"
                          value={consolidarForm.estaca_inicial}
                          onChange={(event) =>
                            setConsolidarForm((prev) => ({ ...prev, estaca_inicial: event.target.value }))
                          }
                          placeholder="estaca_inicial *"
                          className="rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                          required
                        />
                        <input
                          type="number"
                          step="0.1"
                          value={consolidarForm.estaca_final}
                          onChange={(event) =>
                            setConsolidarForm((prev) => ({ ...prev, estaca_final: event.target.value }))
                          }
                          placeholder="estaca_final *"
                          className="rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                          required
                        />
                        <select
                          value={consolidarForm.tempo_manha}
                          onChange={(event) =>
                            setConsolidarForm((prev) => ({ ...prev, tempo_manha: event.target.value }))
                          }
                          className="rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                          required
                        >
                          <option value="">tempo_manha *</option>
                          {TEMPO_OPTIONS.map((tempo) => (
                            <option key={tempo} value={tempo}>
                              {tempo}
                            </option>
                          ))}
                        </select>
                        <select
                          value={consolidarForm.tempo_tarde}
                          onChange={(event) =>
                            setConsolidarForm((prev) => ({ ...prev, tempo_tarde: event.target.value }))
                          }
                          className="rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                          required
                        >
                          <option value="">tempo_tarde *</option>
                          {TEMPO_OPTIONS.map((tempo) => (
                            <option key={tempo} value={tempo}>
                              {tempo}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mt-3">
                        <button
                          type="submit"
                          disabled={isConsolidating}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-80"
                        >
                          {isConsolidating ? <LoaderCircle size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                          Consolidar
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default LancamentosPage
