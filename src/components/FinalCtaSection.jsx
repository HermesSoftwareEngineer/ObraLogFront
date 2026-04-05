import { Link } from 'react-router-dom'

function FinalCtaSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-6 rounded-3xl bg-[#F97316] p-8 text-white sm:p-10 lg:flex-row lg:items-center">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-100">Transforme seu diario hoje</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
            Menos retrabalho administrativo, mais decisao com dados reais da obra
          </h2>
        </div>

        <Link
          to="/cadastro"
          className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#1C1917] transition hover:bg-stone-100"
        >
          Criar conta gratis
        </Link>
      </div>
    </section>
  )
}

export default FinalCtaSection
