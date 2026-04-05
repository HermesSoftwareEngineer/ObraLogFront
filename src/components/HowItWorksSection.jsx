import { Fragment } from 'react'
import { ArrowRight, Bot, FileText, MessageCircleMore } from 'lucide-react'

const steps = [
  {
    title: 'Peao envia no Telegram',
    description: 'A equipe manda produtividade, ocorrencias e status da obra em mensagens simples.',
    icon: MessageCircleMore,
  },
  {
    title: 'IA estrutura os dados',
    description: 'O sistema organiza automaticamente os textos em campos padronizados e acionaveis.',
    icon: Bot,
  },
  {
    title: 'Diretoria recebe relatorio',
    description: 'Gestores recebem resumo consolidado com pontos de atencao e indicadores do dia.',
    icon: FileText,
  },
]

function HowItWorksSection() {
  return (
    <section id="como-funciona" className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-10 max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#F97316]">Como funciona</p>
        <h2 className="mt-3 font-display text-3xl font-extrabold text-stone-900 sm:text-4xl">
          Fluxo simples para o canteiro, visibilidade total para a gestao
        </h2>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isLast = index === steps.length - 1

          return (
            <Fragment key={step.title}>
              <article
                className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm shadow-stone-200/70"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-[#F97316]">
                  <Icon size={21} />
                </span>
                <h3 className="mt-4 font-display text-xl font-bold text-stone-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{step.description}</p>
              </article>

              {!isLast && (
                <div className="hidden justify-center text-stone-300 lg:flex">
                  <ArrowRight size={24} />
                </div>
              )}
            </Fragment>
          )
        })}
      </div>
    </section>
  )
}

export default HowItWorksSection
