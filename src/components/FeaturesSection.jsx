import {
  Bell,
  FileSpreadsheet,
  HardHat,
  History,
  ShieldAlert,
  Smartphone,
} from 'lucide-react'

const features = [
  {
    title: 'Diario de obra automatico',
    description: 'Registros diarios sem digitar planilhas no fim do expediente.',
    icon: HardHat,
  },
  {
    title: 'Registro de maquinas quebradas',
    description: 'Falhas viram ocorrencias classificadas com contexto da equipe.',
    icon: ShieldAlert,
  },
  {
    title: 'Relatorios em PDF',
    description: 'Exportacao pronta para reunioes com diretoria e clientes.',
    icon: FileSpreadsheet,
  },
  {
    title: 'Alertas em tempo real',
    description: 'Ocorrencias criticas disparam notificacoes para os responsaveis.',
    icon: Bell,
  },
  {
    title: 'Historico por obra',
    description: 'Tudo organizado por projeto para comparativos e auditoria.',
    icon: History,
  },
  {
    title: 'Sem app para instalar',
    description: 'A equipe usa apenas o Telegram, sem treinamento complexo.',
    icon: Smartphone,
  },
]

function FeaturesSection() {
  return (
    <section id="funcionalidades" className="bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#F97316]">Funcionalidades</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-stone-900 sm:text-4xl">
            Um centro de comando digital para sua operacao de obra
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <article
                key={feature.title}
                className="rounded-2xl border border-stone-200 bg-[#F5F5F4] p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#1C1917] text-white">
                  <Icon size={20} />
                </span>
                <h3 className="mt-4 font-display text-xl font-bold text-stone-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{feature.description}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection
