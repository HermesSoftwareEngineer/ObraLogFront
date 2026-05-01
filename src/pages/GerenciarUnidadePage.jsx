import { Building2, LoaderCircle, Pencil, Save, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardShell from '../components/DashboardShell'
import { clearAuthSession, getAuthToken, getStoredUser } from '../services/authStorage'
import { getTenant, updateTenant } from '../services/tenantService'

const LOCATION_TYPE_OPTIONS = [
  { value: 'estaca', label: 'Estaca' },
  { value: 'km', label: 'KM' },
  { value: 'text', label: 'Texto livre' },
]

const EDITABLE_FIELDS = [
  'nome',
  'tipo_negocio',
  'location_type',
  'cnpj',
  'razao_social',
  'nome_fantasia',
  'logradouro',
  'numero',
  'complemento',
  'cep',
  'cidade',
  'estado',
  'telefone_comercial',
  'email_comercial',
]

function toFormData(tenantData = {}) {
  return {
    nome: tenantData.nome || '',
    tipo_negocio: tenantData.tipo_negocio || '',
    location_type: tenantData.location_type || 'estaca',
    cnpj: tenantData.cnpj || '',
    razao_social: tenantData.razao_social || '',
    nome_fantasia: tenantData.nome_fantasia || '',
    logradouro: tenantData.logradouro || '',
    numero: tenantData.numero || '',
    complemento: tenantData.complemento || '',
    cep: tenantData.cep || '',
    cidade: tenantData.cidade || '',
    estado: tenantData.estado || '',
    telefone_comercial: tenantData.telefone_comercial || '',
    email_comercial: tenantData.email_comercial || '',
  }
}

function buildPatchPayload(original = {}, current = {}) {
  return EDITABLE_FIELDS.reduce((payload, field) => {
    const originalValue = original[field] || ''
    const currentValue = current[field] || ''

    if (originalValue !== currentValue) {
      payload[field] = currentValue
    }

    return payload
  }, {})
}

function ReadOnlyInput({ label, value, disabled = false, ...props }) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</span>
      <input
        {...props}
        disabled={disabled}
        value={value}
        className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none transition focus:border-stone-500 disabled:bg-stone-100 disabled:text-stone-500"
      />
    </label>
  )
}

function GerenciarUnidadePage() {
  const navigate = useNavigate()
  const token = useMemo(() => getAuthToken(), [])
  const user = useMemo(() => getStoredUser(), [])

  const [tenant, setTenant] = useState(null)
  const [formData, setFormData] = useState(toFormData())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  const loadTenant = async () => {
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    const data = await getTenant(token)
    setTenant(data)
    setFormData(toFormData(data))
  }

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true)
      setError('')

      try {
        await loadTenant()
      } catch (err) {
        setError(err.message || 'Nao foi possivel carregar os dados da unidade.')
        if (err.status === 401 || err.status === 403) {
          handleLogout()
        }
      } finally {
        setIsLoading(false)
      }
    }

    bootstrap()
  }, [token, navigate])

  const handleFieldChange = (field, value) => {
    const normalizedValue = field === 'estado' ? value.toUpperCase().slice(0, 2) : value
    setFormData((prev) => ({ ...prev, [field]: normalizedValue }))
  }

  const handleStartEdit = () => {
    setError('')
    setSuccess('')
    setFormData(toFormData(tenant || {}))
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setError('')
    setSuccess('')
    setFormData(toFormData(tenant || {}))
    setIsEditing(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!tenant) {
      return
    }

    const payload = buildPatchPayload(toFormData(tenant), formData)

    if (Object.keys(payload).length === 0) {
      setSuccess('Nenhuma alteracao para salvar.')
      setIsEditing(false)
      return
    }

    setError('')
    setSuccess('')
    setIsSaving(true)

    try {
      const updatedTenant = await updateTenant(token, payload)
      setTenant(updatedTenant)
      setFormData(toFormData(updatedTenant))
      setIsEditing(false)
      setSuccess('Dados da unidade atualizados com sucesso.')
    } catch (err) {
      setError(err.message || 'Nao foi possivel atualizar os dados da unidade.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardShell user={user} onLogout={handleLogout}>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-[#F97316]">Administracao</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-stone-900">Gerenciar unidade</h1>
        </div>

        {!isLoading && (
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
              >
                <Pencil size={16} />
                Editar
              </button>
            )}
            {isEditing && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
              >
                <X size={16} />
                Cancelar
              </button>
            )}
          </div>
        )}
      </header>

      {isLoading && (
        <div className="mt-8 flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
          <LoaderCircle size={16} className="animate-spin" />
          Carregando dados da unidade...
        </div>
      )}

      {!isLoading && (
        <div className="mt-8 space-y-6">
          {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {success && (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </p>
          )}

          <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                <Building2 size={18} />
              </span>
              <h2 className="font-display text-xl font-bold text-stone-900">Dados da unidade</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">ID da unidade</span>
                  <input
                    value={tenant?.tenant_id || ''}
                    disabled
                    className="w-full rounded-xl border border-stone-300 bg-stone-100 px-3 py-2.5 text-sm text-stone-500"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Slug</span>
                  <input
                    value={tenant?.slug || ''}
                    disabled
                    className="w-full rounded-xl border border-stone-300 bg-stone-100 px-3 py-2.5 text-sm text-stone-500"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Status</span>
                  <input
                    value={tenant?.ativo ? 'Ativa' : 'Inativa'}
                    disabled
                    className="w-full rounded-xl border border-stone-300 bg-stone-100 px-3 py-2.5 text-sm text-stone-500"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <ReadOnlyInput
                  label="Nome da unidade"
                  value={formData.nome}
                  disabled={!isEditing}
                  onChange={(event) => handleFieldChange('nome', event.target.value)}
                />
                <ReadOnlyInput
                  label="Tipo de negocio"
                  value={formData.tipo_negocio}
                  disabled={!isEditing}
                  onChange={(event) => handleFieldChange('tipo_negocio', event.target.value)}
                />

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Tipo de localizacao</span>
                  <select
                    value={formData.location_type}
                    disabled={!isEditing}
                    onChange={(event) => handleFieldChange('location_type', event.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none transition focus:border-stone-500 disabled:bg-stone-100 disabled:text-stone-500"
                  >
                    {LOCATION_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <ReadOnlyInput
                  label="CNPJ"
                  value={formData.cnpj}
                  disabled={!isEditing}
                  onChange={(event) => handleFieldChange('cnpj', event.target.value)}
                />
                <ReadOnlyInput
                  label="Razao social"
                  value={formData.razao_social}
                  disabled={!isEditing}
                  onChange={(event) => handleFieldChange('razao_social', event.target.value)}
                />
                <ReadOnlyInput
                  label="Nome fantasia"
                  value={formData.nome_fantasia}
                  disabled={!isEditing}
                  onChange={(event) => handleFieldChange('nome_fantasia', event.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="lg:col-span-2">
                  <ReadOnlyInput
                    label="Logradouro"
                    value={formData.logradouro}
                    disabled={!isEditing}
                    onChange={(event) => handleFieldChange('logradouro', event.target.value)}
                  />
                </div>
                <ReadOnlyInput
                  label="Numero"
                  value={formData.numero}
                  disabled={!isEditing}
                  onChange={(event) => handleFieldChange('numero', event.target.value)}
                />
                <ReadOnlyInput
                  label="Complemento"
                  value={formData.complemento}
                  disabled={!isEditing}
                  onChange={(event) => handleFieldChange('complemento', event.target.value)}
                />
                <ReadOnlyInput
                  label="CEP"
                  value={formData.cep}
                  disabled={!isEditing}
                  onChange={(event) => handleFieldChange('cep', event.target.value)}
                />
                <ReadOnlyInput
                  label="Cidade"
                  value={formData.cidade}
                  disabled={!isEditing}
                  onChange={(event) => handleFieldChange('cidade', event.target.value)}
                />
                <ReadOnlyInput
                  label="Estado"
                  value={formData.estado}
                  maxLength={2}
                  disabled={!isEditing}
                  onChange={(event) => handleFieldChange('estado', event.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <ReadOnlyInput
                  label="Telefone comercial"
                  value={formData.telefone_comercial}
                  disabled={!isEditing}
                  onChange={(event) => handleFieldChange('telefone_comercial', event.target.value)}
                />
                <ReadOnlyInput
                  label="Email comercial"
                  value={formData.email_comercial}
                  disabled={!isEditing}
                  onChange={(event) => handleFieldChange('email_comercial', event.target.value)}
                />
              </div>

              {isEditing && (
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#1C1917] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#292524] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSaving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
                    {isSaving ? 'Salvando...' : 'Salvar alteracoes'}
                  </button>
                </div>
              )}
            </form>
          </section>
        </div>
      )}
    </DashboardShell>
  )
}

export default GerenciarUnidadePage