import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './lib/toast.jsx'
import { AuthProvider, useAuth } from './lib/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Topbar from './components/Topbar.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Instituciones from './pages/Instituciones.jsx'
import Generaciones from './pages/Generaciones.jsx'
import Grupos from './pages/Grupos.jsx'
import AlumnosList from './pages/AlumnosList.jsx'
import AlumnoDetail from './pages/AlumnoDetail.jsx'
import Deudas from './pages/Deudas.jsx'
import Paquetes from './pages/Paquetes.jsx'
import Opciones from './pages/Opciones.jsx'
// ── Rifas ──────────────────────────────────────────────────────────────────
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
          {/* Rutas protegidas — Fotografía */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/instituciones" element={<ProtectedRoute><Instituciones /></ProtectedRoute>} />
          <Route path="/instituciones/:instId" element={<ProtectedRoute><Generaciones /></ProtectedRoute>} />
          <Route path="/instituciones/:instId/proyectos/:proyId" element={<ProtectedRoute><Grupos /></ProtectedRoute>} />
          <Route path="/instituciones/:instId/proyectos/:proyId/grupos/:grupoId" element={<ProtectedRoute><AlumnosList /></ProtectedRoute>} />
          <Route path="/instituciones/:instId/proyectos/:proyId/grupos/:grupoId/alumnos/:alumnoId" element={<ProtectedRoute><AlumnoDetail /></ProtectedRoute>} />
          <Route path="/deudas" element={<ProtectedRoute><Deudas /></ProtectedRoute>} />
          <Route path="/paquetes" element={<ProtectedRoute><Paquetes /></ProtectedRoute>} />
          <Route path="/opciones" element={<ProtectedRoute><Opciones /></ProtectedRoute>} />

          {/* Rutas protegidas — Rifas */}
          <Route path="/rifas" element={<ProtectedRoute><Campanas /></ProtectedRoute>} />
          <Route path="/rifas/:campanaId" element={<ProtectedRoute><SorteosList /></ProtectedRoute>} />
          <Route path="/rifas/:campanaId/sorteos/:rifaId" element={<ProtectedRoute><BoletoGrid /></ProtectedRoute>} />

          {/* Rutas protegidas — Participantes */}
          <Route path="/participantes" element={<ProtectedRoute><ParticipantesList /></ProtectedRoute>} />
          <Route path="/participantes/:partId" element={<ProtectedRoute><ParticipanteDetail /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
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
