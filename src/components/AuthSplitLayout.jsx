import { Building2 } from 'lucide-react'
import BrandLogo from './BrandLogo'

function AuthSplitLayout({ title, subtitle, children }) {
  return (
    <main className="min-h-screen bg-[#F5F5F4] p-4 sm:p-6 lg:p-8">
      <section className="mx-auto grid min-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl shadow-stone-300/35 lg:grid-cols-2">
        <aside className="relative overflow-hidden bg-[#1C1917] px-6 py-10 text-white sm:px-10 lg:px-12">
          <div className="absolute -right-16 top-10 h-44 w-44 rounded-full bg-orange-500/20 blur-2xl" />
          <div className="absolute -left-10 bottom-8 h-52 w-52 rounded-full bg-stone-500/20 blur-2xl" />

          <BrandLogo className="relative z-10 [&_span:last-child]:text-white" />

          <div className="relative z-10 mt-14 max-w-md">
            <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">{title}</h1>
            <p className="mt-5 text-stone-300">{subtitle}</p>
          </div>

          <div className="relative z-10 mt-12 rounded-2xl border border-white/20 bg-white/5 p-5 backdrop-blur">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#F97316] text-white">
              <Building2 size={24} />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-stone-200">
              Sua obra reporta no Telegram e a IA transforma mensagens em relatorios executivos automaticamente.
            </p>
          </div>
        </aside>

        <div className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-12">{children}</div>
      </section>
    </main>
  )
}

export default AuthSplitLayout
