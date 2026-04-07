import {
  AlertTriangle,
  ImagePlus,
  Images,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardSidebar from '../components/DashboardSidebar'
import { getCurrentUser } from '../services/authService'
import { clearAuthSession, getAuthToken } from '../services/authStorage'
import {
  createRegistro,
  deleteRegistroImagem,
  deleteRegistro,
  getRegistroById,
  listRegistroImagens,
  listRegistros,
  uploadRegistroImagem,
  updateRegistro,
} from '../services/registrosService'
import { listFrentesServico } from '../services/frentesServicoService'
import { listUsers } from '../services/usersService'

function ModalShell({ title, icon, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/55 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl sm:p-6">
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

function normalizeRegistros(data) {
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.registros)) {
    return data.registros
  }

  if (Array.isArray(data?.items)) {
    return data.items
  }

  return []
}

function normalizeRegistro(data) {
  if (data?.registro) {
    return data.registro
  }

  return data
}

function normalizeFrentes(data) {
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.frentes_servico)) {
    return data.frentes_servico
  }

  if (Array.isArray(data?.frentesServico)) {
    return data.frentesServico
  }

  if (Array.isArray(data?.items)) {
    return data.items
  }

  return []
}

function normalizeUsers(data) {
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.users)) {
    return data.users
  }

  if (Array.isArray(data?.usuarios)) {
    return data.usuarios
  }

  return []
}

function toInputDate(value) {
  if (!value) {
    return ''
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return ''
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed
    }

    const fromIso = trimmed.slice(0, 10)
    if (/^\d{4}-\d{2}-\d{2}$/.test(fromIso)) {
      return fromIso
    }
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return ''
  }

  const year = parsedDate.getFullYear()
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
  const day = String(parsedDate.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])

const MAX_IMAGES_PER_REGISTRO = 30

function normalizeRegistroImages(data) {
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.imagens)) {
    return data.imagens
  }

  if (Array.isArray(data?.images)) {
    return data.images
  }

  if (Array.isArray(data?.items)) {
    return data.items
  }

  return []
}

function getImageId(image) {
  return image?.id ?? image?.imagem_id ?? image?.image_id ?? image?.uuid
}

function getImageUrl(image) {
  return image?.url || image?.imagem_url || image?.image_url || image?.arquivo_url || image?.path || ''
}

function getImageFileName(image, fallbackId) {
  const originalName = image?.nome_arquivo || image?.file_name || image?.filename || image?.nome
  if (originalName && typeof originalName === 'string') {
    return originalName
  }

  return `registro-imagem-${fallbackId || 'arquivo'}.jpg`
}

function RegistrosPage() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)
  const [registros, setRegistros] = useState([])
  const [frentes, setFrentes] = useState([])
  const [users, setUsers] = useState([])
  const [selectedRegistro, setSelectedRegistro] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isImagesModalOpen, setIsImagesModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [createForm, setCreateForm] = useState({
    data: '',
    frente_servico_id: '',
    usuario_registrador_id: '',
    estaca_inicial: '',
    estaca_final: '',
    resultado: '',
    tempo_manha: '',
    tempo_tarde: '',
    pista: '',
    lado_pista: '',
    observacao: '',
  })
  const [editForm, setEditForm] = useState({
    id: null,
    data: '',
    frente_servico_id: '',
    usuario_registrador_id: '',
    estaca_inicial: '',
    estaca_final: '',
    resultado: '',
    tempo_manha: '',
    tempo_tarde: '',
    pista: '',
    lado_pista: '',
    observacao: '',
  })
  const [filters, setFilters] = useState({
    data: '',
    frente_servico_id: '',
    usuario_id: '',
  })
  const [activeFilters, setActiveFilters] = useState({})
  const [registroImages, setRegistroImages] = useState([])
  const [isLoadingImages, setIsLoadingImages] = useState(false)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [deletingImageId, setDeletingImageId] = useState(null)
  const [isDownloadingAllImages, setIsDownloadingAllImages] = useState(false)
  const [downloadingImageId, setDownloadingImageId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const token = useMemo(() => getAuthToken(), [])

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  const loadRegistros = async (filterParams = activeFilters) => {
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    const registrosData = await listRegistros(token, filterParams)
    setRegistros(normalizeRegistros(registrosData))
  }

  const loadFrentes = async () => {
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    const frentesData = await listFrentesServico(token)
    setFrentes(normalizeFrentes(frentesData))
  }

  const loadUsers = async () => {
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    const usersData = await listUsers(token)
    setUsers(normalizeUsers(usersData))
  }

  const loadRegistroImages = async (registroId) => {
    if (!token || !registroId) {
      setRegistroImages([])
      return
    }

    setIsLoadingImages(true)
    try {
      const imagesData = await listRegistroImagens(token, registroId)
      setRegistroImages(normalizeRegistroImages(imagesData))
    } catch (err) {
      setRegistroImages([])
      setError(err.message || 'Nao foi possivel carregar as imagens do registro.')
    } finally {
      setIsLoadingImages(false)
    }
  }

  const buildFilterPayload = () => {
    const payload = {}

    if (filters.data.trim()) {
      payload.data = filters.data
    }

    if (filters.frente_servico_id.trim()) {
      payload.frente_servico_id = Number(filters.frente_servico_id)
    }

    if (filters.usuario_id.trim()) {
      payload.usuario_id = Number(filters.usuario_id)
    }

    return payload
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
        await Promise.all([loadRegistros(), loadFrentes(), loadUsers()])
      } catch (err) {
        setError(err.message || 'Nao foi possivel carregar os registros.')
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

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleApplyFilters = async () => {
    setError('')
    const payload = buildFilterPayload()
    setActiveFilters(payload)

    try {
      await loadRegistros(payload)
    } catch (err) {
      setError(err.message || 'Nao foi possivel aplicar os filtros.')
    }
  }

  const handleClearFilters = async () => {
    setError('')
    const emptyFilters = {
      data: '',
      frente_servico_id: '',
      usuario_id: '',
    }
    setFilters(emptyFilters)
    setActiveFilters({})

    try {
      await loadRegistros({})
    } catch (err) {
      setError(err.message || 'Nao foi possivel limpar os filtros.')
    }
  }

  const handleUploadImages = async (event) => {
    const files = Array.from(event.target.files || [])

    if (!selectedRegistro?.id || files.length === 0) {
      return
    }

    const invalidFile = files.find((file) => !ALLOWED_IMAGE_TYPES.has(file.type))
    if (invalidFile) {
      setError('Formato de imagem invalido. Use jpeg, png, webp, heic ou heif.')
      event.target.value = ''
      return
    }

    if (registroImages.length + files.length > MAX_IMAGES_PER_REGISTRO) {
      setError(`Limite de ${MAX_IMAGES_PER_REGISTRO} imagens por registro.`)
      event.target.value = ''
      return
    }

    setError('')
    setSuccess('')
    setIsUploadingImages(true)

    try {
      for (const file of files) {
        await uploadRegistroImagem(token, selectedRegistro.id, file)
      }

      setSuccess(`${files.length} imagem(ns) anexada(s) com sucesso.`)
      await loadRegistroImages(selectedRegistro.id)
    } catch (err) {
      setError(err.message || 'Nao foi possivel enviar as imagens para o registro.')
    } finally {
      setIsUploadingImages(false)
      event.target.value = ''
    }
  }

  const handleDeleteImage = async (imageId) => {
    if (!selectedRegistro?.id || !imageId) {
      return
    }

    setError('')
    setSuccess('')
    setDeletingImageId(imageId)

    try {
      await deleteRegistroImagem(token, selectedRegistro.id, imageId)
      setSuccess('Imagem removida com sucesso.')
      await loadRegistroImages(selectedRegistro.id)
    } catch (err) {
      setError(err.message || 'Nao foi possivel remover a imagem.')
    } finally {
      setDeletingImageId(null)
    }
  }

  const triggerDownloadFromBlob = (blob, fileName) => {
    const objectUrl = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.URL.revokeObjectURL(objectUrl)
  }

  const downloadImage = async (image) => {
    const imageId = getImageId(image)
    const imageUrl = getImageUrl(image)

    if (!imageUrl) {
      return
    }

    const fileName = getImageFileName(image, imageId)
    const response = await fetch(imageUrl)

    if (!response.ok) {
      throw new Error('Nao foi possivel baixar a imagem.')
    }

    const blob = await response.blob()
    triggerDownloadFromBlob(blob, fileName)
  }

  const handleDownloadImage = async (image) => {
    const imageId = getImageId(image)
    if (!imageId) {
      return
    }

    setError('')
    setSuccess('')
    setDownloadingImageId(imageId)

    try {
      await downloadImage(image)
    } catch (err) {
      setError(err.message || 'Nao foi possivel baixar a imagem.')
    } finally {
      setDownloadingImageId(null)
    }
  }

  const handleDownloadAllImages = async () => {
    const imagesWithUrl = registroImages.filter((image) => Boolean(getImageUrl(image)))

    if (imagesWithUrl.length === 0) {
      setError('Nao ha imagens disponiveis para download.')
      return
    }

    setError('')
    setSuccess('')
    setIsDownloadingAllImages(true)

    let successCount = 0

    try {
      for (const image of imagesWithUrl) {
        await downloadImage(image)
        successCount += 1
      }

      setSuccess(`${successCount} imagem(ns) baixada(s) com sucesso.`)
    } catch (err) {
      setError(err.message || 'Nao foi possivel baixar todas as imagens.')
    } finally {
      setIsDownloadingAllImages(false)
    }
  }

  const handleCreateRegistro = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSubmittingCreate(true)

    try {
      const payload = {
        frente_servico_id: Number(createForm.frente_servico_id),
      }

      if (createForm.data.trim()) {
        payload.data = createForm.data
      }

      if (createForm.usuario_registrador_id.trim()) {
        payload.usuario_registrador_id = Number(createForm.usuario_registrador_id)
      }

      if (createForm.estaca_inicial.trim()) {
        payload.estaca_inicial = Number(createForm.estaca_inicial)
      }

      if (createForm.estaca_final.trim()) {
        payload.estaca_final = Number(createForm.estaca_final)
      }

      if (createForm.resultado.trim()) {
        payload.resultado = Number(createForm.resultado)
      }

      if (createForm.tempo_manha.trim()) {
        payload.tempo_manha = createForm.tempo_manha
      }

      if (createForm.tempo_tarde.trim()) {
        payload.tempo_tarde = createForm.tempo_tarde
      }

      if (createForm.pista.trim()) {
        payload.pista = createForm.pista
      }

      if (createForm.lado_pista.trim()) {
        payload.lado_pista = createForm.lado_pista
      }

      if (createForm.observacao.trim()) {
        payload.observacao = createForm.observacao
      }

      await createRegistro(token, payload)
      setSuccess('Registro cadastrado com sucesso.')
      setCreateForm({
        data: '',
        frente_servico_id: '',
        usuario_registrador_id: '',
        estaca_inicial: '',
        estaca_final: '',
        resultado: '',
        tempo_manha: '',
        tempo_tarde: '',
        pista: '',
        lado_pista: '',
        observacao: '',
      })
      setIsCreateModalOpen(false)
      await loadRegistros()
    } catch (err) {
      setError(err.message || 'Nao foi possivel criar o registro.')
    } finally {
      setIsSubmittingCreate(false)
    }
  }

  const fillEditFormFromRegistro = (registro) => {
    setEditForm({
      id: registro.id,
      data: toInputDate(registro.data),
      frente_servico_id: String(registro.frente_servico_id || ''),
      usuario_registrador_id: registro.usuario_registrador_id
        ? String(registro.usuario_registrador_id)
        : '',
      estaca_inicial:
        registro.estaca_inicial !== null && registro.estaca_inicial !== undefined
          ? String(registro.estaca_inicial)
          : '',
      estaca_final:
        registro.estaca_final !== null && registro.estaca_final !== undefined
          ? String(registro.estaca_final)
          : '',
      resultado:
        registro.resultado !== null && registro.resultado !== undefined ? String(registro.resultado) : '',
      tempo_manha: registro.tempo_manha || '',
      tempo_tarde: registro.tempo_tarde || '',
      pista: registro.pista || '',
      lado_pista: registro.lado_pista || '',
      observacao: registro.observacao || '',
    })
  }

  const handleStartEdit = async (registroId) => {
    setError('')
    setSuccess('')

    try {
      const data = await getRegistroById(token, registroId)
      const registro = normalizeRegistro(data)
      fillEditFormFromRegistro(registro)
      setSelectedRegistro(registro)
      setIsEditModalOpen(true)
    } catch (err) {
      setError(err.message || 'Nao foi possivel carregar os dados do registro.')
    }
  }

  const handleStartImages = async (registroId) => {
    setError('')
    setSuccess('')

    try {
      const data = await getRegistroById(token, registroId)
      const registro = normalizeRegistro(data)
      setSelectedRegistro(registro)
      await loadRegistroImages(registro.id)
      setIsImagesModalOpen(true)
    } catch (err) {
      setError(err.message || 'Nao foi possivel carregar as fotos do registro.')
    }
  }

  const handleEditFromImagesModal = () => {
    if (!selectedRegistro) {
      return
    }

    fillEditFormFromRegistro(selectedRegistro)
    setIsImagesModalOpen(false)
    setIsEditModalOpen(true)
  }

  const handleUpdateRegistro = async (event) => {
    event.preventDefault()

    if (!editForm.id) {
      return
    }

    setError('')
    setSuccess('')
    setIsSubmittingEdit(true)

    try {
      const payload = {
        frente_servico_id: Number(editForm.frente_servico_id),
      }

      if (editForm.data.trim()) {
        payload.data = editForm.data
      }

      if (editForm.usuario_registrador_id.trim()) {
        payload.usuario_registrador_id = Number(editForm.usuario_registrador_id)
      }

      if (editForm.estaca_inicial.trim()) {
        payload.estaca_inicial = Number(editForm.estaca_inicial)
      }

      if (editForm.estaca_final.trim()) {
        payload.estaca_final = Number(editForm.estaca_final)
      }

      if (editForm.resultado.trim()) {
        payload.resultado = Number(editForm.resultado)
      }

      if (editForm.tempo_manha.trim()) {
        payload.tempo_manha = editForm.tempo_manha
      }

      if (editForm.tempo_tarde.trim()) {
        payload.tempo_tarde = editForm.tempo_tarde
      }

      if (editForm.pista.trim()) {
        payload.pista = editForm.pista
      }

      if (editForm.lado_pista.trim()) {
        payload.lado_pista = editForm.lado_pista
      }

      if (editForm.observacao.trim()) {
        payload.observacao = editForm.observacao
      }

      await updateRegistro(token, editForm.id, payload)
      setSuccess('Registro atualizado com sucesso.')
      setSelectedRegistro(null)
      setIsEditModalOpen(false)
      setRegistroImages([])
      setEditForm({
        id: null,
        data: '',
        frente_servico_id: '',
        usuario_registrador_id: '',
        estaca_inicial: '',
        estaca_final: '',
        resultado: '',
        tempo_manha: '',
        tempo_tarde: '',
        pista: '',
        lado_pista: '',
        observacao: '',
      })
      await loadRegistros()
    } catch (err) {
      setError(err.message || 'Nao foi possivel atualizar o registro.')
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) {
      return
    }

    setError('')
    setSuccess('')
    setIsDeleting(true)

    try {
      await deleteRegistro(token, deleteTarget.id)
      setSuccess('Registro removido com sucesso.')

      if (selectedRegistro?.id === deleteTarget.id) {
        setSelectedRegistro(null)
        setIsEditModalOpen(false)
        setIsImagesModalOpen(false)
        setRegistroImages([])
      }

      setDeleteTarget(null)
      await loadRegistros()
    } catch (err) {
      setError(err.message || 'Nao foi possivel remover o registro.')
    } finally {
      setIsDeleting(false)
    }
  }

  const getFrenteById = (frenteId) =>
    frentes.find((frente) => String(frente.id) === String(frenteId))

  const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('pt-BR')
  }

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-[#292524]">
      <div className="mx-auto flex max-w-7xl gap-4 p-4 sm:p-6 lg:gap-6 lg:p-8">
        <DashboardSidebar user={currentUser} onLogout={handleLogout} />

        <main className="w-full rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#F97316]">Operacao</p>
              <h1 className="mt-1 font-display text-3xl font-extrabold text-stone-900">Registros de obra</h1>
            </div>
            <div className="rounded-xl bg-stone-100 px-4 py-2 text-sm text-stone-700">
              {currentUser ? `${currentUser.nome} (${currentUser.nivel_acesso})` : 'Carregando usuario...'}
            </div>
          </header>

          {isLoading && (
            <div className="mt-8 flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
              <LoaderCircle size={16} className="animate-spin" />
              Carregando registros...
            </div>
          )}

          {!isLoading && (
            <div className="mt-8 space-y-6">
              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
              )}
              {success && (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {success}
                </p>
              )}

              {frentes.length === 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3 text-sm text-amber-700">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Nenhuma frente de servico cadastrada</p>
                    <p className="text-xs mt-1">Cadastre uma frente de servico antes de criar registros.</p>
                  </div>
                </div>
              )}

              <section className="rounded-2xl border border-stone-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-xl font-bold text-stone-900">Lista de registros</h2>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    disabled={frentes.length === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus size={16} />
                    Novo registro
                  </button>
                </div>

                <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-3">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-stone-600">Data</span>
                      <input
                        type="date"
                        value={filters.data}
                        onChange={(event) => handleFilterChange('data', event.target.value)}
                        className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-stone-600">Frente de servico</span>
                      <select
                        value={filters.frente_servico_id}
                        onChange={(event) => handleFilterChange('frente_servico_id', event.target.value)}
                        className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                      >
                        <option value="">Todas</option>
                        {frentes.map((frente) => (
                          <option key={frente.id} value={frente.id}>
                            {frente.nome}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-stone-600">Usuario</span>
                      <select
                        value={filters.usuario_id}
                        onChange={(event) => handleFilterChange('usuario_id', event.target.value)}
                        className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                      >
                        <option value="">Todos</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.nome}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="flex items-end gap-2">
                      <button
                        type="button"
                        onClick={handleApplyFilters}
                        className="rounded-xl bg-[#1C1917] px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
                      >
                        Filtrar
                      </button>
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                    <thead>
                      <tr className="text-left text-stone-500">
                        <th className="px-3 py-2">ID</th>
                        <th className="px-3 py-2">Data</th>
                        <th className="px-3 py-2">Frente</th>
                        <th className="px-3 py-2">Estaca</th>
                        <th className="px-3 py-2">Resultado</th>
                        <th className="px-3 py-2">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registros.map((registro) => (
                        <tr key={registro.id} className="rounded-xl bg-[#F5F5F4] text-stone-700">
                          <td className="rounded-l-xl px-3 py-2">{registro.id}</td>
                          <td className="px-3 py-2">{formatDate(registro.data || registro.created_at)}</td>
                          <td className="px-3 py-2 font-semibold">
                            {getFrenteById(registro.frente_servico_id)?.nome || `Frente #${registro.frente_servico_id}`}
                          </td>
                          <td className="px-3 py-2">
                            {registro.estaca_inicial !== null &&
                            registro.estaca_inicial !== undefined &&
                            registro.estaca_final !== null &&
                            registro.estaca_final !== undefined
                              ? `${Number(registro.estaca_inicial).toFixed(1)} - ${Number(registro.estaca_final).toFixed(1)}`
                              : '-'}
                          </td>
                          <td className="px-3 py-2 font-semibold">
                            {registro.resultado !== null && registro.resultado !== undefined
                              ? `${Number(registro.resultado).toFixed(2)} m`
                              : '-'}
                          </td>
                          <td className="rounded-r-xl px-3 py-2">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleStartImages(registro.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                              >
                                <Images size={14} />
                                Visualizar fotos
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(registro.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                              >
                                <Pencil size={14} />
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(registro)}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                              >
                                <Trash2 size={14} />
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {registros.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-3 py-8 text-center text-stone-500">
                            Nenhum registro encontrado.
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
          title="Novo registro de obra"
          icon={<Plus size={18} className="text-[#F97316]" />}
          onClose={() => setIsCreateModalOpen(false)}
        >
          <form onSubmit={handleCreateRegistro} className="grid gap-3 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 sm:col-span-1 block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Frente de servico *</span>
                <select
                  value={createForm.frente_servico_id}
                  onChange={(event) => handleCreateChange('frente_servico_id', event.target.value)}
                  required
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                >
                  <option value="">Selecionar frente...</option>
                  {frentes.map((frente) => (
                    <option key={frente.id} value={frente.id}>
                      {frente.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Data</span>
                <input
                  type="date"
                  value={createForm.data}
                  onChange={(event) => handleCreateChange('data', event.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Registrador</span>
                <select
                  value={createForm.usuario_registrador_id}
                  onChange={(event) => handleCreateChange('usuario_registrador_id', event.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                >
                  <option value="">Nenhum registrador</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Estaca Inicial</span>
                <input
                  type="number"
                  step="0.1"
                  value={createForm.estaca_inicial}
                  onChange={(event) => handleCreateChange('estaca_inicial', event.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                  placeholder="0.0"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Estaca Final</span>
                <input
                  type="number"
                  step="0.1"
                  value={createForm.estaca_final}
                  onChange={(event) => handleCreateChange('estaca_final', event.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                  placeholder="0.0"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Resultado (m)</span>
                <input
                  type="number"
                  step="0.1"
                  value={createForm.resultado}
                  onChange={(event) => handleCreateChange('resultado', event.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                  placeholder="Opcional - calculado automaticamente"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Tempo (manha)</span>
                <select
                  value={createForm.tempo_manha}
                  onChange={(event) => handleCreateChange('tempo_manha', event.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                >
                  <option value="">-</option>
                  <option value="limpo">Limpo</option>
                  <option value="nublado">Nublado</option>
                  <option value="impraticavel">Impraticavel</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Tempo (tarde)</span>
                <select
                  value={createForm.tempo_tarde}
                  onChange={(event) => handleCreateChange('tempo_tarde', event.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                >
                  <option value="">-</option>
                  <option value="limpo">Limpo</option>
                  <option value="nublado">Nublado</option>
                  <option value="impraticavel">Impraticavel</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Pista</span>
                <select
                  value={createForm.pista}
                  onChange={(event) => handleCreateChange('pista', event.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                >
                  <option value="">-</option>
                  <option value="direito">Direito</option>
                  <option value="esquerdo">Esquerdo</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Lado da Pista</span>
                <select
                  value={createForm.lado_pista}
                  onChange={(event) => handleCreateChange('lado_pista', event.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                >
                  <option value="">-</option>
                  <option value="direito">Direito</option>
                  <option value="esquerdo">Esquerdo</option>
                </select>
              </label>
            </div>

            <label className="block col-span-2">
              <span className="mb-1 block text-xs font-semibold text-stone-600">Observacao</span>
              <textarea
                value={createForm.observacao}
                onChange={(event) => handleCreateChange('observacao', event.target.value)}
                placeholder="Informacoes adicionais (opcional)"
                maxLength={500}
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200 resize-none"
                rows={2}
              />
            </label>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmittingCreate}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-80"
              >
                {isSubmittingCreate && <LoaderCircle size={16} className="animate-spin" />}
                Cadastrar
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

      {isEditModalOpen && selectedRegistro && (
        <ModalShell
          title={`Editar registro #${selectedRegistro.id}`}
          icon={<Pencil size={18} className="text-[#F97316]" />}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedRegistro(null)
            setRegistroImages([])
          }}
        >
          <form onSubmit={handleUpdateRegistro} className="grid gap-3 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 sm:col-span-1 block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Frente de servico *</span>
                <select
                  value={editForm.frente_servico_id}
                  onChange={(event) => handleEditChange('frente_servico_id', event.target.value)}
                  required
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                >
                  <option value="">Selecionar frente...</option>
                  {frentes.map((frente) => (
                    <option key={frente.id} value={frente.id}>
                      {frente.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Data</span>
                <input
                  type="date"
                  value={editForm.data}
                  onChange={(event) => handleEditChange('data', event.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Registrador</span>
                <select
                  value={editForm.usuario_registrador_id}
                  onChange={(event) => handleEditChange('usuario_registrador_id', event.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                >
                  <option value="">Nenhum registrador</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Estaca Inicial</span>
                <input
                  type="number"
                  step="0.1"
                  value={editForm.estaca_inicial}
                  onChange={(event) => handleEditChange('estaca_inicial', event.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                  placeholder="0.0"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Estaca Final</span>
                <input
                  type="number"
                  step="0.1"
                  value={editForm.estaca_final}
                  onChange={(event) => handleEditChange('estaca_final', event.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                  placeholder="0.0"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Resultado (m)</span>
                <input
                  type="number"
                  step="0.1"
                  value={editForm.resultado}
                  onChange={(event) => handleEditChange('resultado', event.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                  placeholder="Opcional - calculado automaticamente"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Tempo (manha)</span>
                <select
                  value={editForm.tempo_manha}
                  onChange={(event) => handleEditChange('tempo_manha', event.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                >
                  <option value="">-</option>
                  <option value="limpo">Limpo</option>
                  <option value="nublado">Nublado</option>
                  <option value="impraticavel">Impraticavel</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Tempo (tarde)</span>
                <select
                  value={editForm.tempo_tarde}
                  onChange={(event) => handleEditChange('tempo_tarde', event.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                >
                  <option value="">-</option>
                  <option value="limpo">Limpo</option>
                  <option value="nublado">Nublado</option>
                  <option value="impraticavel">Impraticavel</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Pista</span>
                <select
                  value={editForm.pista}
                  onChange={(event) => handleEditChange('pista', event.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                >
                  <option value="">-</option>
                  <option value="direito">Direito</option>
                  <option value="esquerdo">Esquerdo</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Lado da Pista</span>
                <select
                  value={editForm.lado_pista}
                  onChange={(event) => handleEditChange('lado_pista', event.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                >
                  <option value="">-</option>
                  <option value="direito">Direito</option>
                  <option value="esquerdo">Esquerdo</option>
                </select>
              </label>
            </div>

            <label className="block col-span-2">
              <span className="mb-1 block text-xs font-semibold text-stone-600">Observacao</span>
              <textarea
                value={editForm.observacao}
                onChange={(event) => handleEditChange('observacao', event.target.value)}
                placeholder="Informacoes adicionais (opcional)"
                maxLength={500}
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200 resize-none"
                rows={2}
              />
            </label>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmittingEdit}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1C1917] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-80"
              >
                {isSubmittingEdit && <LoaderCircle size={16} className="animate-spin" />}
                Salvar alteracoes
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false)
                  setSelectedRegistro(null)
                  setRegistroImages([])
                }}
                className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100"
              >
                Cancelar
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {isImagesModalOpen && selectedRegistro && (
        <ModalShell
          title={`Fotos do registro #${selectedRegistro.id}`}
          icon={<Images size={18} className="text-blue-600" />}
          onClose={() => {
            setIsImagesModalOpen(false)
            setSelectedRegistro(null)
            setRegistroImages([])
          }}
        >
          <section className="rounded-xl border border-stone-200 bg-stone-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-stone-800">Imagens do registro</p>
                <p className="text-xs text-stone-600">
                  {registroImages.length}/{MAX_IMAGES_PER_REGISTRO} imagem(ns)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadAllImages}
                  disabled={isDownloadingAllImages || isLoadingImages || registroImages.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDownloadingAllImages ? <LoaderCircle size={14} className="animate-spin" /> : null}
                  Baixar todas
                </button>

                <button
                  type="button"
                  onClick={handleEditFromImagesModal}
                  className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                >
                  <Pencil size={14} />
                  Editar registro
                </button>

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100">
                  <ImagePlus size={14} />
                  Adicionar imagem
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                    multiple
                    onChange={handleUploadImages}
                    disabled={isUploadingImages || registroImages.length >= MAX_IMAGES_PER_REGISTRO}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {isLoadingImages && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-600">
                <LoaderCircle size={14} className="animate-spin" />
                Carregando imagens...
              </div>
            )}

            {isUploadingImages && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-700">
                <LoaderCircle size={14} className="animate-spin" />
                Enviando imagens...
              </div>
            )}

            {!isLoadingImages && registroImages.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {registroImages.map((image) => {
                  const imageId = getImageId(image)
                  const imageUrl = getImageUrl(image)

                  return (
                    <div key={String(imageId || imageUrl)} className="overflow-hidden rounded-lg border border-stone-200 bg-white">
                      {imageUrl ? (
                        <img src={imageUrl} alt={`Imagem ${imageId || ''}`} className="h-28 w-full object-cover" />
                      ) : (
                        <div className="flex h-28 items-center justify-center bg-stone-100 text-xs text-stone-500">
                          Sem preview
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2 px-2 py-2">
                        <span className="truncate text-[11px] text-stone-600">#{imageId || 's/id'}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDownloadImage(image)}
                            disabled={!imageUrl || downloadingImageId === imageId || isDownloadingAllImages}
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {downloadingImageId === imageId ? (
                              <LoaderCircle size={12} className="animate-spin" />
                            ) : null}
                            Baixar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(imageId)}
                            disabled={!imageId || deletingImageId === imageId}
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingImageId === imageId ? (
                              <LoaderCircle size={12} className="animate-spin" />
                            ) : (
                              <Trash2 size={12} />
                            )}
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {!isLoadingImages && registroImages.length === 0 && (
              <p className="mt-3 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-600">
                Nenhuma imagem anexada a este registro.
              </p>
            )}
          </section>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIsImagesModalOpen(false)
                setSelectedRegistro(null)
                setRegistroImages([])
              }}
              className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100"
            >
              Fechar
            </button>
          </div>
        </ModalShell>
      )}

      {deleteTarget && (
        <ModalShell
          title="Confirmar exclusao"
          icon={<Trash2 size={18} className="text-red-600" />}
          onClose={() => setDeleteTarget(null)}
        >
          <div className="space-y-4">
            <p className="text-sm text-stone-700">
              Deseja realmente excluir o registro <span className="font-semibold">#{deleteTarget.id}</span>?
              Esta acao nao pode ser desfeita.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-80"
              >
                {isDeleting && <LoaderCircle size={16} className="animate-spin" />}
                Excluir registro
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100"
              >
                Cancelar
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  )
}

export default RegistrosPage
