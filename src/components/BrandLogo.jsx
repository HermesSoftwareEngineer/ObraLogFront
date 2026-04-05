import { HardHat } from 'lucide-react'
import { Link } from 'react-router-dom'

function BrandLogo({ to = '/', className = '' }) {
  return (
    <Link to={to} className={`inline-flex items-center gap-2 ${className}`}>
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#F97316] text-white shadow-sm shadow-orange-400/40">
        <HardHat size={22} strokeWidth={2.25} />
      </span>
      <span className="font-display text-lg font-extrabold tracking-tight text-stone-900">
        Diario de Obra
      </span>
    </Link>
  )
}

export default BrandLogo
