import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, MapPin, User, ArrowRight, Pencil, Trash2, Plus } from 'lucide-react'
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

const EMPTY = { nombre: '', ciudad: '', direccion: '', contacto: '' }

export default function Instituciones() {
  const [refresh, setRefresh] = useState(0)
  const crumbs = useBreadcrumbs()
  const { isAdmin } = useAuth()
  const { data, loading, error } = useQuery(() => q.getInstituciones(), [refresh])

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
  function openEdit(inst, e) {
    e.stopPropagation()
    setForm({ nombre: inst.nombre, ciudad: inst.ciudad ?? '', direccion: inst.direccion ?? '', contacto: inst.contacto ?? '' })
    setDrawer({ mode: 'edit', record: inst })
  }

  async function handleSave() {
    if (!form.nombre.trim()) { showErr('El nombre de la institución es obligatorio.'); return }
    setSaving(true)
    try {
      if (drawer.mode === 'create') await q.insertInstitucion(form)
      else await q.updateInstitucion(drawer.record.id, form)
      done(drawer.mode === 'create' ? 'Institución creada' : 'Institución actualizada')
    } catch (e) { showErr(e) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    setSaving(true)
    try {
      const res = await q.getResumenInstitucion(confirm)
      if (res.porCobrar > 0) {
        showErr({ title: 'Institución con deudas pendientes', body: `Esta institución tiene un saldo total sin liquidar de ${fmt(res.porCobrar)}. Liquida todas las deudas de sus alumnos antes de eliminar la institución.` })
        setConfirm(null)
        return
      }
      await q.deleteInstitucion(confirm); toast('Institución eliminada'); setConfirm(null); setRefresh(r => r + 1)
    }
    catch (e) { showErr(e) }
    finally { setSaving(false) }
  }

  if (loading) return <><Breadcrumbs crumbs={crumbs} /><LoadingSpinner text="Cargando instituciones…" /></>
  if (error)   return <ErrorMsg message={error} />

  return (
    <>
      <Breadcrumbs crumbs={crumbs} />
      <div className="page">
        <div className="page-title-row">
          <h1 className="page-title" style={{ margin: 0 }}><Building2 size={22} /> Instituciones</h1>
          {isAdmin && <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> Nueva institución</button>}
        </div>
        <div className="grid grid-auto">
          {(data ?? []).map(inst => (
            <InstCard key={inst.id} inst={inst}
              onEdit={isAdmin ? openEdit : null}
              onDelete={isAdmin ? id => setConfirm(id) : null}
            />
          ))}
          {(data ?? []).length === 0 && <p className="empty">No hay instituciones. Crea la primera.</p>}
        </div>
      </div>

      {drawer && (
        <Drawer
          title={drawer.mode === 'create' ? 'Nueva institución' : 'Editar institución'}
          onClose={() => setDrawer(null)} onSave={handleSave} saving={saving}
        >
          <div className="field"><label>Nombre *</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="ej. Primaria Benito Juárez" autoFocus />
          </div>
          <div className="field"><label>Ciudad</label>
            <input value={form.ciudad} onChange={e => set('ciudad', e.target.value)} placeholder="ej. Culiacán" />
          </div>
          <div className="field"><label>Dirección</label>
            <input value={form.direccion} onChange={e => set('direccion', e.target.value)} placeholder="ej. Calle Morelos 45, Col. Centro" />
          </div>
          <div className="field"><label>Contacto</label>
            <input value={form.contacto} onChange={e => set('contacto', e.target.value)} placeholder="ej. Directora M. García" />
          </div>
        </Drawer>
      )}

      {confirm !== null && (
        <ConfirmModal
          message="¿Eliminar esta institución? Se eliminarán en cascada sus generaciones, grupos y alumnos."
          onConfirm={handleDelete} onCancel={() => setConfirm(null)} loading={saving}
        />
      )}
      {errModal && (
        <ErrorModal title={errModal.title} body={errModal.body} onClose={() => setErrModal(null)} />
      )}
    </>
  )
}

function InstCard({ inst, onEdit, onDelete }) {
  const navigate = useNavigate()
  const { data, loading } = useQuery(() => q.getResumenInstitucion(inst.id), [inst.id])
  const res = data ?? { totalEsperado: 0, totalCobrado: 0, porCobrar: 0 }

  return (
    <div className="card card-clickable" onClick={() => navigate(`/instituciones/${inst.id}`)}>
      <div className="card-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="card-title">{inst.nombre}</div>
          <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '.2rem', marginTop: '.35rem' }}>
            {inst.ciudad && <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}><MapPin size={11} /> {inst.ciudad}</span>}
            {inst.contacto && <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}><User size={11} /> {inst.contacto}</span>}
          </div>
        </div>
        <div className="card-actions" onClick={e => e.stopPropagation()}>
          {onEdit && onDelete && <>
            <button className="btn-icon" title="Editar" onClick={e => onEdit(inst, e)}><Pencil size={14} /></button>
            <button className="btn-icon danger" title="Eliminar" onClick={() => onDelete(inst.id)}><Trash2 size={14} /></button>
          </>}
        </div>
      </div>
      {!loading && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', color: 'var(--text-muted)', margin: '.5rem 0 .25rem' }}>
            <span>Cobrado: <strong style={{ color: 'var(--liquidado)' }}>{fmt(res.totalCobrado)}</strong></span>
            <span>Falta: <strong style={{ color: 'var(--abonado)' }}>{fmt(res.porCobrar)}</strong></span>
          </div>
          <ProgressBar value={res.totalCobrado} max={res.totalEsperado} />
        </>
      )}
      <div style={{ marginTop: '.75rem', display: 'flex', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: '.8rem', color: 'var(--accent-light)', display: 'flex', alignItems: 'center', gap: '.2rem' }}>
          Ver detalle <ArrowRight size={13} />
        </span>
      </div>
    </div>
  )
}
