import { Bot, LoaderCircle, Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardSidebar from '../components/DashboardSidebar'
import { getCurrentUser } from '../services/authService'
import { clearAuthSession, getAuthToken } from '../services/authStorage'
import { getAgentInstructions, updateAgentInstructions } from '../services/agentInstructionsService'

function AgentInstructionsPage() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)
  const [path, setPath] = useState('')
  const [content, setContent] = useState('')
  const [exists, setExists] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const token = useMemo(() => getAuthToken(), [])

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  const loadInstructions = async () => {
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    const data = await getAgentInstructions(token)
    setPath(data?.path || '')
    setContent(data?.content || '')
    setExists(Boolean(data?.exists))
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
          setError('Apenas administradores podem acessar as instrucoes do agente.')
          return
        }

        await loadInstructions()
      } catch (err) {
        setError(err.message || 'Nao foi possivel carregar as instrucoes do agente.')
        if (err.status === 401 || err.status === 403) {
          handleLogout()
        }
      } finally {
        setIsLoading(false)
      }
    }

    bootstrap()
  }, [token, navigate])

  const handleSave = async (event) => {
    event.preventDefault()

    if (!currentUser || currentUser.nivel_acesso !== 'administrador') {
      setError('Apenas administradores podem atualizar as instrucoes do agente.')
      return
    }

    setError('')
    setSuccess('')
    setIsSaving(true)

    try {
      const data = await updateAgentInstructions(token, content)
      setPath(data?.path || path)
      setContent(data?.content || '')
      setExists(true)
      setSuccess('Instrucoes do agente atualizadas com sucesso.')
    } catch (err) {
      setError(err.message || 'Nao foi possivel salvar as instrucoes do agente.')
    } finally {
      setIsSaving(false)
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
              <h1 className="mt-1 font-display text-3xl font-extrabold text-stone-900">
                Instrucoes do Agente
              </h1>
            </div>
            <div className="rounded-xl bg-stone-100 px-4 py-2 text-sm text-stone-700">
              {currentUser ? `${currentUser.nome} (${currentUser.nivel_acesso})` : 'Carregando usuario...'}
            </div>
          </header>

          {isLoading && (
            <div className="mt-8 flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
              <LoaderCircle size={16} className="animate-spin" />
              Carregando instrucoes...
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
                <div className="flex items-center gap-2">
                  <Bot size={18} className="text-[#F97316]" />
                  <h2 className="font-display text-xl font-bold text-stone-900">Arquivo de instrucoes</h2>
                </div>

                <div className="mt-4 grid gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
                  <p>
                    <span className="font-semibold">Arquivo:</span> {path || 'Nao informado'}
                  </p>
                  <p>
                    <span className="font-semibold">Status:</span> {exists ? 'Existe' : 'Nao encontrado'}
                  </p>
                </div>

                <form onSubmit={handleSave} className="mt-4 grid gap-3">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-stone-700">Conteudo completo</span>
                    <textarea
                      value={content}
                      onChange={(event) => setContent(event.target.value)}
                      disabled={!isAdmin || isSaving}
                      className="min-h-[420px] w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-orange-200 disabled:cursor-not-allowed disabled:bg-stone-100"
                      placeholder="Digite o texto completo das instrucoes do agente..."
                    />
                  </label>

                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-stone-500">
                      Salva o arquivo unico de instrucoes em um unico envio.
                    </p>
                    <button
                      type="submit"
                      disabled={!isAdmin || isSaving}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1C1917] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSaving && <LoaderCircle size={16} className="animate-spin" />}
                      {!isSaving && <Save size={16} />}
                      Salvar instrucoes
                    </button>
                  </div>
                </form>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default AgentInstructionsPage
