import { Bot, LoaderCircle, MessageSquare, RefreshCcw, User } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardShell from '../components/DashboardShell'
import { getCurrentUser } from '../services/authService'
import { clearAuthSession, getAuthToken } from '../services/authStorage'
import { listChatConversas, listChatMensagensWithFallback } from '../services/mensagensCampoService'

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

function normalizeConversas(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.conversas)) return data.conversas
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  return []
}

function normalizeMensagens(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.mensagens)) return data.mensagens
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  return []
}

function mergeMensagensById(current, incoming) {
  const map = new Map()

  current.forEach((item) => {
    if (item?.id) {
      map.set(String(item.id), item)
    }
  })

  incoming.forEach((item) => {
    if (item?.id) {
      map.set(String(item.id), item)
    }
  })

  return Array.from(map.values())
}

function isBotMessage(mensagem) {
  const direcao = String(mensagem?.direcao || '').trim().toLowerCase()
  if (direcao === 'agent') {
    return true
  }

  if (direcao === 'user') {
    return false
  }

  if (typeof mensagem?.eh_bot === 'boolean') {
    return mensagem.eh_bot
  }

  if (typeof mensagem?.is_bot === 'boolean') {
    return mensagem.is_bot
  }

  const roleLikeFields = [
    mensagem?.role,
    mensagem?.origem,
    mensagem?.autor_tipo,
    mensagem?.remetente_tipo,
    mensagem?.sender_type,
    mensagem?.from,
  ]

  const hasBotRole = roleLikeFields.some((value) => {
    const normalized = String(value || '').trim().toLowerCase()
    return ['bot', 'assistant', 'agente', 'agent', 'ia'].includes(normalized)
  })

  if (hasBotRole) {
    return true
  }

  return false
}

function getMessageDirection(mensagem) {
  const direcao = String(mensagem?.direcao || '').trim().toLowerCase()
  if (direcao === 'agent' || direcao === 'user') {
    return direcao
  }

  return isBotMessage(mensagem) ? 'agent' : 'user'
}

function MensagensCampoPage() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)
  const [conversas, setConversas] = useState([])
  const [mensagens, setMensagens] = useState([])
  const [selectedChatId, setSelectedChatId] = useState('')
  const [isLoadingConversas, setIsLoadingConversas] = useState(true)
  const [isLoadingMensagens, setIsLoadingMensagens] = useState(false)
  const [error, setError] = useState('')
  const [conversasPage, setConversasPage] = useState(1)
  const [conversasPerPage] = useState(50)
  const [conversasTotal, setConversasTotal] = useState(0)
  const [mensagensPage, setMensagensPage] = useState(1)
  const [mensagensPerPage] = useState(50)
  const [mensagensTotal, setMensagensTotal] = useState(0)
  const messagesContainerRef = useRef(null)
  const shouldScrollToBottomRef = useRef(false)
  const prependSnapshotRef = useRef(null)

  const token = useMemo(() => getAuthToken(), [])

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  const loadMensagens = async (chatId, page = 1, append = false) => {
    if (!chatId) {
      setMensagens([])
      setMensagensPage(1)
      setMensagensTotal(0)
      return
    }

    setIsLoadingMensagens(true)
    setError('')

    try {
      const data = await listChatMensagensWithFallback(token, chatId, {
        page,
        per_page: mensagensPerPage,
      })

      const nextMensagens = normalizeMensagens(data)
      setMensagens((prev) => (append ? mergeMensagensById(prev, nextMensagens) : nextMensagens))
      setMensagensPage(Number(data?.page) || page)
      setMensagensTotal(Number(data?.total) || 0)

      if (!append) {
        shouldScrollToBottomRef.current = true
      }
    } catch (err) {
      setError(err.message || 'Nao foi possivel carregar as mensagens da conversa.')
    } finally {
      setIsLoadingMensagens(false)
    }
  }

  const loadConversas = async (page = 1) => {
    setIsLoadingConversas(true)
    setError('')

    try {
      const data = await listChatConversas(token, {
        page,
        per_page: conversasPerPage,
      })

      const collection = normalizeConversas(data)
      setConversas(collection)
      setConversasPage(Number(data?.page) || page)
      setConversasTotal(Number(data?.total) || 0)
      return collection
    } catch (err) {
      setError(err.message || 'Nao foi possivel carregar as conversas.')
      return []
    } finally {
      setIsLoadingConversas(false)
    }
  }

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        navigate('/login', { replace: true })
        return
      }

      setIsLoadingConversas(true)
      setError('')

      try {
        const meData = await getCurrentUser(token)
        setCurrentUser(meData.user)

        const firstPageConversas = await loadConversas(1)
        const initialChatId = firstPageConversas[0]?.telegram_chat_id

        if (initialChatId) {
          setSelectedChatId(String(initialChatId))
          await loadMensagens(String(initialChatId), 1, false)
        }
      } catch (err) {
        setError(err.message || 'Nao foi possivel carregar conversas.')
        if (err.status === 401 || err.status === 403) {
          handleLogout()
        }
      } finally {
        setIsLoadingConversas(false)
      }
    }

    bootstrap()
  }, [token, navigate])

  const handleSelectConversa = async (chatId) => {
    if (!chatId) {
      return
    }

    setSelectedChatId(String(chatId))
    setMensagens([])
    await loadMensagens(String(chatId), 1, false)
  }

  const handleLoadMoreMensagens = async () => {
    if (!selectedChatId || mensagens.length >= mensagensTotal || isLoadingMensagens) {
      return
    }

    const container = messagesContainerRef.current
    if (container) {
      prependSnapshotRef.current = {
        scrollHeight: container.scrollHeight,
        scrollTop: container.scrollTop,
      }
    }

    await loadMensagens(selectedChatId, mensagensPage + 1, true)
  }

  const selectedConversa = conversas.find((item) => String(item.telegram_chat_id) === String(selectedChatId))
  const orderedMensagens = [...mensagens].sort((a, b) => {
    const first = new Date(a?.recebida_em || 0).getTime()
    const second = new Date(b?.recebida_em || 0).getTime()
    return first - second
  })

  const hasMoreMensagens = mensagens.length < mensagensTotal
  const totalConversaPages = Math.max(1, Math.ceil(conversasTotal / conversasPerPage))

  useLayoutEffect(() => {
    const container = messagesContainerRef.current
    if (!container) {
      return
    }

    if (prependSnapshotRef.current) {
      const snapshot = prependSnapshotRef.current
      const delta = container.scrollHeight - snapshot.scrollHeight
      container.scrollTop = snapshot.scrollTop + delta
      prependSnapshotRef.current = null
      return
    }

    if (shouldScrollToBottomRef.current) {
      container.scrollTop = container.scrollHeight
      shouldScrollToBottomRef.current = false
    }
  }, [mensagens, selectedChatId])

  return (
    <DashboardShell user={currentUser} onLogout={handleLogout}>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-[#F97316]">Operacao</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-stone-900">Conversas</h1>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl bg-stone-100 px-4 py-2 text-sm text-stone-700">
          {currentUser ? `${currentUser.nome} (${currentUser.nivel_acesso})` : 'Carregando usuario...'}
          <button
            type="button"
            onClick={() => loadConversas(conversasPage)}
            className="inline-flex items-center rounded-lg border border-stone-300 bg-white p-1.5 text-stone-600 hover:bg-stone-100"
            title="Atualizar conversas"
            aria-label="Atualizar conversas"
          >
            <RefreshCcw size={14} />
          </button>
        </div>
      </header>

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <section className="mt-6 grid h-[calc(100vh-13.5rem)] min-h-[28rem] max-h-[calc(100vh-13.5rem)] gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <div className="border-b border-stone-200 px-3 py-2.5">
            <h2 className="font-display text-lg font-bold text-stone-900">Conversas Telegram</h2>
            <p className="text-xs text-stone-500">{conversasTotal} conversa(s)</p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
            {isLoadingConversas ? (
              <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-600">
                <LoaderCircle size={14} className="animate-spin" />
                Carregando conversas...
              </div>
            ) : conversas.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-stone-500">Nenhuma conversa encontrada.</p>
            ) : (
              <div className="space-y-2">
                {conversas.map((conversa) => {
                  const chatId = String(conversa.telegram_chat_id || '')
                  const isActive = chatId === String(selectedChatId)
                  const usuarioNome = conversa?.usuario?.nome || 'Usuario nao vinculado'

                  return (
                    <button
                      key={chatId}
                      type="button"
                      onClick={() => handleSelectConversa(chatId)}
                      className={`w-full rounded-xl border px-2.5 py-2.5 text-left transition ${
                        isActive
                          ? 'border-stone-900 bg-stone-900 text-white'
                          : 'border-stone-200 bg-stone-50 text-stone-800 hover:border-stone-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{usuarioNome}</p>
                        <span className={`text-[11px] ${isActive ? 'text-stone-200' : 'text-stone-500'}`}>
                          {conversa.total_mensagens || 0}
                        </span>
                      </div>
                      <p className={`mt-0.5 truncate text-xs ${isActive ? 'text-stone-200' : 'text-stone-500'}`}>
                        Chat: {chatId || '-'}
                      </p>
                      <p className={`mt-2 truncate text-xs ${isActive ? 'text-stone-100' : 'text-stone-600'}`}>
                        {conversa.ultima_mensagem_texto || '(sem texto)'}
                      </p>
                      <p className={`mt-2 text-[11px] ${isActive ? 'text-stone-300' : 'text-stone-500'}`}>
                        {formatDateTime(conversa.ultima_mensagem_em)}
                      </p>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-stone-200 px-3 py-2">
            <button
              type="button"
              disabled={conversasPage <= 1 || isLoadingConversas}
              onClick={async () => {
                const nextPage = Math.max(1, conversasPage - 1)
                const loaded = await loadConversas(nextPage)
                if (loaded.length > 0) {
                  await handleSelectConversa(String(loaded[0].telegram_chat_id || ''))
                }
              }}
              className="rounded-lg border border-stone-300 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Anterior
            </button>
            <span className="text-xs text-stone-500">Pagina {conversasPage} de {totalConversaPages}</span>
            <button
              type="button"
              disabled={conversasPage >= totalConversaPages || isLoadingConversas}
              onClick={async () => {
                const nextPage = Math.min(totalConversaPages, conversasPage + 1)
                const loaded = await loadConversas(nextPage)
                if (loaded.length > 0) {
                  await handleSelectConversa(String(loaded[0].telegram_chat_id || ''))
                }
              }}
              className="rounded-lg border border-stone-300 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Proxima
            </button>
          </div>
        </aside>

        <article className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <header className="border-b border-stone-200 px-3 py-2.5">
            {!selectedConversa ? (
              <p className="text-sm text-stone-600">Selecione uma conversa para visualizar as mensagens.</p>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg font-bold text-stone-900">
                    {selectedConversa?.usuario?.nome || 'Usuario nao vinculado'}
                  </h2>
                  <p className="text-xs text-stone-500">Chat {selectedConversa.telegram_chat_id}</p>
                </div>
                <div className="text-right text-xs text-stone-500">
                  <p>Total: {mensagensTotal}</p>
                  <p>Exibindo: {mensagens.length}</p>
                </div>
              </div>
            )}
          </header>

          <div ref={messagesContainerRef} className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAFC] p-3">
            {!selectedConversa ? (
              <div className="flex h-full items-center justify-center text-sm text-stone-500">
                <span className="inline-flex items-center gap-2">
                  <MessageSquare size={16} />
                  Nenhuma conversa selecionada.
                </span>
              </div>
            ) : isLoadingMensagens && mensagens.length === 0 ? (
              <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600">
                <LoaderCircle size={14} className="animate-spin" />
                Carregando mensagens...
              </div>
            ) : orderedMensagens.length === 0 ? (
              <p className="text-center text-sm text-stone-500">Sem mensagens para esta conversa.</p>
            ) : (
              <div className="space-y-3">
                {orderedMensagens.map((mensagem) => {
                  const direction = getMessageDirection(mensagem)
                  const botMessage = direction === 'agent'

                  return (
                  <div key={String(mensagem.id)} className={`flex ${botMessage ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[92%] rounded-2xl border px-3 py-2.5 shadow-sm ${
                        botMessage
                          ? 'border-stone-300 bg-stone-900 text-white'
                          : 'border-stone-200 bg-white text-stone-800'
                      }`}
                    >
                      <div className={`mb-1 flex items-center gap-2 text-[11px] ${botMessage ? 'text-stone-200' : 'text-stone-500'}`}>
                        {botMessage ? <Bot size={12} /> : <User size={12} />}
                        <span>{direction === 'agent' ? 'agent' : 'user'} • {mensagem.tipo_conteudo || 'texto'}</span>
                        <span className={`rounded-full px-2 py-0.5 ${botMessage ? 'bg-stone-700 text-stone-100' : 'bg-stone-100'}`}>
                          {mensagem.status_processamento || 'pendente'}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm">{mensagem.texto || '(sem texto)'}</p>
                      <p className={`mt-2 text-[11px] ${botMessage ? 'text-left text-stone-300' : 'text-right text-stone-500'}`}>
                        {formatDateTime(mensagem.recebida_em)}
                      </p>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>

          <footer className="border-t border-stone-200 px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-stone-500">Visualizacao apenas leitura.</p>
              <button
                type="button"
                onClick={handleLoadMoreMensagens}
                disabled={!selectedChatId || !hasMoreMensagens || isLoadingMensagens}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoadingMensagens ? <LoaderCircle size={13} className="animate-spin" /> : null}
                Carregar mensagens mais antigas
              </button>
            </div>
          </footer>
        </article>
      </section>
    </DashboardShell>
  )
}

export default MensagensCampoPage
