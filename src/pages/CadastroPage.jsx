import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import AuthSplitLayout from '../components/AuthSplitLayout'
import { registerUser } from '../services/authService'
import { saveAuthSession } from '../services/authStorage'

function CadastroPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('As senhas nao conferem.')
      return
    }

    if (!acceptedTerms) {
      setError('Voce precisa aceitar os termos para continuar.')
      return
    }

    setIsLoading(true)

    try {
      const data = await registerUser({
        nome: fullName,
        email,
        senha: password,
        telefone: phone.trim() || undefined,
      })

      saveAuthSession(data.token, {
        ...data.user,
        empresa: companyName,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Nao foi possivel criar sua conta.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthSplitLayout
      title="Comece seu Diario de Obra Digital"
      subtitle="Cadastre sua construtora e centralize a produtividade de campo em um fluxo automatizado com IA."
    >
      <div className="w-full max-w-md">
        <h2 className="font-display text-3xl font-extrabold text-stone-900">Criar conta</h2>
        <p className="mt-2 text-sm text-stone-600">Leva menos de 2 minutos para ativar seu ambiente.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-stone-700">Nome completo</span>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
              placeholder="Seu nome"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-stone-700">E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
              placeholder="voce@construtora.com"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-stone-700">Nome da empresa / construtora</span>
            <input
              type="text"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              required
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
              placeholder="Construtora Exemplo"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-stone-700">Telefone (opcional)</span>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
              placeholder="(11) 99999-9999"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-stone-700">Senha</span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-xl border border-stone-300 px-4 py-3 pr-11 text-sm outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                placeholder="Crie uma senha"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute inset-y-0 right-0 px-3 text-stone-500 transition hover:text-stone-800"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-stone-700">Confirmar senha</span>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                className="w-full rounded-xl border border-stone-300 px-4 py-3 pr-11 text-sm outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                placeholder="Repita sua senha"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="absolute inset-y-0 right-0 px-3 text-stone-500 transition hover:text-stone-800"
                aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-stone-200 p-3 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-stone-300 text-[#F97316] focus:ring-orange-300"
            />
            <span>Eu aceito os termos de uso e a politica de privacidade.</span>
          </label>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F97316] px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-80"
          >
            {isLoading && <LoaderCircle size={16} className="animate-spin" />}
            {isLoading ? 'Criando conta...' : 'Criar conta'}
          </button>

          <p className="text-center text-sm text-stone-600">
            Ja tem conta?{' '}
            <Link to="/login" className="font-semibold text-[#F97316] transition hover:text-orange-500">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </AuthSplitLayout>
  )
}

export default CadastroPage
