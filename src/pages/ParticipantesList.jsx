import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Phone, Mail, ArrowRight, Pencil, Trash2, Plus, CheckCircle2, Clock, AlertCircle, LayoutGrid, List as ListIcon } from 'lucide-react'
import { useQuery } from '../lib/useQuery.js'
import { useToast } from '../lib/toast.jsx'
import { fmt } from '../lib/formatters.js'
import * as q from '../lib/rifas-queries.js'
import Breadcrumbs from '../components/Breadcrumbs.jsx'
import { useBreadcrumbs } from '../lib/useBreadcrumbs.js'
import { useAuth } from '../lib/AuthContext.jsx'
import LoadingSpinner, { ErrorMsg } from '../components/LoadingSpinner.jsx'
import Drawer from '../components/Drawer.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'
import ErrorModal from '../components/ErrorModal.jsx'
import { parseError } from '../lib/parseError.js'

const EMPTY = { nombre_completo: '', telefono_whatsapp: '', email: '' }

export default function ParticipantesList() {
  const navigate = useNavigate()
  const [refresh, setRefresh] = useState(0)
  const crumbs = useBreadcrumbs()
  const { isAdmin } = useAuth()
  const { data, loading, error } = useQuery(() => q.getParticipantes(), [refresh])

  const [search,   setSearch]   = useState('')
  const [viewMode, setViewMode] = useState('cards')  // 'cards' | 'list'
  const [drawer,   setDrawer]   = useState(null)
  const [form,     setForm]     = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)
  const [confirm,  setConfirm]  = useState(null)
  const [errModal, setErrModal] = useState(null)
  const showErr = e => setErrModal(typeof e === 'string' ? { title: 'Aviso', body: e } : (e?.title ? e : parseError(e)))
  const toast = useToast()

  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const done = msg  => { setRefresh(r => r + 1); setDrawer(null); if (msg) toast(msg) }

  function openCreate() { setForm(EMPTY); setDrawer({ mode: 'create' }) }
  function openEdit(p, e) {
    e.stopPropagation()
    setForm({ nombre_completo: p.nombre_completo, telefono_whatsapp: p.telefono_whatsapp ?? '', email: p.email ?? '' })
    setDrawer({ mode: 'edit', record: p })
  }

  async function handleSave() {
    if (!form.nombre_completo.trim()) { showErr('El nombre del participante es obligatorio.'); return }
    setSaving(true)
    try {
      if (drawer.mode === 'create') await q.insertParticipante(form)
      else await q.updateParticipante(drawer.record.id, form)
      done(drawer.mode === 'create' ? 'Participante registrado' : 'Participante actualizado')
    } catch (e) { showErr(e) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    setSaving(true)
    try {
      // Supabase cascade borrará las asignaciones de boletos (ON DELETE SET NULL)
      await supabaseDeleteParticipante(confirm)
      toast('Participante eliminado')
      setConfirm(null)
      setRefresh(r => r + 1)
    } catch (e) { showErr(e) }
    finally { setSaving(false) }
  }

  // Filtered list
  const list = (data ?? []).filter(p => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      p.nombre_completo.toLowerCase().includes(q) ||
      (p.telefono_whatsapp ?? '').includes(q) ||
      (p.email ?? '').toLowerCase().includes(q)
    )
  })

  if (loading) return <><Breadcrumbs crumbs={crumbs} /><LoadingSpinner text="Cargando participantes…" /></>
  if (error)   return <ErrorMsg message={error} />

  return (
    <>
      <Breadcrumbs crumbs={crumbs} />
      <div className="page">
        <div className="page-title-row">
          <h1 className="page-title" style={{ margin: 0 }}><Users size={22} /> Participantes</h1>
          <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
            <button
              className={`btn btn-sm ${viewMode === 'cards' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setViewMode('cards')}
              title="Vista tarjetas"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setViewMode('list')}
              title="Vista lista"
            >
              <ListIcon size={14} />
            </button>
            {isAdmin && (
              <button className="btn btn-primary" onClick={openCreate}>
                <Plus size={15} /> Nuevo participante
              </button>
            )}
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div style={{ marginBottom: '1rem' }}>
          <input
            className="deuda-search"
            style={{ width: '100%', maxWidth: '400px' }}
            placeholder="Buscar por nombre, teléfono o email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Contador */}
        {search.trim() && (
          <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', marginBottom: '.75rem' }}>
            {list.length} {list.length === 1 ? 'resultado' : 'resultados'}
          </p>
        )}

        {viewMode === 'cards' ? (
          <div className="grid grid-auto">
            {list.map(p => (
              <ParticipanteCard
                key={p.id}
                part={p}
                onEdit={isAdmin ? openEdit : null}
                onDelete={isAdmin ? id => setConfirm(id) : null}
                onClick={() => navigate(`/participantes/${p.id}`)}
              />
            ))}
            {list.length === 0 && (
              <p className="empty">
                {search.trim() ? 'Sin resultados para la búsqueda.' : 'No hay participantes registrados.'}
              </p>
            )}
          </div>
        ) : (
          <div className="part-list-container">
            {list.map(p => (
              <ParticipanteRow
                key={p.id}
                part={p}
                onEdit={isAdmin ? openEdit : null}
                onDelete={isAdmin ? id => setConfirm(id) : null}
                onClick={() => navigate(`/participantes/${p.id}`)}
              />
            ))}
            {list.length === 0 && (
              <p className="empty">
                {search.trim() ? 'Sin resultados para la búsqueda.' : 'No hay participantes registrados.'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Drawer crear/editar */}
      {drawer && (
        <Drawer
          title={drawer.mode === 'create' ? 'Nuevo participante' : 'Editar participante'}
          onClose={() => setDrawer(null)}
          onSave={handleSave}
          saving={saving}
        >
          <div className="field">
            <label>Nombre completo *</label>
            <input
              value={form.nombre_completo}
              onChange={e => set('nombre_completo', e.target.value)}
              placeholder="Nombre del comprador"
              autoFocus
            />
          </div>
          <div className="field">
            <label>Teléfono WhatsApp</label>
            <input
              type="tel"
              value={form.telefono_whatsapp}
              onChange={e => set('telefono_whatsapp', e.target.value)}
              placeholder="ej. 6671234567"
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </div>
        </Drawer>
      )}

      {confirm && (
        <ConfirmModal
          message="¿Eliminar este participante? Sus boletos quedarán disponibles nuevamente."
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
          loading={saving}
        />
      )}

      {errModal && <ErrorModal {...errModal} onClose={() => setErrModal(null)} />}
    </>
  )
}

// Eliminación directa desde supabase (sin query wrapper extra)
async function supabaseDeleteParticipante(id) {
  const { supabase } = await import('../lib/supabase.js')
  const { error } = await supabase.from('participantes').delete().eq('id', id)
  if (error) throw error
}

// ── Fila de participante (vista lista) ────────────────────────────────────────

function ParticipanteRow({ part, onEdit, onDelete, onClick }) {
  const r = part.resumen ?? { total: 0, liquidados: 0, apartados: 0, pagado: 0, pendiente: 0 }
  return (
    <div className="part-list-row" onClick={onClick}>
      <div className="part-avatar" aria-hidden="true">
        {part.nombre_completo.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {part.nombre_completo}
        </div>
        <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', display: 'flex', gap: '.6rem', flexWrap: 'wrap', marginTop: '.1rem' }}>
          {part.telefono_whatsapp && <span><Phone size={10} /> {part.telefono_whatsapp}</span>}
          {part.email && <span><Mail size={10} /> {part.email}</span>}
        </div>
      </div>
      <div style={{ textAlign: 'right', fontSize: '.8rem', flexShrink: 0 }}>
        <div style={{ color: 'var(--text-muted)' }}>
          {r.total} {r.total === 1 ? 'boleto' : 'boletos'}
          {r.liquidados > 0 && <span style={{ color: 'var(--liquidado)', marginLeft: '.35rem' }}>· {r.liquidados} liq.</span>}
        </div>
        {r.pendiente > 0 && (
          <div style={{ color: 'var(--abonado)', fontWeight: 600 }}>Debe {fmt(r.pendiente)}</div>
        )}
      </div>
      {onEdit && (
        <button className="btn btn-icon" onClick={e => onEdit(part, e)} title="Editar">
          <Pencil size={14} />
        </button>
      )}
      {onDelete && (
        <button className="btn btn-icon btn-danger-icon" onClick={e => { e.stopPropagation(); onDelete(part.id) }} title="Eliminar">
          <Trash2 size={14} />
        </button>
      )}
      <ArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
    </div>
  )
}

// ── Tarjeta de participante ───────────────────────────────────────────────────

function ParticipanteCard({ part, onEdit, onDelete, onClick }) {
  const r = part.resumen ?? { total: 0, liquidados: 0, apartados: 0, pagado: 0, pendiente: 0 }

  return (
    <div className="card card-link" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="card-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
            <span
              className="part-avatar"
              aria-hidden="true"
            >
              {part.nombre_completo.charAt(0).toUpperCase()}
            </span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {part.nombre_completo}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginTop: '.3rem' }}>
            {part.telefono_whatsapp && (
              <span style={{ fontSize: '.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '.2rem' }}>
                <Phone size={11} /> {part.telefono_whatsapp}
              </span>
            )}
            {part.email && (
              <span style={{ fontSize: '.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '.2rem' }}>
                <Mail size={11} /> {part.email}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '.3rem', flexShrink: 0 }}>
          {onEdit && (
            <button className="btn btn-icon" onClick={e => onEdit(part, e)} title="Editar">
              <Pencil size={14} />
            </button>
          )}
          {onDelete && (
            <button className="btn btn-icon btn-danger-icon" onClick={e => { e.stopPropagation(); onDelete(part.id) }} title="Eliminar">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Resumen de boletos */}
      {r.total > 0 ? (
        <>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '.8rem', margin: '.5rem 0 .4rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {r.total} {r.total === 1 ? 'boleto' : 'boletos'}
            </span>
            {r.liquidados > 0 && (
              <span style={{ color: 'var(--liquidado)', display: 'flex', alignItems: 'center', gap: '.2rem' }}>
                <CheckCircle2 size={11} /> {r.liquidados} liquidado{r.liquidados !== 1 ? 's' : ''}
              </span>
            )}
            {r.apartados > 0 && (
              <span style={{ color: 'var(--abonado)', display: 'flex', alignItems: 'center', gap: '.2rem' }}>
                <Clock size={11} /> {r.apartados} apartado{r.apartados !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', marginTop: '.2rem' }}>
            <span>Pagado: <strong style={{ color: 'var(--liquidado)' }}>{fmt(r.pagado)}</strong></span>
            {r.pendiente > 0 && (
              <span>
                <AlertCircle size={11} style={{ marginRight: '.15rem', color: 'var(--abonado)' }} />
                Debe: <strong style={{ color: 'var(--abonado)' }}>{fmt(r.pendiente)}</strong>
              </span>
            )}
          </div>
        </>
      ) : (
        <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginTop: '.4rem' }}>Sin boletos activos</p>
      )}

      <div style={{ marginTop: '.6rem', display: 'flex', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: '.8rem', color: 'var(--accent-light)', display: 'flex', alignItems: 'center', gap: '.2rem' }}>
          Ver perfil <ArrowRight size={13} />
        </span>
      </div>
    </div>
  )
}
