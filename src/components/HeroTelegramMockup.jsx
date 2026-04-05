import { Bot, Hammer, UserRound } from 'lucide-react'

function Bubble({ side, icon, name, text }) {
  const isWorker = side === 'worker'

  return (
    <div className={`flex gap-3 ${isWorker ? 'justify-end' : 'justify-start'}`}>
      {!isWorker && (
        <div className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-stone-700 shadow">
          {icon}
        </div>
      )}

      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-left shadow-sm ${
          isWorker ? 'rounded-tr-sm bg-sky-500 text-white' : 'rounded-tl-sm bg-white text-stone-800'
        }`}
      >
        <p className={`text-xs font-semibold ${isWorker ? 'text-sky-100' : 'text-stone-500'}`}>
          {name}
        </p>
        <p className="mt-1 text-sm leading-relaxed">{text}</p>
      </div>

      {isWorker && (
        <div className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-[#F97316] shadow">
          {icon}
        </div>
      )}
    </div>
  )
}

function HeroTelegramMockup() {
  return (
    <div className="relative">
      <div className="absolute -left-10 -top-8 h-24 w-24 rounded-full bg-orange-300/40 blur-2xl" />
      <div className="absolute -bottom-12 right-6 h-28 w-28 rounded-full bg-sky-300/40 blur-2xl" />

      <div className="relative rounded-3xl border border-stone-200 bg-gradient-to-br from-stone-50 via-white to-orange-50 p-5 shadow-xl shadow-stone-300/40">
        <div className="mb-4 flex items-center justify-between border-b border-stone-200 pb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Telegram</p>
            <p className="font-display text-lg font-bold text-stone-900">Obra Central - Bot IA</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            Online
          </span>
        </div>

        <div className="space-y-3">
          <Bubble
            side="worker"
            name="Peao - Joao"
            icon={<UserRound size={16} />}
            text="Frente B: 128 m2 concretados, 1 betoneira com falha no motor."
          />
          <Bubble
            side="bot"
            name="Bot Diario"
            icon={<Bot size={16} />}
            text="Dados registrados. Gerando resumo para diretoria e alerta da maquina quebrada."
          />
          <Bubble
            side="worker"
            name="Encarregado"
            icon={<Hammer size={16} />}
            text="Produtividade da equipe A concluida. Foto anexada da etapa de armacao."
          />
        </div>
      </div>
    </div>
  )
}

export default HeroTelegramMockup
