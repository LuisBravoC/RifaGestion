import { Sun, Moon, Monitor, Globe, Bell, Shield, User, Palette, Info, ChevronRight } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs.jsx'
import { useBreadcrumbs } from '../lib/useBreadcrumbs.js'
import { useAuth } from '../lib/AuthContext.jsx'
import { useTheme } from '../lib/ThemeContext.jsx'

function OptionSection({ icon: Icon, title, description, badge }) {
  return (
    <div className="opciones-item">
      <div className="opciones-item-icon">
        <Icon size={18} />
      </div>
      <div className="opciones-item-body">
        <span className="opciones-item-label">{title}</span>
        <span className="opciones-item-desc">{description}</span>
      </div>
      {badge && <span className="opciones-badge">{badge}</span>}
      <ChevronRight size={15} className="opciones-chevron" />
    </div>
  )
}

function OptionGroup({ title, children }) {
  return (
    <section className="opciones-group">
      <h2 className="opciones-group-title">{title}</h2>
      <div className="opciones-group-body">
        {children}
      </div>
    </section>
  )
}

export default function Opciones() {
  const crumbs = useBreadcrumbs()
  const { user, rol } = useAuth()
  const { theme, setTheme } = useTheme()

  const themeConfig = {
    dark: { icon: Moon, label: 'Oscuro' },
    light: { icon: Sun, label: 'Claro' },
    //google: { icon: Globe, label: 'Google' }
  }

  return (
    <>
      <Breadcrumbs crumbs={crumbs} />
      <div className="page">
        <div className="page-header" style={{ maxWidth: 620, margin: '0 auto', width: '100%' }}>
          <h1 className="page-title">Opciones</h1>
          <p className="page-subtitle">Personalización y configuración de la aplicación</p>
        </div>

        <div className="opciones-layout">

          {/* Cuenta */}
          <OptionGroup title="Cuenta">
            <div className="opciones-item opciones-item-account">
              <div className="opciones-item-avatar">
                {(user?.email ?? '?')[0].toUpperCase()}
              </div>
              <div className="opciones-item-body">
                <span className="opciones-item-label">{user?.email ?? '—'}</span>
                {/* <span className="opciones-item-desc">Rol: {rol ?? '—'}</span>*/}
              </div>
              <span className={`badge ${rol === 'admin' ? 'badge-liquidado' : 'badge-abonado'}`}>
                {rol}
              </span>
            </div>
            <OptionSection icon={User}   title="Perfil"        description="Nombre, avatar y datos personales"     badge="Próximamente" />
            <OptionSection icon={Shield} title="Seguridad"     description="Contraseña y verificación en dos pasos" badge="Próximamente" />
          </OptionGroup>

          {/* Apariencia */}
          <OptionGroup title="Apariencia">
            <div className="opciones-item opciones-item-theme">
              <div className="opciones-item-icon"><Palette size={18} /></div>
              <div className="opciones-item-body">
                <span className="opciones-item-label">Tema</span>
                <span className="opciones-item-desc">Elige entre claro, oscuro o estilo Google</span>
              </div>
              <div className="opciones-theme-pills">
                {Object.entries(themeConfig).map(([key, { icon: Icon, label }]) => (
                  <button
                    key={key}
                    className={`theme-pill ${theme === key ? 'theme-pill-active' : ''}`}
                    onClick={() => setTheme(key)}
                    title={`Tema ${label}`}
                  >
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
            </div>
          </OptionGroup>

          {/* Idioma y región */}
          <OptionGroup title="Idioma y región">
            <div className="opciones-item">
              <div className="opciones-item-icon"><Globe size={18} /></div>
              <div className="opciones-item-body">
                <span className="opciones-item-label">Idioma</span>
                <span className="opciones-item-desc">Español (México)</span>
              </div>
              <span className="opciones-badge">Próximamente</span>
              <ChevronRight size={15} className="opciones-chevron" />
            </div>
          </OptionGroup>

          {/* Notificaciones */}
          <OptionGroup title="Notificaciones">
            <OptionSection icon={Bell}  title="Alertas de deuda"    description="Avisar cuando un alumno supere X días sin pago"  badge="Próximamente" />
          </OptionGroup>

          {/* Acerca de */}
          <OptionGroup title="Acerca de">
            <div className="opciones-item">
              <div className="opciones-item-icon"><Info size={18} /></div>
              <div className="opciones-item-body">
                <span className="opciones-item-label">FotoGestión</span>
                <span className="opciones-item-desc">Versión 1.0 · Gestión de pagos fotográficos</span>
              </div>
            </div>
          </OptionGroup>

        </div>
      </div>
    </>
  )
}
