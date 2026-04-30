import { useState } from 'react'
import { Sun, Moon, Globe, Bell, Shield, User, Palette, Info, ChevronRight, Users, Plus, Pencil, Trash2, Check } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs.jsx'
import { useBreadcrumbs } from '../lib/useBreadcrumbs.js'
import { useAuth } from '../lib/AuthContext.jsx'
import { useTheme } from '../lib/ThemeContext.jsx'
import { useQuery } from '../lib/useQuery.js'
import { useToast } from '../lib/toast.jsx'
import * as q from '../lib/rifas-queries.js'
import GrupoBadge from '../components/GrupoBadge.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'

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
  const { user, rol, isAdmin } = useAuth()
  const { theme, setTheme } = useTheme()
  const toast = useToast()

  const { data: grupos, refetch: refetchGrupos } = useQuery(() => q.getGrupos(), [])
  const [grupoForm,    setGrupoForm]    = useState(null)   // null | { id?, nombre, color }
  const [grupoSaving,  setGrupoSaving]  = useState(false)
  const [grupoConfirm, setGrupoConfirm] = useState(null)  // id a eliminar

  const COLORES_PRESET = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316','#84cc16']

  async function handleGrupoSave() {
    if (!grupoForm?.nombre?.trim()) return
    setGrupoSaving(true)
    try {
      if (grupoForm.id) await q.updateGrupo(grupoForm.id, { nombre: grupoForm.nombre.trim(), color: grupoForm.color })
      else              await q.insertGrupo({ nombre: grupoForm.nombre.trim(), color: grupoForm.color })
      toast(grupoForm.id ? 'Grupo actualizado' : 'Grupo creado')
      setGrupoForm(null)
      refetchGrupos()
    } catch { toast('Error al guardar el grupo') }
    finally { setGrupoSaving(false) }
  }

  async function handleGrupoDelete() {
    if (!grupoConfirm) return
    try {
      await q.deleteGrupo(grupoConfirm)
      toast('Grupo eliminado')
      setGrupoConfirm(null)
      refetchGrupos()
    } catch { toast('No se puede eliminar: hay participantes asignados a este grupo') }
  }

  const themeConfig = {
    dark:  { icon: Moon, label: 'Oscuro' },
    light: { icon: Sun,  label: 'Claro'  },
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
              </div>
              <span className={`badge ${rol === 'admin' ? 'badge-liquidado' : 'badge-abonado'}`}>
                {rol}
              </span>
            </div>
            <OptionSection icon={User}   title="Perfil"        description="Nombre, avatar y datos personales"     badge="Próximamente" />
            <OptionSection icon={Shield} title="Seguridad"     description="Contraseña y verificación en dos pasos" badge="Próximamente" />
          </OptionGroup>

          {/* Grupos sociales */}
          {isAdmin && (
          <OptionGroup title="Grupos sociales">
            <div style={{ padding: '.75rem 1rem' }}>
              <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '.75rem' }}>
                Clasifica participantes en grupos para filtrar boletos, historial y pendientes.
              </p>

              {/* Lista */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginBottom: '.75rem' }}>
                {(grupos ?? []).map(g => (
                  <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '.25rem' }}>
                    <GrupoBadge grupo={g} size="md" />
                    <button onClick={() => setGrupoForm({ id: g.id, nombre: g.nombre, color: g.color })}
                      style={iconBtnStyle} title="Editar"><Pencil size={12} /></button>
                    <button onClick={() => setGrupoConfirm(g.id)}
                      style={{ ...iconBtnStyle, color: 'var(--deuda)' }} title="Eliminar"><Trash2 size={12} /></button>
                  </div>
                ))}
                {(grupos ?? []).length === 0 && (
                  <span style={{ fontSize: '.82rem', color: 'var(--text-muted)' }}>Sin grupos todavía.</span>
                )}
              </div>

              {/* Formulario inline */}
              {grupoForm ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', maxWidth: 360 }}>
                  <input
                    value={grupoForm.nombre}
                    onChange={e => setGrupoForm(f => ({ ...f, nombre: e.target.value }))}
                    placeholder="Nombre del grupo"
                    style={{ ...inputStyle }}
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') handleGrupoSave(); if (e.key === 'Escape') setGrupoForm(null) }}
                  />
                  <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
                    {COLORES_PRESET.map(c => (
                      <button key={c} onClick={() => setGrupoForm(f => ({ ...f, color: c }))}
                        style={{
                          width: 22, height: 22, borderRadius: '50%', border: '2px solid',
                          borderColor: grupoForm.color === c ? '#000' : 'transparent',
                          background: c, cursor: 'pointer', padding: 0, flexShrink: 0,
                          outline: grupoForm.color === c ? '2px solid var(--accent-light)' : 'none',
                          outlineOffset: 1,
                        }}
                      />
                    ))}
                    <input type="color" value={grupoForm.color}
                      onChange={e => setGrupoForm(f => ({ ...f, color: e.target.value }))}
                      style={{ width: 22, height: 22, padding: 0, border: 'none', cursor: 'pointer', borderRadius: '50%' }}
                      title="Color personalizado"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '.4rem' }}>
                    <button className="btn btn-primary btn-sm" onClick={handleGrupoSave} disabled={grupoSaving}>
                      <Check size={13} /> {grupoForm.id ? 'Guardar' : 'Crear'}
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => setGrupoForm(null)}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <button className="btn btn-outline btn-sm"
                  onClick={() => setGrupoForm({ nombre: '', color: COLORES_PRESET[0] })}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}>
                  <Plus size={13} /> Nuevo grupo
                </button>
              )}
            </div>
          </OptionGroup>
          )}

          {/* Apariencia */}
          <OptionGroup title="Apariencia">
            <div className="opciones-item opciones-item-theme">
              <div className="opciones-item-icon"><Palette size={18} /></div>
              <div className="opciones-item-body">
                <span className="opciones-item-label">Tema</span>
                <span className="opciones-item-desc">Elige entre claro u oscuro</span>
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
            <OptionSection icon={Bell} title="Notificaciones de sorteo" description="Avisar sobre boletos vencidos o ganadores pendientes" badge="Próximamente" />
          </OptionGroup>

          {/* Acerca de */}
          <OptionGroup title="Acerca de">
            <div className="opciones-item">
              <div className="opciones-item-icon"><Info size={18} /></div>
              <div className="opciones-item-body">
                <span className="opciones-item-label">RifaGestión</span>
                <span className="opciones-item-desc">Versión 1.0 · Gestión de rifas y sorteos</span>
              </div>
            </div>
          </OptionGroup>

        </div>
      </div>

      {grupoConfirm && (
        <ConfirmModal
          title="Eliminar grupo"
          message="¿Seguro? Los participantes asignados a este grupo quedarán sin grupo."
          onConfirm={handleGrupoDelete}
          onCancel={() => setGrupoConfirm(null)}
        />
      )}
    </>
  )
}

const iconBtnStyle = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--text-muted)', padding: '.1rem', display: 'inline-flex',
  alignItems: 'center',
}
const inputStyle = {
  background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius)', padding: '.4rem .7rem',
  color: 'var(--text)', fontSize: '.875rem', outline: 'none', width: '100%',
}
