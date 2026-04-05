import { Link } from 'react-router-dom'
import BrandLogo from './BrandLogo'

function LandingHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-stone-200/80 bg-[#F5F5F4]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <BrandLogo />

        <nav className="hidden items-center gap-8 text-sm font-semibold text-stone-700 md:flex">
          <a href="#como-funciona" className="transition hover:text-[#F97316]">
            Como funciona
          </a>
          <a href="#funcionalidades" className="transition hover:text-[#F97316]">
            Funcionalidades
          </a>
          <a href="#contato" className="transition hover:text-[#F97316]">
            Contato
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/login"
            className="rounded-xl border border-[#1C1917] px-4 py-2 text-sm font-semibold text-[#1C1917] transition hover:bg-stone-100"
          >
            Entrar
          </Link>
          <Link
            to="/cadastro"
            className="rounded-xl bg-[#F97316] px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-500"
          >
            Comecar gratis
          </Link>
        </div>
      </div>
    </header>
  )
}

export default LandingHeader
