import { LoaderCircle, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardShell from '../components/DashboardShell'
import {
  createAlertaTipoSimples,
  deleteAlertaTipoSimples,
  listAlertaTiposSimples,
  updateAlertaTipoSimples,
} from '../services/alertasService'
import { clearAuthSession, getAuthToken, getStoredUser } from '../services/authStorage'

function normalizeTipos(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.tipos)) return data.tipos
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  return []
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/55 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl sm:p-6">
        <header className="mb-5 flex items-start justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-stone-900">{title}</h2>
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

function TiposAlertaPage() {
  const navigate = useNavigate()
  const user = useMemo(() => getStoredUser(), [])
  const token = useMemo(() => getAuthToken(), [])
  const [tipos, setTipos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingCreate, setIsSavingCreate] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)

  const [createForm, setCreateForm] = useState({
    nome: '',
    ativo: true,
  })

  const [editForm, setEditForm] = useState({
    nome: '',
    ativo: true,
  })

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  const loadTipos = async () => {
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const data = await listAlertaTiposSimples(token, { ativos_apenas: false })
      setTipos(normalizeTipos(data))
    } catch (err) {
      setError(err.message || 'Nao foi possivel carregar os tipos de alerta.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTipos()
  }, [token])

  const handleCreate = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSavingCreate(true)

    try {
      await createAlertaTipoSimples(token, {
        nome: createForm.nome.trim(),
        ativo: Boolean(createForm.ativo),
      })

      setSuccess('Tipo de alerta criado com sucesso.')
      setCreateForm({ nome: '', ativo: true })
      setIsCreateOpen(false)
      await loadTipos()
    } catch (err) {
      setError(err.message || 'Nao foi possivel criar o tipo de alerta.')
    } finally {
      setIsSavingCreate(false)
    }
  }

  const openEdit = (tipo) => {
    setEditTarget(tipo)
    setEditForm({
      nome: tipo?.nome || '',
      ativo: Boolean(tipo?.ativo),
    })
    setIsEditOpen(true)
  }

  const handleEdit = async (event) => {
    event.preventDefault()
    if (!editTarget?.id) {
      return
    }

    setError('')
    setSuccess('')
    setIsSavingEdit(true)

    try {
      await updateAlertaTipoSimples(token, editTarget.id, {
        nome: editForm.nome.trim(),
        ativo: Boolean(editForm.ativo),
      })

      setSuccess('Tipo de alerta atualizado com sucesso.')
      setIsEditOpen(false)
      setEditTarget(null)
      await loadTipos()
    } catch (err) {
      setError(err.message || 'Nao foi possivel atualizar o tipo de alerta.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget?.id) {
      return
    }

    setError('')
    setSuccess('')
    setIsDeleting(true)

    try {
      await deleteAlertaTipoSimples(token, deleteTarget.id)
      setSuccess('Tipo de alerta removido com sucesso.')
      setDeleteTarget(null)
      await loadTipos()
    } catch (err) {
      setError(err.message || 'Nao foi possivel remover o tipo de alerta.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <DashboardShell user={user} onLogout={handleLogout}>
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#F97316]">Tabelas Auxiliares</p>
            <h1 className="mt-1 font-display text-3xl font-extrabold text-stone-900">Tipos de Alerta</h1>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-500"
          >
            <Plus size={16} />
            Novo tipo
          </button>
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
            Carregando tipos...
          </div>
        ) : (
          <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                <thead>
                  <tr className="text-left text-stone-500">
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Nome</th>
                    <th className="px-3 py-2">Ativo</th>
                    <th className="px-3 py-2">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {tipos.map((tipo) => (
                    <tr key={tipo.id || tipo.nome} className="rounded-xl bg-[#F5F5F4] text-stone-700">
                      <td className="rounded-l-xl px-3 py-2 font-mono text-xs">{tipo.id || '-'}</td>
                      <td className="px-3 py-2 font-semibold">{tipo.nome || '-'}</td>
                      <td className="px-3 py-2">{tipo.ativo ? 'Sim' : 'Nao'}</td>
                      <td className="rounded-r-xl px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(tipo)}
                            className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                          >
                            <Pencil size={14} />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(tipo)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            <Trash2 size={14} />
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {tipos.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-stone-500">
                        Nenhum tipo de alerta encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </DashboardShell>

      {isCreateOpen && (
        <ModalShell title="Novo tipo de alerta" onClose={() => setIsCreateOpen(false)}>
          <form onSubmit={handleCreate} className="grid gap-3">
            <input
              value={createForm.nome}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, nome: event.target.value }))}
              required
              placeholder="Nome"
              className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
            />
            <label className="inline-flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={createForm.ativo}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, ativo: event.target.checked }))}
                className="h-4 w-4 rounded border-stone-300 text-[#F97316] focus:ring-orange-200"
              />
              Ativo
            </label>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isSavingCreate}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-80"
              >
                {isSavingCreate && <LoaderCircle size={16} className="animate-spin" />}
                Criar tipo
              </button>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100"
              >
                Cancelar
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {isEditOpen && editTarget && (
        <ModalShell title={`Editar tipo ${editTarget.nome || ''}`} onClose={() => setIsEditOpen(false)}>
          <form onSubmit={handleEdit} className="grid gap-3">
            <input
              value={editForm.nome}
              onChange={(event) => setEditForm((prev) => ({ ...prev, nome: event.target.value }))}
              required
              placeholder="Nome"
              className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
            />
            <label className="inline-flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={editForm.ativo}
                onChange={(event) => setEditForm((prev) => ({ ...prev, ativo: event.target.checked }))}
                className="h-4 w-4 rounded border-stone-300 text-[#F97316] focus:ring-orange-200"
              />
              Ativo
            </label>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isSavingEdit}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1C1917] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-80"
              >
                {isSavingEdit && <LoaderCircle size={16} className="animate-spin" />}
                Salvar alteracoes
              </button>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100"
              >
                Cancelar
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {deleteTarget && (
        <ModalShell title="Confirmar exclusao" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <p className="text-sm text-stone-700">
              Deseja realmente excluir o tipo <span className="font-semibold">{deleteTarget.nome}</span>?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-80"
              >
                {isDeleting && <LoaderCircle size={16} className="animate-spin" />}
                Excluir tipo
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
    </>
  )
}

export default TiposAlertaPage
