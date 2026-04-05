import { LoaderCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import DashboardSidebar from '../components/DashboardSidebar'
import { generateTelegramLinkCode, getCurrentUser, linkTelegramChatId } from '../services/authService'
import { clearAuthSession, getAuthToken, getStoredUser } from '../services/authStorage'
import { getDashboardOverview } from '../services/dashboardService'

function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(getStoredUser())
  const [overview, setOverview] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [telegramCodeData, setTelegramCodeData] = useState(null)
  const [telegramCodeError, setTelegramCodeError] = useState('')
  const [isGeneratingTelegramCode, setIsGeneratingTelegramCode] = useState(false)
  const [telegramChatId, setTelegramChatId] = useState('')
  const [telegramLinkError, setTelegramLinkError] = useState('')
  const [telegramLinkSuccess, setTelegramLinkSuccess] = useState('')
  const [isLinkingTelegramChat, setIsLinkingTelegramChat] = useState(false)

  useEffect(() => {
    const token = getAuthToken()

    const loadDashboard = async () => {
      if (!token) {
        navigate('/login', { replace: true })
        return
      }

      setIsLoading(true)
      setError('')

      try {
        const [meData, overviewData] = await Promise.all([
          getCurrentUser(token),
          getDashboardOverview(token),
        ])

        setUser(meData.user)
        setOverview(overviewData)
      } catch (err) {
        setError(err.message || 'Nao foi possivel carregar o dashboard.')
        if (err.status === 401 || err.status === 403) {
          clearAuthSession()
          navigate('/login', { replace: true })
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [navigate])

  const chartCards = useMemo(() => {
    const charts = overview?.charts
    if (!charts) {
      return []
    }

    return [
      {
        title: 'Registros (7 dias)',
        value: charts.registros_por_dia_7d?.reduce((total, item) => total + item.total, 0) || 0,
      },
      {
        title: 'Progresso (7 dias)',
        value:
          charts.progresso_por_dia_7d?.reduce((total, item) => total + item.resultado_total, 0).toFixed(2) ||
          '0.00',
      },
      {
        title: 'Frentes com progresso',
        value: charts.progresso_por_frente?.length || 0,
      },
    ]
  }, [overview])

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  const handleGenerateMyTelegramCode = async () => {
    const token = getAuthToken()
    if (!token || !user?.id) {
      return
    }

    setTelegramCodeError('')
    setTelegramLinkSuccess('')
    setIsGeneratingTelegramCode(true)

    try {
      const payload = {
        user_id: user.id,
      }

      const data = await generateTelegramLinkCode(token, payload)
      setTelegramCodeData(data.link_code || null)
    } catch (err) {
      setTelegramCodeError(err.message || 'Nao foi possivel gerar codigo do Telegram.')
    } finally {
      setIsGeneratingTelegramCode(false)
    }
  }

  const handleLinkTelegram = async (event) => {
    event.preventDefault()

    const token = getAuthToken()
    if (!token) {
      return
    }

    setTelegramLinkError('')
    setTelegramLinkSuccess('')
    setIsLinkingTelegramChat(true)

    try {
      const data = await linkTelegramChatId(token, telegramChatId.trim())
      setUser(data.user)
      setTelegramLinkSuccess('Telegram vinculado com sucesso.')
      setTelegramChatId('')
    } catch (err) {
      setTelegramLinkError(err.message || 'Nao foi possivel vincular o Telegram.')
    } finally {
      setIsLinkingTelegramChat(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-[#292524]">
      <div className="mx-auto flex max-w-7xl gap-4 p-4 sm:p-6 lg:gap-6 lg:p-8">
        <DashboardSidebar user={user} onLogout={handleLogout} />

        <main className="w-full rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#F97316]">Painel principal</p>
              <h1 className="mt-1 font-display text-3xl font-extrabold text-stone-900">Dashboard</h1>
            </div>
            <div className="rounded-xl bg-stone-100 px-4 py-2 text-sm text-stone-700">
              {user ? `Bem-vindo, ${user.nome}` : 'Carregando usuario...'}
            </div>
          </header>

          {isLoading && (
            <div className="mt-10 flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
              <LoaderCircle size={16} className="animate-spin" />
              Carregando indicadores...
            </div>
          )}

          {!isLoading && error && (
            <p className="mt-10 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          {!isLoading && !error && overview && (
            <>
              <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-2xl border border-stone-200 bg-[#F5F5F4] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Usuarios</p>
                  <p className="mt-2 text-3xl font-extrabold text-stone-900">{overview.kpis?.usuarios_total || 0}</p>
                </article>
                <article className="rounded-2xl border border-stone-200 bg-[#F5F5F4] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Frentes</p>
                  <p className="mt-2 text-3xl font-extrabold text-stone-900">{overview.kpis?.frentes_servico_total || 0}</p>
                </article>
                <article className="rounded-2xl border border-stone-200 bg-[#F5F5F4] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Registros</p>
                  <p className="mt-2 text-3xl font-extrabold text-stone-900">{overview.kpis?.registros_total || 0}</p>
                </article>
                <article className="rounded-2xl border border-stone-200 bg-[#F5F5F4] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Progresso total</p>
                  <p className="mt-2 text-3xl font-extrabold text-stone-900">{overview.kpis?.progresso_total || 0}</p>
                </article>
              </section>

              <section className="mt-8 grid gap-4 md:grid-cols-3">
                {chartCards.map((chart) => (
                  <article key={chart.title} className="rounded-2xl border border-stone-200 bg-white p-4">
                    <p className="text-sm font-semibold text-stone-600">{chart.title}</p>
                    <p className="mt-3 text-2xl font-extrabold text-[#1C1917]">{chart.value}</p>
                  </article>
                ))}
              </section>

              <section className="mt-8 grid gap-4 lg:grid-cols-2">
                <article className="rounded-2xl border border-stone-200 bg-white p-5">
                  <h2 className="font-display text-xl font-bold text-stone-900">Gerar codigo Telegram</h2>
                  <p className="mt-2 text-sm text-stone-600">
                    Gere seu codigo para vincular o bot no Telegram.
                  </p>

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleGenerateMyTelegramCode}
                      disabled={isGeneratingTelegramCode}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-80"
                    >
                      {isGeneratingTelegramCode && <LoaderCircle size={16} className="animate-spin" />}
                      Gerar codigo
                    </button>
                  </div>

                  {telegramCodeError && (
                    <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {telegramCodeError}
                    </p>
                  )}

                  {telegramCodeData && (
                    <div className="mt-4 rounded-xl border border-stone-200 bg-[#F5F5F4] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Codigo gerado</p>
                      <p className="mt-1 font-mono text-2xl font-extrabold tracking-wider text-stone-900">
                        {telegramCodeData.code}
                      </p>
                      <p className="mt-2 text-xs text-stone-600">Expira em: {telegramCodeData.expires_at}</p>
                    </div>
                  )}
                </article>

                <article className="rounded-2xl border border-stone-200 bg-white p-5">
                  <h2 className="font-display text-xl font-bold text-stone-900">Vincular telegram_chat_id</h2>
                  <p className="mt-2 text-sm text-stone-600">
                    Use este formulario caso ja tenha o chat id para vincular diretamente.
                  </p>

                  <form onSubmit={handleLinkTelegram} className="mt-4 space-y-3">
                    <input
                      value={telegramChatId}
                      onChange={(event) => setTelegramChatId(event.target.value)}
                      placeholder="telegram_chat_id"
                      required
                      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                    />
                    <button
                      type="submit"
                      disabled={isLinkingTelegramChat}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1C1917] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-80"
                    >
                      {isLinkingTelegramChat && <LoaderCircle size={16} className="animate-spin" />}
                      Vincular Telegram
                    </button>
                  </form>

                  <p className="mt-3 text-xs text-stone-600">
                    Telegram atual: <span className="font-semibold">{user?.telegram_chat_id || 'nao vinculado'}</span>
                  </p>

                  {telegramLinkError && (
                    <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {telegramLinkError}
                    </p>
                  )}

                  {telegramLinkSuccess && (
                    <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                      {telegramLinkSuccess}
                    </p>
                  )}
                </article>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default DashboardPage
