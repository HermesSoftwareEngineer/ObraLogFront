import { Link } from 'react-router-dom'
import FeaturesSection from '../components/FeaturesSection'
import FinalCtaSection from '../components/FinalCtaSection'
import HeroTelegramMockup from '../components/HeroTelegramMockup'
import HowItWorksSection from '../components/HowItWorksSection'
import LandingFooter from '../components/LandingFooter'
import LandingHeader from '../components/LandingHeader'

function LandingPage() {
  return (
    <div className="bg-[#F5F5F4] text-[#292524]">
      <LandingHeader />

      <main className="pt-28">
        <section className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="inline-flex rounded-full border border-orange-200 bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#F97316]">
              IA para construcao civil
            </p>
            <h1 className="mt-6 font-display text-4xl font-extrabold leading-tight text-stone-900 sm:text-5xl lg:text-6xl">
              Seu diario de obra no automatico
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-stone-700">
              O peao manda produtividade no Telegram, a IA organiza os dados e a diretoria recebe relatorios claros com ocorrencias e alertas em minutos.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#como-funciona"
                className="rounded-xl border border-stone-900 px-5 py-3 text-sm font-bold text-stone-900 transition hover:bg-stone-900 hover:text-white"
              >
                Ver demonstracao
              </a>
              <Link
                to="/cadastro"
                className="rounded-xl bg-[#F97316] px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-500"
              >
                Comecar agora
              </Link>
            </div>
          </div>

          <HeroTelegramMockup />
        </section>

        <HowItWorksSection />
        <FeaturesSection />
        <FinalCtaSection />
      </main>

      <LandingFooter />
    </div>
  )
}

export default LandingPage
