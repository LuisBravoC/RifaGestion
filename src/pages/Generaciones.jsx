import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, ArrowRight, Pencil, Trash2, Plus } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useQuery } from '../lib/useQuery.js'
import { fmt } from '../lib/formatters.js'
import { useToast } from '../lib/toast.jsx'
import * as q from '../lib/queries.js'
import Breadcrumbs from '../components/Breadcrumbs.jsx'
import { useBreadcrumbs } from '../lib/useBreadcrumbs.js'
import { useAuth } from '../lib/AuthContext.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import LoadingSpinner, { ErrorMsg } from '../components/LoadingSpinner.jsx'
import Drawer from '../components/Drawer.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'
import ErrorModal from '../components/ErrorModal.jsx'
import { parseError } from '../lib/parseError.js'

const EMPTY_PROY = { año_ciclo: '', estatus: 'Activo' }

export default function Generaciones() {
  const { instId } = useParams()
  const [refresh, setRefresh] = useState(0)

  const instQ  = useQuery(() => q.getInstitucion(Number(instId)), [instId])
  const proyQ  = useQuery(() => q.getProyectosByInstitucion(Number(instId)), [instId, refresh])

  const [drawer,  setDrawer]  = useState(null)
  const [form,    setForm]    = useState(EMPTY_PROY)
  const [saving,  setSaving]  = useState(false)
  const [confirm,  setConfirm]  = useState(null)
  const [errModal,  setErrModal] = useState(null)
  const showErr = e => setErrModal(typeof e === 'string' ? { title: 'Aviso', body: e } : (e?.title ? e : parseError(e)))
  const toast = useToast()

  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const done = (msg)  => { setRefresh(r => r + 1); setDrawer(null); if (msg) toast(msg) }

  function openCreate() { setForm(EMPTY_PROY); setDrawer({ mode: 'create' }) }
  function openEdit(proy, e) {
    e.stopPropagation()
    setForm({ año_ciclo: proy.año_ciclo, estatus: proy.estatus })
    setDrawer({ mode: 'edit', record: proy })
  }

  async function handleSave() {
    if (!form.año_ciclo.trim()) { showErr('El ciclo o año de la generación es obligatorio.'); return }
    setSaving(true)
    try {
      if (drawer.mode === 'create') await q.insertProyecto({ ...form, institucion_id: Number(instId) })
      else await q.updateProyecto(drawer.record.id, form)
      done(drawer.mode === 'create' ? 'Generación creada' : 'Generación actualizada')
    } catch (e) { showErr(e) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    setSaving(true)
    try {
      const res = await q.getResumenProyecto(confirm)
      if (res.porCobrar > 0) {
        showErr({ title: 'Generación con deudas pendientes', body: `Esta generación tiene ${res.alumnos} ${res.alumnos === 1 ? 'alumno' : 'alumnos'} con un saldo total sin liquidar de ${fmt(res.porCobrar)}. Liquida todas las deudas antes de eliminar la generación.` })
        setConfirm(null)
        return
      }
      await q.deleteProyecto(confirm); toast('Generación eliminada'); setConfirm(null); setRefresh(r => r + 1)
    }
    catch (e) { showErr(e) }
    finally { setSaving(false) }
  }

  if (instQ.loading || proyQ.loading) return <LoadingSpinner text="Cargando generaciones…" />
  if (instQ.error) return <ErrorMsg message={instQ.error} />
  if (!instQ.data) return <NotFound />

  const inst = instQ.data
  const { isAdmin } = useAuth()
  const crumbs = useBreadcrumbs({ instId: inst.nombre })

  return (
    <>
      <Breadcrumbs crumbs={crumbs} />
      <div className="page">
        <div className="page-title-row">
          <h1 className="page-title" style={{ margin: 0 }}><CalendarDays size={22} /> {inst.nombre}</h1>
          {isAdmin && <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> Nueva generación</button>}
        </div>
        <p className="section-heading">Generaciones / Ciclos</p>
        <div className="grid grid-auto">
          {(proyQ.data ?? []).map(proy => (
            <ProyCard key={proy.id} proy={proy} inst={inst}
              onEdit={isAdmin ? openEdit : null}
              onDelete={isAdmin ? id => setConfirm(id) : null}
            />
          ))}
          {(proyQ.data ?? []).length === 0 && <p className="empty">Sin generaciones. Crea la primera.</p>}
        </div>
      </div>

      {drawer && (
        <Drawer
          title={drawer.mode === 'create' ? 'Nueva generación' : 'Editar generación'}
          onClose={() => setDrawer(null)} onSave={handleSave} saving={saving}
        >
          <div className="field"><label>Ciclo / Año *</label>
            <input value={form.año_ciclo} onChange={e => set('año_ciclo', e.target.value)} placeholder="ej. 2024-2027" autoFocus />
          </div>
          <div className="field"><label>Estatus</label>
            <select value={form.estatus} onChange={e => set('estatus', e.target.value)}>
              <option value="Activo">Activo</option>
              <option value="Finalizado">Finalizado</option>
            </select>
          </div>
        </Drawer>
      )}

      {confirm !== null && (
        <ConfirmModal
          message="¿Eliminar esta generación? Se eliminarán sus grupos y alumnos."
          onConfirm={handleDelete} onCancel={() => setConfirm(null)} loading={saving}
        />
      )}
      {errModal && (
        <ErrorModal title={errModal.title} body={errModal.body} onClose={() => setErrModal(null)} />
      )}
    </>
  )
}

function ProyCard({ proy, inst, onEdit, onDelete }) {
  const navigate = useNavigate()
  const { data, loading } = useQuery(() => q.getResumenProyecto(proy.id), [proy.id])
  const res = data ?? { grupos: 0, alumnos: 0, totalEsperado: 0, totalCobrado: 0, porCobrar: 0 }

  return (
    <div className="card card-clickable" onClick={() => navigate(`/instituciones/${inst.id}/proyectos/${proy.id}`)}>
      <div className="card-header">
        <div>
          <div className="card-title">Generación {proy.año_ciclo}</div>
          {!loading && <div className="card-sub">{res.grupos} grupo(s) · {res.alumnos} alumnos</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <span className={`badge badge-${proy.estatus.toLowerCase()}`}>{proy.estatus}</span>
          <div className="card-actions" onClick={e => e.stopPropagation()}>
            {onEdit && <button className="btn-icon" title="Editar" onClick={e => onEdit(proy, e)}><Pencil size={14} /></button>}
            {onDelete && <button className="btn-icon danger" title="Eliminar" onClick={() => onDelete(proy.id)}><Trash2 size={14} /></button>}
          </div>
        </div>
      </div>
      {!loading && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', color: 'var(--text-muted)', marginBottom: '.25rem' }}>
            <span>Cobrado: <strong style={{ color: 'var(--liquidado)' }}>{fmt(res.totalCobrado)}</strong></span>
            <span>Falta: <strong style={{ color: 'var(--abonado)' }}>{fmt(res.porCobrar)}</strong></span>
          </div>
          <ProgressBar value={res.totalCobrado} max={res.totalEsperado} />
        </>
      )}
      <div style={{ marginTop: '.75rem', display: 'flex', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: '.8rem', color: 'var(--accent-light)', display: 'flex', alignItems: 'center', gap: '.2rem' }}>
          Ver grupos <ArrowRight size={13} />
        </span>
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="page empty">
      <p>Institución no encontrada.</p>
      <a href="/instituciones" style={{ color: 'var(--accent-light)' }}>← Volver</a>
    </div>
  )
}
