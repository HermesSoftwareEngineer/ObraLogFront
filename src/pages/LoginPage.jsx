import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import AuthSplitLayout from '../components/AuthSplitLayout'
import { loginUser } from '../services/authService'
import { saveAuthSession } from '../services/authStorage'

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const data = await loginUser({
        email,
        senha: password,
      })

      saveAuthSession(data.token, data.user)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Nao foi possivel realizar login.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthSplitLayout
      title="Acompanhe suas obras em tempo real"
      subtitle="Entre na plataforma para visualizar produtividade, ocorrencias e relatorios diarios consolidados."
    >
      <div className="w-full max-w-md">
        <h2 className="font-display text-3xl font-extrabold text-stone-900">Entrar</h2>
        <p className="mt-2 text-sm text-stone-600">Use suas credenciais para acessar o Diario de Obra Digital.</p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-stone-700">E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
              placeholder="voce@empresa.com"
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
                placeholder="Digite sua senha"
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

          <div className="flex justify-end">
            <a href="#" className="text-sm font-semibold text-[#F97316] transition hover:text-orange-500">
              Esqueci minha senha
            </a>
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F97316] px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-80"
          >
            {isLoading && <LoaderCircle size={16} className="animate-spin" />}
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>

          <div className="relative py-2 text-center text-sm text-stone-500">
            <span className="bg-white px-2">ou</span>
            <span className="absolute inset-x-0 top-1/2 -z-10 border-t border-stone-200" />
          </div>

          <p className="text-center text-sm text-stone-600">
            Nao tem conta?{' '}
            <Link to="/cadastro" className="font-semibold text-[#F97316] transition hover:text-orange-500">
              Cadastre-se
            </Link>
          </p>
        </form>
      </div>
    </AuthSplitLayout>
  )
}

export default LoginPage
