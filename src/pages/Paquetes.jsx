import { useState } from 'react'
import { Package, Pencil, Trash2, Plus, Check, Camera } from 'lucide-react'
import { useQuery } from '../lib/useQuery.js'
import { useToast } from '../lib/toast.jsx'
import { fmt } from '../lib/formatters.js'
import * as q from '../lib/queries.js'
import Breadcrumbs from '../components/Breadcrumbs.jsx'
import { useBreadcrumbs } from '../lib/useBreadcrumbs.js'
import { useAuth } from '../lib/AuthContext.jsx'
import LoadingSpinner, { ErrorMsg } from '../components/LoadingSpinner.jsx'
import Drawer from '../components/Drawer.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'
import ErrorModal from '../components/ErrorModal.jsx'
import { parseError } from '../lib/parseError.js'
import TagsInput from '../components/TagsInput.jsx'


const EMPTY = { titulo: '', descripcion: '', precio: '', que_incluye: [] }

// Paleta de acentos para las tarjetas (cicla por índice)
const CARD_ACCENTS = [
  { bg: 'rgba(99,102,241,.12)',  border: 'rgba(99,102,241,.35)',  text: '#a5b4fc' },
  { bg: 'rgba(34,197,94,.1)',    border: 'rgba(34,197,94,.3)',    text: '#86efac' },
  { bg: 'rgba(245,158,11,.1)',   border: 'rgba(245,158,11,.3)',   text: '#fcd34d' },
  { bg: 'rgba(236,72,153,.1)',   border: 'rgba(236,72,153,.3)',   text: '#f9a8d4' },
  { bg: 'rgba(20,184,166,.1)',   border: 'rgba(20,184,166,.3)',   text: '#5eead4' },
]

export default function Paquetes() {
  const [refresh, setRefresh] = useState(0)
  const crumbs = useBreadcrumbs()
  const { isAdmin } = useAuth()
  const { data, loading, error } = useQuery(() => q.getPaquetes(), [refresh])

  const [drawer,  setDrawer]  = useState(null)
  const [form,    setForm]    = useState(EMPTY)
  const [saving,  setSaving]  = useState(false)
  const [confirm,  setConfirm]  = useState(null)
  const [errModal,  setErrModal] = useState(null)
  const showErr = e => setErrModal(typeof e === 'string' ? { title: 'Aviso', body: e } : parseError(e))
  const toast = useToast()

  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const done = (msg)  => { setRefresh(r => r + 1); setDrawer(null); if (msg) toast(msg) }

  function openCreate() { setForm(EMPTY); setDrawer({ mode: 'create' }) }
  function openEdit(p) {
    setForm({ titulo: p.titulo, descripcion: p.descripcion ?? '', precio: String(p.precio), que_incluye: p.que_incluye ?? [] })
    setDrawer({ mode: 'edit', record: p })
  }

  async function handleSave() {
    if (!form.titulo.trim()) { showErr('El título del paquete es obligatorio.'); return }
    if (!form.precio || Number(form.precio) < 0) { showErr('Ingresa un precio válido (mayor o igual a 0).'); return }
    setSaving(true)
    try {
      const payload = { titulo: form.titulo.trim(), descripcion: form.descripcion.trim(), precio: Number(form.precio), que_incluye: form.que_incluye }
      if (drawer.mode === 'create') await q.insertPaquete(payload)
      else await q.updatePaquete(drawer.record.id, payload)
      done(drawer.mode === 'create' ? 'Paquete creado' : 'Paquete actualizado')
    } catch (e) { showErr(e) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    setSaving(true)
    try { await q.deletePaquete(confirm); toast('Paquete eliminado'); setConfirm(null); setRefresh(r => r + 1) }
    catch (e) { showErr(e) }
    finally { setSaving(false) }
  }

  if (loading) return <><Breadcrumbs crumbs={crumbs} /><LoadingSpinner text="Cargando paquetes…" /></>
  if (error)   return <ErrorMsg message={error} />

  const paquetes = data ?? []

  return (
    <>
      <Breadcrumbs crumbs={crumbs} />
      <div className="page">

        {/* ── Encabezado ───────────────────────────────────── */}
        <div className="page-title-row">
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>
              <Camera size={22} /> Catálogo de Paquetes
            </h1>
            <p style={{ margin: '.3rem 0 0', fontSize: '.85rem', color: 'var(--text-muted)' }}>
              {paquetes.length} {paquetes.length === 1 ? 'paquete disponible' : 'paquetes disponibles'}
            </p>
          </div>
          {isAdmin && <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={15} /> Nuevo paquete
          </button>}
        </div>

        {/* ── Tarjetas ─────────────────────────────────────── */}
        <div className="paq-grid">
          {paquetes.map((p, i) => {
            const accent = CARD_ACCENTS[i % CARD_ACCENTS.length]
            return (
              <div key={p.id} className="paq-card">

                {/* cabecera coloreada */}
                <div className="paq-card-head" style={{ background: accent.bg, borderBottom: `1px solid ${accent.border}` }}>
                  <div className="paq-card-icon" style={{ background: accent.border }}>
                    <Package size={18} style={{ color: accent.text }} />
                  </div>
                  <div className="card-actions" style={{ marginLeft: 'auto' }}>
                    {isAdmin && <>
                  {isAdmin && (
                    <div className="card-actions">
                      <button className="btn-icon" title="Editar" onClick={() => openEdit(p)}><Pencil size={14} /></button>
                      <button className="btn-icon danger" title="Eliminar" onClick={() => setConfirm(p.id)}><Trash2 size={14} /></button>
                    </div>
                  )}
                    </>}
                  </div>
                </div>

                {/* cuerpo */}
                <div className="paq-card-body">
                  <div className="paq-card-titulo">{p.titulo}</div>
                  <div className="paq-card-precio" style={{ color: accent.text }}>{fmt(p.precio)}</div>
                  {p.descripcion && (
                    <p className="paq-card-desc">{p.descripcion}</p>
                  )}

                  {(p.que_incluye ?? []).length > 0 && (
                    <ul className="paq-incluye">
                      {p.que_incluye.map((item, j) => (
                        <li key={j}>
                          <span className="paq-check" style={{ color: accent.text }}><Check size={12} strokeWidth={3} /></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

              </div>
            )
          })}

          {paquetes.length === 0 && (
            <div className="paq-empty">
              <Package size={40} style={{ opacity: .25 }} />
              <p>Sin paquetes. Crea el primero.</p>
              <button className="btn btn-primary" onClick={openCreate}><Plus size={14} /> Crear paquete</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Drawer ────────────────────────────────────────── */}
      {drawer && (
        <Drawer
          title={drawer.mode === 'create' ? 'Nuevo paquete' : 'Editar paquete'}
          onClose={() => setDrawer(null)} onSave={handleSave} saving={saving}
        >
          <div className="field"><label>Título *</label>
            <input value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="ej. Premium" autoFocus />
          </div>
          <div className="field"><label>Precio (MXN) *</label>
            <input type="number" min="0" value={form.precio} onChange={e => set('precio', e.target.value)} placeholder="ej. 800" />
          </div>
          <div className="field"><label>Descripción</label>
            <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Descripción breve del paquete…" />
          </div>
          <div className="field">
            <label>Qué incluye</label>
            <TagsInput value={form.que_incluye} onChange={v => set('que_incluye', v)} />
          </div>
        </Drawer>
      )}

      {/* ── Confirmación eliminar ─────────────────────────── */}
      {confirm !== null && (
        <ConfirmModal
          message="¿Eliminar este paquete? Asegúrate de que ningún alumno lo tenga asignado."
          onConfirm={handleDelete} onCancel={() => setConfirm(null)} loading={saving}
        />
      )}
      {errModal && (
        <ErrorModal title={errModal.title} body={errModal.body} onClose={() => setErrModal(null)} />
      )}
    </>
  )
}
