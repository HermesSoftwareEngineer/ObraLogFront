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
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '')
const API_PREFIX = '/api/v1'
const TEMPO_OPTIONS = new Set(['limpo', 'nublado', 'impraticavel'])
const LADO_PISTA_OPTIONS = new Set(['direito', 'esquerdo'])

function parseRequiredNumber(rawValue, fieldLabel) {
  const parsedValue = Number(rawValue)
  if (!Number.isFinite(parsedValue)) {
    throw new Error(`Campo obrigatorio invalido: ${fieldLabel}.`)
  }

  return parsedValue
}

function buildRegistroPayloadFromForm(form) {
  const requiredFields = [
    { key: 'data', label: 'Data' },
    { key: 'frente_servico_id', label: 'Frente de servico' },
    { key: 'usuario_registrador_id', label: 'Registrador' },
    { key: 'estaca_inicial', label: 'Estaca inicial' },
    { key: 'estaca_final', label: 'Estaca final' },
    { key: 'tempo_manha', label: 'Tempo (manha)' },
    { key: 'tempo_tarde', label: 'Tempo (tarde)' },
  ]

  const missingLabels = requiredFields
    .filter(({ key }) => !String(form[key] ?? '').trim())
    .map(({ label }) => label)

  if (missingLabels.length > 0) {
    throw new Error(`Preencha os campos obrigatorios: ${missingLabels.join(', ')}.`)
  }

  const data = String(form.data).trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    throw new Error('Data invalida. Use o formato YYYY-MM-DD.')
  }

  const tempoManha = String(form.tempo_manha).trim()
  const tempoTarde = String(form.tempo_tarde).trim()

  if (!TEMPO_OPTIONS.has(tempoManha) || !TEMPO_OPTIONS.has(tempoTarde)) {
    throw new Error('Tempo da manha e da tarde devem ser: limpo, nublado ou impraticavel.')
  }

  const estacaInicial = parseRequiredNumber(String(form.estaca_inicial).trim(), 'Estaca inicial')
  const estacaFinal = parseRequiredNumber(String(form.estaca_final).trim(), 'Estaca final')

  if (estacaFinal < estacaInicial) {
    throw new Error('Estaca final nao pode ser menor que estaca inicial.')
  }

  const payload = {
    data,
    frente_servico_id: parseRequiredNumber(String(form.frente_servico_id).trim(), 'Frente de servico'),
    usuario_registrador_id: parseRequiredNumber(
      String(form.usuario_registrador_id).trim(),
      'Registrador'
    ),
    estaca_inicial: estacaInicial,
    estaca_final: estacaFinal,
    tempo_manha: tempoManha,
    tempo_tarde: tempoTarde,
  }

  const ladoPrincipal = String(form.lado_pista || '').trim() || String(form.pista || '').trim()
  if (ladoPrincipal) {
    if (!LADO_PISTA_OPTIONS.has(ladoPrincipal)) {
      throw new Error('Lado da pista invalido. Use direito ou esquerdo.')
    }

    payload.lado_pista = ladoPrincipal

    const pistaLegada = String(form.pista || '').trim()
    if (pistaLegada && !String(form.lado_pista || '').trim()) {
      payload.pista = pistaLegada
    }
  }

  if (String(form.resultado || '').trim()) {
    payload.resultado = parseRequiredNumber(String(form.resultado).trim(), 'Resultado')
  }

  if (String(form.observacao || '').trim()) {
    payload.observacao = String(form.observacao).trim()
  }

  return payload
}

function resolveImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return ''
  }

  const normalizedUrl = imageUrl.trim()
  if (!normalizedUrl) {
    return ''
  }

  if (/^(https?:|blob:|data:)/i.test(normalizedUrl)) {
    return normalizedUrl
  }

  if (normalizedUrl.startsWith('/api/')) {
    return `${API_BASE_URL}${normalizedUrl}`
  }

  if (normalizedUrl.startsWith('/backend/uploads/')) {
    return `${API_BASE_URL}${normalizedUrl}`
  }

  if (normalizedUrl.startsWith('/uploads/')) {
    return `${API_BASE_URL}${normalizedUrl}`
  }

  if (normalizedUrl.startsWith('api/')) {
    return `${API_BASE_URL}/${normalizedUrl}`
  }

  if (normalizedUrl.startsWith('backend/uploads/')) {
    return `${API_BASE_URL}/${normalizedUrl}`
  }

  if (normalizedUrl.startsWith('uploads/')) {
    return `${API_BASE_URL}/${normalizedUrl}`
  }

  if (normalizedUrl.startsWith('/')) {
    return `${API_BASE_URL}${API_PREFIX}${normalizedUrl}`
  }

  return `${API_BASE_URL}${API_PREFIX}/${normalizedUrl}`
}

function normalizeRegistroImages(data) {
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.data)) {
    return data.data
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
  const directUrl = (
    image?.url ||
    image?.imagem_url ||
    image?.image_url ||
    image?.arquivo_url ||
    image?.path ||
    image?.imagem ||
    image?.file_url ||
    image?.download_url
  )

  if (directUrl) {
    return directUrl
  }

  return (
    image?.arquivo?.url ||
    image?.arquivo?.path ||
    image?.arquivo?.download_url ||
    image?.external_url ||
    image?.links?.download ||
    image?.links?.preview ||
    image?.s3_url ||
    image?.presigned_url ||
    image?.signed_url ||
    image?.storage_path ||
    ''
  )
}

function getImageFileName(image, fallbackId) {
  const originalName = image?.nome_arquivo || image?.file_name || image?.filename || image?.nome
  if (originalName && typeof originalName === 'string') {
    return originalName
  }

  return `registro-imagem-${fallbackId || 'arquivo'}.jpg`
}

function isDirectAssetUrl(imageUrl) {
  if (!imageUrl) {
    return false
  }

  const resolvedUrl = resolveImageUrl(imageUrl)
  return /\/backend\/uploads\//i.test(resolvedUrl) || /\/uploads\//i.test(resolvedUrl)
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
  const [openingImagesRegistroId, setOpeningImagesRegistroId] = useState(null)
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

  const revokeImagePreviews = (images) => {
    images.forEach((image) => {
      const previewUrl = image?._previewObjectUrl
      if (previewUrl && typeof previewUrl === 'string' && previewUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(previewUrl)
      }
    })
  }

  const clearRegistroImages = () => {
    setRegistroImages((previousImages) => {
      revokeImagePreviews(previousImages)
      return []
    })
  }

  const fetchImageBlob = async (imageUrl) => {
    const resolvedUrl = resolveImageUrl(imageUrl)

    if (!resolvedUrl) {
      throw new Error('URL da imagem invalida.')
    }

    const response = await fetch(resolvedUrl)

    if ((response.status === 401 || response.status === 403) && token) {
      const authenticatedResponse = await fetch(resolvedUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!authenticatedResponse.ok) {
        throw new Error('Nao foi possivel carregar a imagem.')
      }

      return authenticatedResponse.blob()
    }

    if (!response.ok) {
      throw new Error('Nao foi possivel carregar a imagem.')
    }

    return response.blob()
  }

  const hydrateImagesWithPreview = async (images) => {
    const imagesWithPreview = await Promise.all(
      images.map(async (image) => {
        const imageUrl = getImageUrl(image)
        if (!imageUrl || isDirectAssetUrl(imageUrl)) {
          return image
        }

        try {
          const blob = await fetchImageBlob(imageUrl)
          return {
            ...image,
            _previewObjectUrl: window.URL.createObjectURL(blob),
          }
        } catch {
          return image
        }
      })
    )

    return imagesWithPreview
  }

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
      clearRegistroImages()
      return
    }

    setIsLoadingImages(true)
    try {
      const imagesData = await listRegistroImagens(token, registroId)
      const normalizedImages = normalizeRegistroImages(imagesData)

      const imagesWithPreview = await hydrateImagesWithPreview(normalizedImages)
      setRegistroImages((previousImages) => {
        revokeImagePreviews(previousImages)
        return imagesWithPreview
      })
    } catch (err) {
      clearRegistroImages()
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
    const blob = await fetchImageBlob(imageUrl)
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
      const payload = buildRegistroPayloadFromForm(createForm)

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
    if (!registroId || openingImagesRegistroId === registroId) {
      return
    }

    setError('')
    setSuccess('')
    setOpeningImagesRegistroId(registroId)

    try {
      const data = await getRegistroById(token, registroId)
      const registro = normalizeRegistro(data)
      setSelectedRegistro(registro)
      await loadRegistroImages(registro.id)
      setIsImagesModalOpen(true)
    } catch (err) {
      setError(err.message || 'Nao foi possivel carregar as fotos do registro.')
    } finally {
      setOpeningImagesRegistroId(null)
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
      const payload = buildRegistroPayloadFromForm(editForm)

      await updateRegistro(token, editForm.id, payload)
      setSuccess('Registro atualizado com sucesso.')
      setSelectedRegistro(null)
      setIsEditModalOpen(false)
      clearRegistroImages()
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
        clearRegistroImages()
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
                                disabled={openingImagesRegistroId === registro.id}
                                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                              >
                                {openingImagesRegistroId === registro.id ? (
                                  <LoaderCircle size={14} className="animate-spin" />
                                ) : (
                                  <Images size={14} />
                                )}
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
                <span className="mb-1 block text-xs font-semibold text-stone-600">Data *</span>
                <input
                  type="date"
                  value={createForm.data}
                  onChange={(event) => handleCreateChange('data', event.target.value)}
                  required
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Registrador *</span>
                <select
                  value={createForm.usuario_registrador_id}
                  onChange={(event) => handleCreateChange('usuario_registrador_id', event.target.value)}
                  required
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
                <span className="mb-1 block text-xs font-semibold text-stone-600">Estaca Inicial *</span>
                <input
                  type="number"
                  step="0.1"
                  value={createForm.estaca_inicial}
                  onChange={(event) => handleCreateChange('estaca_inicial', event.target.value)}
                  required
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                  placeholder="0.0"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Estaca Final *</span>
                <input
                  type="number"
                  step="0.1"
                  value={createForm.estaca_final}
                  onChange={(event) => handleCreateChange('estaca_final', event.target.value)}
                  required
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
                <span className="mb-1 block text-xs font-semibold text-stone-600">Tempo (manha) *</span>
                <select
                  value={createForm.tempo_manha}
                  onChange={(event) => handleCreateChange('tempo_manha', event.target.value)}
                  required
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                >
                  <option value="">-</option>
                  <option value="limpo">Limpo</option>
                  <option value="nublado">Nublado</option>
                  <option value="impraticavel">Impraticavel</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Tempo (tarde) *</span>
                <select
                  value={createForm.tempo_tarde}
                  onChange={(event) => handleCreateChange('tempo_tarde', event.target.value)}
                  required
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                >
                  <option value="">-</option>
                  <option value="limpo">Limpo</option>
                  <option value="nublado">Nublado</option>
                  <option value="impraticavel">Impraticavel</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Pista (compatibilidade legada)</span>
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
                <span className="mb-1 block text-xs font-semibold text-stone-600">Lado da Pista (principal)</span>
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
            clearRegistroImages()
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
                <span className="mb-1 block text-xs font-semibold text-stone-600">Data *</span>
                <input
                  type="date"
                  value={editForm.data}
                  onChange={(event) => handleEditChange('data', event.target.value)}
                  required
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Registrador *</span>
                <select
                  value={editForm.usuario_registrador_id}
                  onChange={(event) => handleEditChange('usuario_registrador_id', event.target.value)}
                  required
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
                <span className="mb-1 block text-xs font-semibold text-stone-600">Estaca Inicial *</span>
                <input
                  type="number"
                  step="0.1"
                  value={editForm.estaca_inicial}
                  onChange={(event) => handleEditChange('estaca_inicial', event.target.value)}
                  required
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                  placeholder="0.0"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Estaca Final *</span>
                <input
                  type="number"
                  step="0.1"
                  value={editForm.estaca_final}
                  onChange={(event) => handleEditChange('estaca_final', event.target.value)}
                  required
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
                <span className="mb-1 block text-xs font-semibold text-stone-600">Tempo (manha) *</span>
                <select
                  value={editForm.tempo_manha}
                  onChange={(event) => handleEditChange('tempo_manha', event.target.value)}
                  required
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                >
                  <option value="">-</option>
                  <option value="limpo">Limpo</option>
                  <option value="nublado">Nublado</option>
                  <option value="impraticavel">Impraticavel</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Tempo (tarde) *</span>
                <select
                  value={editForm.tempo_tarde}
                  onChange={(event) => handleEditChange('tempo_tarde', event.target.value)}
                  required
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                >
                  <option value="">-</option>
                  <option value="limpo">Limpo</option>
                  <option value="nublado">Nublado</option>
                  <option value="impraticavel">Impraticavel</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">Pista (compatibilidade legada)</span>
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
                <span className="mb-1 block text-xs font-semibold text-stone-600">Lado da Pista (principal)</span>
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
                  clearRegistroImages()
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
            clearRegistroImages()
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
                  const imageSrc = image._previewObjectUrl || resolveImageUrl(imageUrl)

                  return (
                    <div key={String(imageId || imageUrl)} className="overflow-hidden rounded-lg border border-stone-200 bg-white">
                      {imageSrc ? (
                        <img src={imageSrc} alt={`Imagem ${imageId || ''}`} className="h-28 w-full object-cover" />
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
                clearRegistroImages()
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
