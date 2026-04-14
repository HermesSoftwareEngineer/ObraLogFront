import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AgentInstructionsPage from './pages/AgentInstructionsPage'
import AlertasPage from './pages/AlertasPage'
import CadastroPage from './pages/CadastroPage'
import DashboardPage from './pages/DashboardPage'
import DiarioObraPage from './pages/DiarioObraPage'
import DiarioObraVisualizacaoPage from './pages/DiarioObraVisualizacaoPage'
import FrentesServicoPage from './pages/FrentesServicoPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import MensagensCampoPage from './pages/MensagensCampoPage'
import RegistrosPage from './pages/RegistrosPage'
import RegistrosAuditoriaPage from './pages/RegistrosAuditoriaPage'
import UsuariosPage from './pages/UsuariosPage'
import { getAuthToken } from './services/authStorage'

function App() {
  const hasSession = Boolean(getAuthToken())

  return (
    <div className="font-sans antialiased">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={hasSession ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route
          path="/cadastro"
          element={hasSession ? <Navigate to="/dashboard" replace /> : <CadastroPage />}
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/alertas"
          element={
            <ProtectedRoute>
              <AlertasPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/usuarios"
          element={
            <ProtectedRoute allowedLevels={['administrador']}>
              <UsuariosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/frentes-servico"
          element={
            <ProtectedRoute>
              <FrentesServicoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/mensagens-campo"
          element={
            <ProtectedRoute>
              <MensagensCampoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/registros"
          element={
            <ProtectedRoute>
              <RegistrosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/registros/auditoria"
          element={
            <ProtectedRoute allowedLevels={['gerente']}>
              <RegistrosAuditoriaPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/diario-obra"
          element={
            <ProtectedRoute>
              <DiarioObraPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/diario-obra/visualizar"
          element={
            <ProtectedRoute>
              <DiarioObraVisualizacaoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/agent/instrucoes"
          element={
            <ProtectedRoute allowedLevels={['administrador']}>
              <AgentInstructionsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
