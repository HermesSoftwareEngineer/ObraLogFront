import { BriefcaseBusiness, LoaderCircle, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardSidebar from '../components/DashboardSidebar'
import { getCurrentUser } from '../services/authService'
import { clearAuthSession, getAuthToken } from '../services/authStorage'
import {
  createFrenteServico,
  deleteFrenteServico,
  getFrenteServicoById,
  listFrentesServico,
  updateFrenteServico,
} from '../services/frentesServicoService'
import { listUsers } from '../services/usersService'

function ModalShell({ title, icon, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/55 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl sm:p-6">
        <header className="mb-5 flex items-start justify-between gap-3">
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

function normalizeFrente(data) {
  if (data?.frente_servico) {
    return data.frente_servico
  }

  if (data?.frenteServico) {
    return data.frenteServico
  }

  return data
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

function FrentesServicoPage() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)
  const [frentes, setFrentes] = useState([])
  const [users, setUsers] = useState([])
  const [selectedFrente, setSelectedFrente] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [createForm, setCreateForm] = useState({
    nome: '',
    encarregado_responsavel: '',
    observacao: '',
  })
  const [editForm, setEditForm] = useState({
    id: null,
    nome: '',
    encarregado_responsavel: '',
    observacao: '',
  })
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
        await Promise.all([loadFrentes(), loadUsers()])
      } catch (err) {
        setError(err.message || 'Nao foi possivel carregar as frentes de servico.')
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

  const handleCreateFrente = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSubmittingCreate(true)

    try {
      const payload = {
        nome: createForm.nome,
      }

      if (createForm.encarregado_responsavel.trim()) {
        payload.encarregado_responsavel = Number(createForm.encarregado_responsavel)
      }

      if (createForm.observacao.trim()) {
        payload.observacao = createForm.observacao
      }

      await createFrenteServico(token, payload)
      setSuccess('Frente de servico cadastrada com sucesso.')
      setCreateForm({
        nome: '',
        encarregado_responsavel: '',
        observacao: '',
      })
      setIsCreateModalOpen(false)
      await loadFrentes()
    } catch (err) {
      setError(err.message || 'Nao foi possivel criar a frente de servico.')
    } finally {
      setIsSubmittingCreate(false)
    }
  }

  const handleStartEdit = async (frenteId) => {
    setError('')
    setSuccess('')

    try {
      const data = await getFrenteServicoById(token, frenteId)
      const frente = normalizeFrente(data)
      setEditForm({
        id: frente.id,
        nome: frente.nome || '',
        encarregado_responsavel: frente.encarregado_responsavel
          ? String(frente.encarregado_responsavel)
          : '',
        observacao: frente.observacao || '',
      })
      setSelectedFrente(frente)
      setIsEditModalOpen(true)
    } catch (err) {
      setError(err.message || 'Nao foi possivel carregar os dados da frente de servico.')
    }
  }

  const handleUpdateFrente = async (event) => {
    event.preventDefault()

    if (!editForm.id) {
      return
    }

    setError('')
    setSuccess('')
    setIsSubmittingEdit(true)

    try {
      const payload = {
        nome: editForm.nome,
        encarregado_responsavel: editForm.encarregado_responsavel.trim()
          ? Number(editForm.encarregado_responsavel)
          : null,
      }

      if (editForm.observacao.trim()) {
        payload.observacao = editForm.observacao
      }

      await updateFrenteServico(token, editForm.id, payload)
      setSuccess('Frente de servico atualizada com sucesso.')
      setSelectedFrente(null)
      setIsEditModalOpen(false)
      setEditForm({
        id: null,
        nome: '',
        encarregado_responsavel: '',
        observacao: '',
      })
      await loadFrentes()
    } catch (err) {
      setError(err.message || 'Nao foi possivel atualizar a frente de servico.')
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
      await deleteFrenteServico(token, deleteTarget.id)
      setSuccess('Frente de servico removida com sucesso.')

      if (selectedFrente?.id === deleteTarget.id) {
        setSelectedFrente(null)
        setIsEditModalOpen(false)
      }

      setDeleteTarget(null)
      await loadFrentes()
    } catch (err) {
      setError(err.message || 'Nao foi possivel remover a frente de servico.')
    } finally {
      setIsDeleting(false)
    }
  }

  const getUserById = (userId) => users.find((user) => String(user.id) === String(userId))

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-[#292524]">
      <div className="mx-auto flex max-w-7xl gap-4 p-4 sm:p-6 lg:gap-6 lg:p-8">
        <DashboardSidebar user={currentUser} onLogout={handleLogout} />

        <main className="w-full rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#F97316]">Operacao</p>
              <h1 className="mt-1 font-display text-3xl font-extrabold text-stone-900">Frentes de servico</h1>
            </div>
            <div className="rounded-xl bg-stone-100 px-4 py-2 text-sm text-stone-700">
              {currentUser ? `${currentUser.nome} (${currentUser.nivel_acesso})` : 'Carregando usuario...'}
            </div>
          </header>

          {isLoading && (
            <div className="mt-8 flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
              <LoaderCircle size={16} className="animate-spin" />
              Carregando frentes de servico...
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

              <section className="rounded-2xl border border-stone-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-xl font-bold text-stone-900">Lista de frentes</h2>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-500"
                  >
                    <Plus size={16} />
                    Cadastrar frente
                  </button>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                    <thead>
                      <tr className="text-left text-stone-500">
                        <th className="px-3 py-2">ID</th>
                        <th className="px-3 py-2">Nome</th>
                        <th className="px-3 py-2">Encarregado</th>
                        <th className="px-3 py-2">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {frentes.map((frente) => (
                        <tr key={frente.id} className="rounded-xl bg-[#F5F5F4] text-stone-700">
                          <td className="rounded-l-xl px-3 py-2">{frente.id}</td>
                          <td className="px-3 py-2 font-semibold">{frente.nome}</td>
                          <td className="px-3 py-2">
                            {frente.encarregado_responsavel ? (
                              <>
                                <span className="font-semibold">
                                  {getUserById(frente.encarregado_responsavel)?.nome ||
                                    `Usuario #${frente.encarregado_responsavel}`}
                                </span>
                                <span className="ml-1 text-xs text-stone-500">
                                  ({getUserById(frente.encarregado_responsavel)?.email || 'sem e-mail'})
                                </span>
                              </>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="rounded-r-xl px-3 py-2">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(frente.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                              >
                                <Pencil size={14} />
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(frente)}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                              >
                                <Trash2 size={14} />
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {frentes.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-3 py-8 text-center text-stone-500">
                            Nenhuma frente de servico encontrada.
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
          title="Cadastrar frente de servico"
          icon={<BriefcaseBusiness size={18} className="text-[#F97316]" />}
          onClose={() => setIsCreateModalOpen(false)}
        >
          <form onSubmit={handleCreateFrente} className="grid gap-3">
            <input
              value={createForm.nome}
              onChange={(event) => handleCreateChange('nome', event.target.value)}
              required
              placeholder="Nome da frente"
              className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
            />
            <select
              value={createForm.encarregado_responsavel}
              onChange={(event) => handleCreateChange('encarregado_responsavel', event.target.value)}
              className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
            >
              <option value="">Sem encarregado responsavel</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nome} ({user.email})
                </option>
              ))}
            </select>
            <textarea
              value={createForm.observacao}
              onChange={(event) => handleCreateChange('observacao', event.target.value)}
              placeholder="Obs. (opcional)"
              maxLength={500}
              className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200 resize-none"
              rows={3}
            />
            <div className="flex gap-2">
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

      {isEditModalOpen && selectedFrente && (
        <ModalShell
          title={`Editar frente #${selectedFrente.id}`}
          icon={<Pencil size={18} className="text-[#F97316]" />}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedFrente(null)
          }}
        >
          <form onSubmit={handleUpdateFrente} className="grid gap-3">
            <input
              value={editForm.nome}
              onChange={(event) => handleEditChange('nome', event.target.value)}
              required
              placeholder="Nome da frente"
              className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
            />
            <select
              value={editForm.encarregado_responsavel}
              onChange={(event) => handleEditChange('encarregado_responsavel', event.target.value)}
              className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
            >
              <option value="">Sem encarregado responsavel</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nome} ({user.email})
                </option>
              ))}
            </select>
            <textarea
              value={editForm.observacao}
              onChange={(event) => handleEditChange('observacao', event.target.value)}
              placeholder="Obs. (opcional)"
              maxLength={500}
              className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200 resize-none"
              rows={3}
            />
            <div className="flex gap-2">
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
                  setSelectedFrente(null)
                }}
                className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100"
              >
                Cancelar
              </button>
            </div>
          </form>
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
              Deseja realmente excluir a frente <span className="font-semibold">{deleteTarget.nome}</span>?
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
                Excluir frente
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

export default FrentesServicoPage
