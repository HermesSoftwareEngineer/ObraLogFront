import BrandLogo from './BrandLogo'

function LandingFooter() {
  return (
    <footer id="contato" className="border-t border-stone-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col justify-between gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        <div>
          <BrandLogo className="mb-3" />
          <p className="max-w-md text-sm text-stone-600">
            Plataforma de IA para digitalizar a coleta de produtividade no canteiro e automatizar relatorios da diretoria.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold text-stone-600">
          <a className="transition hover:text-[#F97316]" href="#como-funciona">
            Como funciona
          </a>
          <a className="transition hover:text-[#F97316]" href="#funcionalidades">
            Funcionalidades
          </a>
          <a className="transition hover:text-[#F97316]" href="#contato">
            Contato
          </a>
        </div>
      </div>
    </footer>
  )
}

export default LandingFooter
