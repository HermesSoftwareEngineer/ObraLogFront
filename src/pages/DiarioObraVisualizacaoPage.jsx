import { ArrowLeft, Camera, CalendarRange, FileBadge2, Printer } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

const STORAGE_KEY = 'diario_visualizacao_payload'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '')
const API_PREFIX = '/api/v1'

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

function parseDiasPeriodo(payload) {
  if (!payload) {
    return []
  }

  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload?.dias)) {
    return payload.dias
  }

  if (Array.isArray(payload?.items)) {
    return payload.items
  }

  if (Array.isArray(payload?.data)) {
    return payload.data
  }

  return []
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

  if (normalizedUrl.startsWith('/backend/uploads/') || normalizedUrl.startsWith('/uploads/')) {
    return `${API_BASE_URL}${normalizedUrl}`
  }

  if (normalizedUrl.startsWith('api/') || normalizedUrl.startsWith('backend/uploads/') || normalizedUrl.startsWith('uploads/')) {
    return `${API_BASE_URL}/${normalizedUrl}`
  }

  if (normalizedUrl.startsWith('/')) {
    return `${API_BASE_URL}${API_PREFIX}${normalizedUrl}`
  }

  return `${API_BASE_URL}${API_PREFIX}/${normalizedUrl}`
}

function extractRecordImages(record) {
  const rawSources = [
    record?.imagens,
    record?.images,
    record?.fotos,
    record?.photos,
    record?.photo_urls,
    record?.image_urls,
  ]

  const firstArray = rawSources.find((entry) => Array.isArray(entry)) || []

  return firstArray
    .map((item) => {
      if (typeof item === 'string') {
        return resolveImageUrl(item)
      }

      if (item && typeof item === 'object') {
        const url =
          item.url ||
          item.imagem_url ||
          item.image_url ||
          item.external_url ||
          item.storage_path ||
          item.path

        return resolveImageUrl(url)
      }

      return ''
    })
    .filter(Boolean)
}

function extractRegistrosFromObject(source) {
  if (!source || typeof source !== 'object') {
    return []
  }

  const candidates = [source.registros, source.items, source.data]
  const found = candidates.find((entry) => Array.isArray(entry))
  return found || []
}

function buildSections(tipo, payload) {
  if (!payload) {
    return []
  }

  if (tipo === 'periodo') {
    const days = parseDiasPeriodo(payload)

    return days.map((day, index) => ({
      id: `${day.data || index}`,
      data: day.data || '-',
      frente: day.frente_nome || day.frente_servico_id || '-',
      registros: extractRegistrosFromObject(day),
    }))
  }

  return [
    {
      id: payload.data || 'dia',
      data: payload.data || '-',
      frente: payload.frente_nome || payload.frente_servico_id || '-',
      registros: extractRegistrosFromObject(payload),
    },
  ]
}

function recordDescription(record) {
  return (
    record?.descricao ||
    record?.description ||
    record?.observacao ||
    record?.raw_text ||
    record?.texto ||
    'Sem descricao informada.'
  )
}

function DiarioObraVisualizacaoPage() {
  const navigate = useNavigate()

  const reportData = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (!raw) {
        return null
      }

      return JSON.parse(raw)
    } catch {
      return null
    }
  }, [])

  const tipo = reportData?.tipo || 'dia'
  const payload = reportData?.payload || null
  const geradoEm = reportData?.generatedAt || null
  const usuarioNome = reportData?.usuario?.nome || 'Usuario autenticado'
  const sections = buildSections(tipo, payload)
  const totalRegistros = sections.reduce((sum, section) => sum + section.registros.length, 0)
  const totalFotos = sections.reduce(
    (sum, section) =>
      sum + section.registros.reduce((nestedSum, record) => nestedSum + extractRecordImages(record).length, 0),
    0
  )

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffedd5_0%,#f5f5f4_40%,#e7e5e4_100%)] p-4 sm:p-8">
      <style>{`
        @page {
          size: A4;
          margin: 6mm;
        }

        @media print {
          html,
          body {
            background: #f5f5f4 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .report-actions {
            display: none !important;
          }

          .report-shell {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            border: 1px solid #e7e5e4 !important;
            box-shadow: none !important;
            border-radius: 12px !important;
            padding: 5mm !important;
            background: #ffffff !important;
          }

          .report-shell,
          .report-shell * {
            box-sizing: border-box !important;
            text-wrap: pretty;
          }

          .report-shell p,
          .report-shell span,
          .report-shell td,
          .report-shell th,
          .report-shell h1,
          .report-shell h2,
          .report-shell h3 {
            word-break: normal !important;
            overflow-wrap: break-word !important;
            hyphens: none !important;
          }

          .report-meta-tags {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 1.5mm !important;
          }

          .report-photo-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
            gap: 1.5mm !important;
          }

          .report-section {
            break-inside: auto;
            page-break-inside: auto;
            margin-top: 3mm !important;
          }

          .report-record-card {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          img {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="report-actions mx-auto mb-4 flex w-full max-w-5xl items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => navigate('/dashboard/diario-obra')}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
        >
          <ArrowLeft size={14} />
          Voltar
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1C1917] px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
        >
          <Printer size={14} />
          Imprimir / PDF
        </button>
      </div>

      {!reportData || !payload ? (
        <div className="report-shell mx-auto w-full max-w-4xl rounded-3xl border border-stone-200 bg-white p-8 shadow-xl">
          <h1 className="font-display text-3xl font-extrabold text-stone-900">Laudo de diario indisponivel</h1>
          <p className="mt-3 text-stone-600">
            Nenhum conteudo foi encontrado para visualizacao. Volte para Diario de Obra e execute uma consulta.
          </p>
        </div>
      ) : (
        <article className="report-shell mx-auto w-full max-w-5xl rounded-3xl border border-stone-200 bg-white p-8 shadow-xl sm:p-10">
          <header className="border-b border-stone-200 pb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">Laudo Tecnico</p>
              <h1 className="mt-2 font-display text-3xl font-extrabold text-stone-900">Diario de Obra</h1>
              <p className="mt-2 max-w-2xl text-sm text-stone-600">
                Relatorio consolidado para uso operacional e documental, pronto para impressao e arquivamento.
              </p>
            </div>
          </header>

          {sections.length === 0 && (
            <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
              Nenhum registro encontrado para montar o laudo deste diario.
            </section>
          )}

          {sections.map((section) => (
            <section key={section.id} className="report-section mt-6 rounded-2xl border border-stone-200 bg-white p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2 text-stone-900">
                  <CalendarRange size={16} />
                  <h2 className="font-display text-xl font-bold">Data {section.data}</h2>
                </div>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                  Frente: {section.frente}
                </span>
              </div>

              {section.registros.length === 0 ? (
                <p className="text-sm text-stone-600">Nenhum registro detalhado para esta data.</p>
              ) : (
                <div className="grid gap-4">
                  {section.registros.map((record, index) => {
                    const fotos = extractRecordImages(record)
                    const idRegistro = record?.id || record?.registro_id || `registro-${index + 1}`

                    return (
                      <article key={String(idRegistro)} className="report-record-card rounded-xl border border-stone-200 bg-stone-50 p-4">
                        <header className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-wider text-stone-500">Registro</p>
                            <h3 className="mt-1 font-display text-lg font-bold text-stone-900">#{idRegistro}</h3>
                          </div>

                          <div className="text-right text-xs text-stone-600">
                            <p>{formatDateTime(record?.created_at || record?.data)}</p>
                            <p>{record?.usuario_nome || record?.registrador_nome || '-'}</p>
                          </div>
                        </header>

                        <div className="mt-3 text-sm leading-relaxed text-stone-800">
                          <p className="text-base font-extrabold text-stone-900 sm:text-lg">
                            Resultado: {record?.resultado ?? '-'} | Estaca: {record?.estaca_inicial ?? '-'} - {record?.estaca_final ?? '-'}
                          </p>
                          <p className="mt-1 text-xs font-medium text-stone-600">
                            Tempo manha: {record?.tempo_manha || '-'} | Tempo tarde: {record?.tempo_tarde || '-'}
                          </p>
                          <div className="mt-2 flex items-center gap-2 text-stone-900">
                            <FileBadge2 size={12} />
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Observacao</p>
                          </div>
                          <p className="mt-1 text-xs text-stone-600">{recordDescription(record)}</p>
                        </div>

                        <section className="mt-4">
                          <div className="mb-2 flex items-center gap-2 text-stone-900">
                            <Camera size={14} />
                            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Fotos do registro</p>
                          </div>

                          {fotos.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-stone-300 bg-white px-3 py-4 text-sm text-stone-500">
                              Sem fotos anexadas.
                            </div>
                          ) : (
                            <div className="report-photo-grid grid grid-cols-2 gap-2 sm:grid-cols-3">
                              {fotos.map((fotoUrl, fotoIndex) => (
                                <div key={`${idRegistro}-foto-${fotoIndex}`} className="overflow-hidden rounded-lg border border-stone-200 bg-white">
                                  <img
                                    src={fotoUrl}
                                    alt={`Foto ${fotoIndex + 1} do registro ${idRegistro}`}
                                    className="h-36 w-full object-cover"
                                    loading="lazy"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </section>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          ))}

          <footer className="mt-8 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-[11px] text-stone-500">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
              <span>Tipo: {tipo === 'periodo' ? 'Periodo' : 'Dia'}</span>
              <span>Gerado em: {formatDateTime(geradoEm)}</span>
              <span>Responsavel: {usuarioNome}</span>
              <span>Registros no laudo: {totalRegistros}</span>
              <span>Fotos anexadas: {totalFotos}</span>
            </div>
          </footer>
        </article>
      )}
    </div>
  )
}

export default DiarioObraVisualizacaoPage
