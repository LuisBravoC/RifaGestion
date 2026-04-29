import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './lib/toast.jsx'
import { AuthProvider, useAuth } from './lib/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Topbar from './components/Topbar.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Opciones from './pages/Opciones.jsx'
import Campanas from './pages/Campanas.jsx'
import SorteosList from './pages/SorteosList.jsx'
import BoletoGrid from './pages/BoletoGrid.jsx'
import MisBoletos from './pages/MisBoletos.jsx'
import ParticipantesList from './pages/ParticipantesList.jsx'
import ParticipanteDetail from './pages/ParticipanteDetail.jsx'

function AppShell() {
  const { session } = useAuth()
  return (
    <div className="app-shell">
      {session && <Topbar />}
      <main>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/opciones" element={<ProtectedRoute><Opciones /></ProtectedRoute>} />

          {/* Rifas */}
          <Route path="/rifas" element={<ProtectedRoute><Campanas /></ProtectedRoute>} />
          <Route path="/rifas/:campanaId" element={<ProtectedRoute><SorteosList /></ProtectedRoute>} />
          <Route path="/rifas/:campanaId/sorteos/:rifaId" element={<ProtectedRoute><BoletoGrid /></ProtectedRoute>} />

          {/* Rutas protegidas — Participantes */}
          <Route path="/participantes" element={<ProtectedRoute><ParticipantesList /></ProtectedRoute>} />
          <Route path="/participantes/:partId" element={<ProtectedRoute><ParticipanteDetail /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/rifas" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
    <ToastProvider>
      <Routes>
        {/* Login fuera del app-shell — página completamente independiente */}
        <Route path="/login" element={<Login />} />
        {/* Perfil público del comprador — no requiere autenticación */}
        <Route path="/mis-boletos" element={<MisBoletos />} />
        {/* Todo lo demás dentro del app-shell */}
        <Route path="/*" element={<AppShell />} />
      </Routes>
    </ToastProvider>
    </AuthProvider>
  )
}
