import { KeyRound, LoaderCircle, Pencil, Plus, Trash2, UserRound, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardSidebar from '../components/DashboardSidebar'
import { generateTelegramLinkCode, getCurrentUser } from '../services/authService'
import { clearAuthSession, getAuthToken } from '../services/authStorage'
import { createUser, deleteUser, getUserById, listUsers, updateUser } from '../services/usersService'

const accessLevels = ['administrador', 'gerente', 'encarregado']

function ModalShell({ title, icon, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/55 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl sm:p-6">
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

function normalizeUser(data) {
  if (data?.user) {
    return data.user
  }

  if (data?.usuario) {
    return data.usuario
  }

  return data
}

function UsuariosPage() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [telegramCodeTarget, setTelegramCodeTarget] = useState(null)
  const [telegramCodeResult, setTelegramCodeResult] = useState(null)
  const [createForm, setCreateForm] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    nivel_acesso: 'encarregado',
    telegram_chat_id: '',
  })
  const [editForm, setEditForm] = useState({
    id: null,
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    nivel_acesso: 'encarregado',
    telegram_chat_id: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isGeneratingTelegramCode, setIsGeneratingTelegramCode] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const token = useMemo(() => getAuthToken(), [])

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
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

        if (meData.user?.nivel_acesso !== 'administrador') {
          setError('Apenas administradores podem acessar a gestao de usuarios.')
          return
        }

        await loadUsers()
      } catch (err) {
        setError(err.message || 'Nao foi possivel carregar os usuarios.')
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

  const handleCreateUser = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSubmittingCreate(true)

    try {
      const payload = {
        nome: createForm.nome,
        email: createForm.email,
        senha: createForm.senha,
        nivel_acesso: createForm.nivel_acesso,
      }

      if (createForm.telefone.trim()) {
        payload.telefone = createForm.telefone.trim()
      }

      if (createForm.telegram_chat_id.trim()) {
        payload.telegram_chat_id = createForm.telegram_chat_id.trim()
      }

      await createUser(token, payload)
      setSuccess('Usuario cadastrado com sucesso.')
      setCreateForm({
        nome: '',
        email: '',
        senha: '',
        telefone: '',
        nivel_acesso: 'encarregado',
        telegram_chat_id: '',
      })
      setIsCreateModalOpen(false)
      await loadUsers()
    } catch (err) {
      setError(err.message || 'Nao foi possivel criar o usuario.')
    } finally {
      setIsSubmittingCreate(false)
    }
  }

  const handleStartEdit = async (userId) => {
    setError('')
    setSuccess('')

    try {
      const data = await getUserById(token, userId)
      const user = normalizeUser(data)
      setEditForm({
        id: user.id,
        nome: user.nome || '',
        email: user.email || '',
        senha: '',
        telefone: user.telefone || '',
        nivel_acesso: user.nivel_acesso || 'encarregado',
        telegram_chat_id: user.telegram_chat_id || '',
      })
      setSelectedUser(user)
      setIsEditModalOpen(true)
    } catch (err) {
      setError(err.message || 'Nao foi possivel carregar os dados do usuario.')
    }
  }

  const handleUpdateUser = async (event) => {
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
        email: editForm.email,
        telefone: editForm.telefone.trim() || null,
        nivel_acesso: editForm.nivel_acesso,
        telegram_chat_id: editForm.telegram_chat_id.trim() || null,
      }

      if (editForm.senha.trim()) {
        payload.senha = editForm.senha.trim()
      }

      await updateUser(token, editForm.id, payload)
      setSuccess('Usuario atualizado com sucesso.')
      setSelectedUser(null)
      setIsEditModalOpen(false)
      setEditForm({
        id: null,
        nome: '',
        email: '',
        senha: '',
        telefone: '',
        nivel_acesso: 'encarregado',
        telegram_chat_id: '',
      })
      await loadUsers()
    } catch (err) {
      setError(err.message || 'Nao foi possivel atualizar o usuario.')
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  const handleRequestDeleteUser = (user) => {
    setDeleteTarget(user)
  }

  const handleOpenTelegramCodeModal = (user) => {
    setTelegramCodeTarget(user)
    setTelegramCodeResult(null)
  }

  const handleGenerateTelegramCode = async () => {
    if (!telegramCodeTarget?.id) {
      return
    }

    setError('')
    setSuccess('')
    setIsGeneratingTelegramCode(true)

    try {
      const payload = {
        user_id: telegramCodeTarget.id,
      }

      const data = await generateTelegramLinkCode(token, payload)
      setTelegramCodeResult(data.link_code || null)
      setSuccess('Codigo de vinculo gerado com sucesso.')
    } catch (err) {
      setError(err.message || 'Nao foi possivel gerar codigo de vinculo do Telegram.')
    } finally {
      setIsGeneratingTelegramCode(false)
    }
  }

  const handleConfirmDeleteUser = async () => {
    if (!deleteTarget?.id) {
      return
    }

    setError('')
    setSuccess('')
    setIsDeleting(true)

    try {
      await deleteUser(token, deleteTarget.id)
      setSuccess('Usuario removido com sucesso.')

      if (selectedUser?.id === deleteTarget.id) {
        setSelectedUser(null)
        setIsEditModalOpen(false)
      }

      setDeleteTarget(null)
      await loadUsers()
    } catch (err) {
      setError(err.message || 'Nao foi possivel remover o usuario.')
    } finally {
      setIsDeleting(false)
    }
  }

  const isAdmin = currentUser?.nivel_acesso === 'administrador'

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-[#292524]">
      <div className="mx-auto flex max-w-7xl gap-4 p-4 sm:p-6 lg:gap-6 lg:p-8">
        <DashboardSidebar user={currentUser} onLogout={handleLogout} />

        <main className="w-full rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#F97316]">Administracao</p>
              <h1 className="mt-1 font-display text-3xl font-extrabold text-stone-900">Usuarios</h1>
            </div>
            <div className="rounded-xl bg-stone-100 px-4 py-2 text-sm text-stone-700">
              {currentUser ? `${currentUser.nome} (${currentUser.nivel_acesso})` : 'Carregando usuario...'}
            </div>
          </header>

          {isLoading && (
            <div className="mt-8 flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
              <LoaderCircle size={16} className="animate-spin" />
              Carregando usuarios...
            </div>
          )}

          {!isLoading && !isAdmin && (
            <p className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error || 'Acesso negado. Esta area e exclusiva para administradores.'}
            </p>
          )}

          {!isLoading && isAdmin && (
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
                  <h2 className="font-display text-xl font-bold text-stone-900">Lista de usuarios</h2>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-500"
                  >
                    <Plus size={16} />
                    Cadastrar usuario
                  </button>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                    <thead>
                      <tr className="text-left text-stone-500">
                        <th className="px-3 py-2">ID</th>
                        <th className="px-3 py-2">Nome</th>
                        <th className="px-3 py-2">E-mail</th>
                        <th className="px-3 py-2">Telefone</th>
                        <th className="px-3 py-2">Nivel</th>
                        <th className="px-3 py-2">Telegram</th>
                        <th className="px-3 py-2">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="rounded-xl bg-[#F5F5F4] text-stone-700">
                          <td className="rounded-l-xl px-3 py-2">{user.id}</td>
                          <td className="px-3 py-2 font-semibold">{user.nome}</td>
                          <td className="px-3 py-2">{user.email}</td>
                          <td className="px-3 py-2">{user.telefone || '-'}</td>
                          <td className="px-3 py-2">{user.nivel_acesso}</td>
                          <td className="px-3 py-2">{user.telegram_chat_id || '-'}</td>
                          <td className="rounded-r-xl px-3 py-2">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(user.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                              >
                                <Pencil size={14} />
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenTelegramCodeModal(user)}
                                className="inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-100"
                              >
                                <KeyRound size={14} />
                                Codigo TG
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRequestDeleteUser(user)}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                              >
                                <Trash2 size={14} />
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {users.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-3 py-8 text-center text-stone-500">
                            Nenhum usuario encontrado.
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
          title="Cadastrar usuario"
          icon={<Plus size={18} className="text-[#F97316]" />}
          onClose={() => setIsCreateModalOpen(false)}
        >
          <form onSubmit={handleCreateUser} className="grid gap-3 md:grid-cols-2">
            <input
              value={createForm.nome}
              onChange={(event) => handleCreateChange('nome', event.target.value)}
              required
              placeholder="Nome completo"
              className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
            />
            <input
              type="email"
              value={createForm.email}
              onChange={(event) => handleCreateChange('email', event.target.value)}
              required
              placeholder="E-mail"
              className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
            />
            <input
              type="password"
              value={createForm.senha}
              onChange={(event) => handleCreateChange('senha', event.target.value)}
              required
              placeholder="Senha"
              className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
            />
            <input
              value={createForm.telefone}
              onChange={(event) => handleCreateChange('telefone', event.target.value)}
              placeholder="Telefone (opcional)"
              className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
            />
            <select
              value={createForm.nivel_acesso}
              onChange={(event) => handleCreateChange('nivel_acesso', event.target.value)}
              className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
            >
              {accessLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
            <input
              value={createForm.telegram_chat_id}
              onChange={(event) => handleCreateChange('telegram_chat_id', event.target.value)}
              placeholder="Telegram chat id (opcional)"
              className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200 md:col-span-2"
            />
            <div className="flex gap-2 md:col-span-2">
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

      {isEditModalOpen && selectedUser && (
        <ModalShell
          title={`Editar usuario #${selectedUser.id}`}
          icon={<UserRound size={18} className="text-[#F97316]" />}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedUser(null)
          }}
        >
          <form onSubmit={handleUpdateUser} className="grid gap-3 md:grid-cols-2">
            <input
              value={editForm.nome}
              onChange={(event) => handleEditChange('nome', event.target.value)}
              required
              placeholder="Nome completo"
              className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
            />
            <input
              type="email"
              value={editForm.email}
              onChange={(event) => handleEditChange('email', event.target.value)}
              required
              placeholder="E-mail"
              className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
            />
            <input
              type="password"
              value={editForm.senha}
              onChange={(event) => handleEditChange('senha', event.target.value)}
              placeholder="Nova senha (opcional)"
              className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
            />
            <input
              value={editForm.telefone}
              onChange={(event) => handleEditChange('telefone', event.target.value)}
              placeholder="Telefone (opcional)"
              className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
            />
            <select
              value={editForm.nivel_acesso}
              onChange={(event) => handleEditChange('nivel_acesso', event.target.value)}
              className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
            >
              {accessLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
            <input
              value={editForm.telegram_chat_id}
              onChange={(event) => handleEditChange('telegram_chat_id', event.target.value)}
              placeholder="Telegram chat id"
              className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200 md:col-span-2"
            />
            <div className="flex gap-2 md:col-span-2">
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
                  setSelectedUser(null)
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
              Deseja realmente excluir o usuario <span className="font-semibold">{deleteTarget.nome}</span>?
              Esta acao nao pode ser desfeita.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={isDeleting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-80"
              >
                {isDeleting && <LoaderCircle size={16} className="animate-spin" />}
                Excluir usuario
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

      {telegramCodeTarget && (
        <ModalShell
          title={`Gerar codigo Telegram - ${telegramCodeTarget.nome}`}
          icon={<KeyRound size={18} className="text-[#F97316]" />}
          onClose={() => setTelegramCodeTarget(null)}
        >
          <div className="space-y-4">
            <div>
              <button
                type="button"
                onClick={handleGenerateTelegramCode}
                disabled={isGeneratingTelegramCode}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-80"
              >
                {isGeneratingTelegramCode && <LoaderCircle size={16} className="animate-spin" />}
                Gerar codigo
              </button>
            </div>

            {telegramCodeResult && (
              <div className="rounded-xl border border-stone-200 bg-[#F5F5F4] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Codigo gerado</p>
                <p className="mt-1 font-mono text-2xl font-extrabold tracking-wider text-stone-900">
                  {telegramCodeResult.code}
                </p>
                <p className="mt-2 text-xs text-stone-600">Expira em: {telegramCodeResult.expires_at}</p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setTelegramCodeTarget(null)}
                className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100"
              >
                Fechar
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  )
}

export default UsuariosPage
