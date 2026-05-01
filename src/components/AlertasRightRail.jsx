import { AlertCircle, ChevronLeft, ChevronRight, LoaderCircle, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AlertaEditModal from './alerts/AlertaEditModal'
import AlertasRailList from './alerts/AlertasRailList'
import { getAuthToken } from '../services/authStorage'
import {
  createAlertaTipoSimples,
  getAlertaById,
  listAlertaTiposSimples,
  listAlertas,
  markAlertaAsRead,
  markAlertaAsUnread,
  updateAlerta,
} from '../services/alertasService'
import {
  buildEditableState,
  buildPayloadFromState,
  getAlertaCode,
  getAlertaId,
  isAlertaRead,
  normalizeAlerta,
  normalizeAlertas,
} from './alerts/alertasUtils'

const ADD_TYPE_OPTION_VALUE = '__include_tipo__'

function normalizeTiposSimples(data) {
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.tipos)) {
    return data.tipos
  }

  if (Array.isArray(data?.items)) {
    return data.items
  }

  if (Array.isArray(data?.data)) {
    return data.data
  }

  return []
}

function AlertasRightRail({ isCollapsed = false, onToggleCollapse }) {
  const token = useMemo(() => getAuthToken(), [])
  const [alertas, setAlertas] = useState([])
  const [selectedAlertId, setSelectedAlertId] = useState(null)
  const [formValues, setFormValues] = useState({})
  const [fieldTypes, setFieldTypes] = useState({})
  const [alertTypeOptions, setAlertTypeOptions] = useState([])
  const [isIncludeTypeModalOpen, setIsIncludeTypeModalOpen] = useState(false)
  const [includeTypeName, setIncludeTypeName] = useState('')
  const [isCreatingType, setIsCreatingType] = useState(false)
  const [isLoadingList, setIsLoadingList] = useState(true)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [markingReadId, setMarkingReadId] = useState(null)
  const [readStateOverrides, setReadStateOverrides] = useState({})
  const [listFilter, setListFilter] = useState('unread')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const selectedAlerta = alertas.find((alerta) => String(getAlertaId(alerta)) === String(selectedAlertId))
  const selectedAlertaCode =
    getAlertaCode(formValues) ||
    getAlertaCode(selectedAlerta) ||
    selectedAlertId

  const selectedAlertaRead =
    typeof readStateOverrides[String(selectedAlertId)] === 'boolean'
      ? readStateOverrides[String(selectedAlertId)]
      : isAlertaRead({ ...(selectedAlerta || {}), ...(formValues || {}) })

  const buildListFilters = (filter) =>
    filter === 'unread'
      ? { apenas_nao_lidos: true }
      : {}

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setIsLoadingList(false)
        return
      }

      setIsLoadingList(true)
      setError('')

      try {
        const data = await listAlertas(token, buildListFilters(listFilter))
        const normalized = normalizeAlertas(data)
        setAlertas(normalized)
      } catch (err) {
        setError(err.message || 'Nao foi possivel carregar os alertas.')
      } finally {
        setIsLoadingList(false)
      }
    }

    load()
  }, [token, listFilter])

  useEffect(() => {
    const loadTipos = async () => {
      if (!token) {
        return
      }

      try {
        const data = await listAlertaTiposSimples(token, { ativos_apenas: true })
        setAlertTypeOptions(normalizeTiposSimples(data))
      } catch {
        setAlertTypeOptions([])
      }
    }

    loadTipos()
  }, [token])

  const handleSelectAlerta = async (alertId) => {
    if (!alertId || !token) {
      return
    }

    setSelectedAlertId(alertId)
    setIsLoadingDetails(true)
    setIsModalOpen(true)
    setError('')
    setSuccess('')

    try {
      const data = await getAlertaById(token, alertId)
      const alertaDetail = normalizeAlerta(data)
      const editable = buildEditableState(alertaDetail)
      setFormValues(editable.values)
      setFieldTypes(editable.types)
    } catch (err) {
      setError(err.message || 'Nao foi possivel carregar os detalhes do alerta.')
      setIsModalOpen(false)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const handleFormChange = (field, value) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleRequestIncludeType = () => {
    setIncludeTypeName('')
    setIsIncludeTypeModalOpen(true)
  }

  const handleCreateType = async () => {
    if (!token) {
      return
    }

    const newTypeName = includeTypeName.trim()
    if (!newTypeName) {
      setError('Informe o nome do novo tipo para incluir.')
      return
    }

    setIsCreatingType(true)
    setError('')

    try {
      const createdTypeData = await createAlertaTipoSimples(token, {
        nome: newTypeName,
        ativo: true,
      })

      const createdType =
        createdTypeData?.tipo ||
        createdTypeData?.data ||
        createdTypeData

      const selectedType = createdType?.nome || createdType?.tipo_canonico || newTypeName

      const refreshedTypesData = await listAlertaTiposSimples(token, { ativos_apenas: true })
      setAlertTypeOptions(normalizeTiposSimples(refreshedTypesData))

      setFormValues((prev) => ({
        ...prev,
        type: selectedType,
      }))

      setIsIncludeTypeModalOpen(false)
      setIncludeTypeName('')
      setSuccess('Novo tipo incluido com sucesso.')
    } catch (err) {
      setError(err.message || 'Nao foi possivel incluir o novo tipo.')
    } finally {
      setIsCreatingType(false)
    }
  }

  const handleSave = async () => {
    if (!token || !selectedAlertId) {
      return
    }

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const payload = buildPayloadFromState(formValues, fieldTypes)

      if (payload.type === ADD_TYPE_OPTION_VALUE) {
        throw new Error('Selecione um tipo valido ou inclua um novo tipo.')
      }

      await updateAlerta(token, selectedAlertId, payload)

      const [updatedDetails, refreshedList] = await Promise.all([
        getAlertaById(token, selectedAlertId),
        listAlertas(token, buildListFilters(listFilter)),
      ])

      const editable = buildEditableState(normalizeAlerta(updatedDetails))
      setFormValues(editable.values)
      setFieldTypes(editable.types)
      setAlertas(normalizeAlertas(refreshedList))
      setSuccess('Alerta atualizado com sucesso.')
    } catch (err) {
      setError(err.message || 'Nao foi possivel salvar o alerta.')
    } finally {
      setIsSaving(false)
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

  const handleToggleRead = async (alertaLike) => {
    const alertId = getAlertaId(alertaLike) || selectedAlertId
    if (!alertId || !token) {
      return
    }

    const currentOverride = readStateOverrides[String(alertId)]
    const currentlyRead =
      typeof currentOverride === 'boolean'
        ? currentOverride
        : isAlertaRead(alertaLike || selectedAlerta || formValues)
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

      const refreshedListData = await listAlertas(token, buildListFilters(listFilter))
      setAlertas(normalizeAlertas(refreshedListData))

      if (String(selectedAlertId) === String(alertId)) {
        const detailData = await getAlertaById(token, alertId)
        const editable = buildEditableState(normalizeAlerta(detailData))
        setFormValues(editable.values)
        setFieldTypes(editable.types)
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

  const visibleAlertas =
    listFilter === 'unread'
      ? alertas.filter((alerta) => !getAlertaReadState(alerta))
      : alertas

  if (!token) {
    return null
  }

  return (
    <>
      <aside
        className={`hidden shrink-0 self-start overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm xl:sticky xl:top-8 xl:flex xl:flex-col ${
          isCollapsed ? 'w-16' : 'w-[22rem]'
        }`}
      >
        {isCollapsed ? (
          <div className="flex h-full flex-col items-center gap-3 px-2 py-3">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-300 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
              title="Expandir alertas"
              aria-label="Expandir alertas"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
              <AlertCircle size={15} />
            </span>
          </div>
        ) : (
          <>
            <div className="border-b border-stone-200 px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#F97316]">Operacao</p>
                  <h2 className="font-display text-lg font-extrabold text-stone-900">Alertas</h2>
                </div>
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-300 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
                  title="Colapsar alertas"
                  aria-label="Colapsar alertas"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="mt-3 inline-flex rounded-lg border border-stone-200 bg-stone-50 p-1">
                <button
                  type="button"
                  onClick={() => setListFilter('all')}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                    listFilter === 'all'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setListFilter('unread')}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                    listFilter === 'unread'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Nao lidos
                </button>
              </div>
            </div>

            {error && (
              <p className="mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
            )}

            {success && (
              <p className="mx-4 mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {success}
              </p>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <AlertasRailList
                alertas={visibleAlertas}
                isLoading={isLoadingList}
                onSelect={handleSelectAlerta}
                getAlertaReadState={getAlertaReadState}
                onToggleRead={handleToggleRead}
                markingReadId={markingReadId}
              />
            </div>

            <div className="border-t border-stone-200 p-3">
              <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-xs text-stone-600">
                <AlertCircle size={14} />
                Clique em um alerta para editar.
              </div>
            </div>
          </>
        )}
      </aside>

      <AlertaEditModal
        isOpen={isModalOpen}
        alertId={selectedAlertId}
        formValues={formValues}
        headerMeta={selectedAlerta}
        alertTypeOptions={alertTypeOptions}
        addTypeOptionValue={ADD_TYPE_OPTION_VALUE}
        isLoading={isLoadingDetails}
        isSaving={isSaving}
        isRead={selectedAlertaRead}
        isTogglingRead={markingReadId === selectedAlertId}
        onChange={handleFormChange}
        onRequestIncludeType={handleRequestIncludeType}
        onToggleRead={() => handleToggleRead({ ...(selectedAlerta || {}), ...(formValues || {}), id: selectedAlertId })}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />

      {isIncludeTypeModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl sm:p-6">
            <header className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#F97316]">Tipos de alerta</p>
                <h3 className="mt-1 font-display text-xl font-extrabold text-stone-900">Incluir tipo</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsIncludeTypeModalOpen(false)}
                className="rounded-xl border border-stone-300 p-2 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
                aria-label="Fechar modal"
              >
                <X size={16} />
              </button>
            </header>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-stone-600">Nome do novo tipo</span>
              <input
                value={includeTypeName}
                onChange={(event) => setIncludeTypeName(event.target.value)}
                placeholder="Ex.: pane eletrica"
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
              />
            </label>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsIncludeTypeModalOpen(false)}
                className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateType}
                disabled={isCreatingType}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1C1917] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isCreatingType && <LoaderCircle size={16} className="animate-spin" />}
                Incluir tipo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AlertasRightRail
