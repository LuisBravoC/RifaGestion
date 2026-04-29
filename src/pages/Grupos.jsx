import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Users, Clock, ArrowRight, AlertCircle, Pencil, Trash2, Plus } from 'lucide-react'
import { useQuery } from '../lib/useQuery.js'
import { useToast } from '../lib/toast.jsx'
import { fmt } from '../lib/formatters.js'
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

const EMPTY = { nombre_grupo: '', turno: 'Matutino' }

export default function Grupos() {
  const { instId, proyId } = useParams()
  const [refresh, setRefresh] = useState(0)

  const instQ  = useQuery(() => q.getInstitucion(Number(instId)), [instId])
  const proyQ  = useQuery(() => q.getProyecto(Number(proyId)), [proyId])
  const grupoQ = useQuery(() => q.getGruposByProyecto(Number(proyId)), [proyId, refresh])

  const [drawer,  setDrawer]  = useState(null)
  const [form,    setForm]    = useState(EMPTY)
  const [saving,  setSaving]  = useState(false)
  const [confirm,  setConfirm]  = useState(null)
  const [errModal,  setErrModal] = useState(null)
  const showErr = e => setErrModal(typeof e === 'string' ? { title: 'Aviso', body: e } : (e?.title ? e : parseError(e)))
  const toast = useToast()

  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const done = (msg)  => { setRefresh(r => r + 1); setDrawer(null); if (msg) toast(msg) }

  function openCreate() { setForm(EMPTY); setDrawer({ mode: 'create' }) }
  function openEdit(g, e) {
    e.stopPropagation()
    setForm({ nombre_grupo: g.nombre_grupo, turno: g.turno ?? 'Matutino' })
    setDrawer({ mode: 'edit', record: g })
  }

  async function handleSave() {
    if (!form.nombre_grupo.trim()) { showErr('El nombre del grupo es obligatorio.'); return }
    setSaving(true)
    try {
      if (drawer.mode === 'create') await q.insertGrupo({ ...form, proyecto_id: Number(proyId) })
      else await q.updateGrupo(drawer.record.id, form)
      done(drawer.mode === 'create' ? 'Grupo creado' : 'Grupo actualizado')
    } catch (e) { showErr(e) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    setSaving(true)
    try {
      const res = await q.getResumenGrupo(confirm)
      if (res.porCobrar > 0) {
        showErr({ title: 'Grupo con deudas pendientes', body: `Este grupo tiene ${res.miembros} ${res.miembros === 1 ? 'alumno' : 'alumnos'} con un saldo total sin liquidar de ${fmt(res.porCobrar)}. Liquida todas las deudas antes de eliminar el grupo.` })
        setConfirm(null)
        return
      }
      await q.deleteGrupo(confirm); toast('Grupo eliminado'); setConfirm(null); setRefresh(r => r + 1)
    }
    catch (e) { showErr(e) }
    finally { setSaving(false) }
  }

  if (instQ.loading || proyQ.loading || grupoQ.loading) return <LoadingSpinner text="Cargando grupos…" />
  if (instQ.error || proyQ.error) return <ErrorMsg message={instQ.error ?? proyQ.error} />
  if (!instQ.data || !proyQ.data) return <NotFound />

  const inst = instQ.data
  const proy = proyQ.data
  const { isAdmin } = useAuth()
  const crumbs = useBreadcrumbs({ instId: inst.nombre, proyId: `Gen ${proy.año_ciclo}` })

  return (
    <>
      <Breadcrumbs crumbs={crumbs} />
      <div className="page">
        <div className="page-title-row">
          <h1 className="page-title" style={{ margin: 0 }}><Users size={22} /> Grupos — Gen {proy.año_ciclo}</h1>
          {isAdmin && <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> Nuevo grupo</button>}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '.88rem', marginBottom: '1.5rem' }}>{inst.nombre}</p>
        <div className="grid grid-auto">
          {(grupoQ.data ?? []).map(g => (
            <GrupoCard key={g.id} g={g} inst={inst} proy={proy}
              onEdit={isAdmin ? openEdit : null}
              onDelete={isAdmin ? id => setConfirm(id) : null}
            />
          ))}
          {(grupoQ.data ?? []).length === 0 && <p className="empty">Sin grupos. Crea el primero.</p>}
        </div>
      </div>

      {drawer && (
        <Drawer
          title={drawer.mode === 'create' ? 'Nuevo grupo' : 'Editar grupo'}
          onClose={() => setDrawer(null)} onSave={handleSave} saving={saving}
        >
          <div className="field"><label>Nombre del grupo *</label>
            <input value={form.nombre_grupo} onChange={e => set('nombre_grupo', e.target.value)} placeholder="ej. 6to A" autoFocus />
          </div>
          <div className="field"><label>Turno</label>
            <select value={form.turno} onChange={e => set('turno', e.target.value)}>
              <option value="Matutino">Matutino</option>
              <option value="Vespertino">Vespertino</option>
              <option value="Nocturno">Nocturno</option>
            </select>
          </div>
        </Drawer>
      )}

      {confirm !== null && (
        <ConfirmModal
          message="¿Eliminar este grupo? Se eliminarán sus alumnos y pagos."
          onConfirm={handleDelete} onCancel={() => setConfirm(null)} loading={saving}
        />
      )}
      {errModal && (
        <ErrorModal title={errModal.title} body={errModal.body} onClose={() => setErrModal(null)} />
      )}
    </>
  )
}

function GrupoCard({ g, inst, proy, onEdit, onDelete }) {
  const navigate = useNavigate()
  const { data, loading } = useQuery(() => q.getResumenGrupo(g.id), [g.id])
  const res = data ?? { miembros: 0, totalEsperado: 0, totalCobrado: 0, porCobrar: 0 }

  return (
    <div className="card card-clickable" onClick={() => navigate(`/instituciones/${inst.id}/proyectos/${proy.id}/grupos/${g.id}`)}>
      <div className="card-header">
        <div>
          <div className="card-title">{g.nombre_grupo}</div>
          <div className="card-sub" style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
            <Clock size={12} /> {g.turno} · {res.miembros} alumnos
          </div>
        </div>
        <div className="card-actions" onClick={e => e.stopPropagation()}>
          {onEdit && <button className="btn-icon" title="Editar" onClick={e => onEdit(g, e)}><Pencil size={14} /></button>}
          {onDelete && <button className="btn-icon danger" title="Eliminar" onClick={() => onDelete(g.id)}><Trash2 size={14} /></button>}
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
          Ver alumnos <ArrowRight size={13} />
        </span>
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="page empty">
      <AlertCircle size={48} />
      <p>Datos no encontrados.</p>
      <a href="/" style={{ color: 'var(--accent-light)' }}>← Inicio</a>
    </div>
  )
}
