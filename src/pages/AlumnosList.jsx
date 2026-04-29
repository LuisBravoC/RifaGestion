import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Users, AlertCircle, Download, Pencil, Trash2, Plus, ChevronUp, ChevronDown } from 'lucide-react'
import { useQuery } from '../lib/useQuery.js'
import { useToast } from '../lib/toast.jsx'
import { fmt } from '../lib/formatters.js'
import * as q from '../lib/queries.js'
import Breadcrumbs from '../components/Breadcrumbs.jsx'
import { useBreadcrumbs } from '../lib/useBreadcrumbs.js'
import { useAuth } from '../lib/AuthContext.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import WhatsAppBtn from '../components/WhatsAppBtn.jsx'
import LoadingSpinner, { ErrorMsg } from '../components/LoadingSpinner.jsx'
import Drawer from '../components/Drawer.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'
import ErrorModal from '../components/ErrorModal.jsx'
import { parseError } from '../lib/parseError.js'

const EMPTY = { nombre_alumno: '', nombre_tutor: '', telefono_contacto: '', paquete_id: '', estatus_entrega: 'Pendiente', comentarios: '' }

export default function AlumnosList() {
  const navigate = useNavigate()
  const { instId, proyId, grupoId } = useParams()
  const [refresh, setRefresh] = useState(0)

  const instQ    = useQuery(() => q.getInstitucion(Number(instId)), [instId])
  const proyQ    = useQuery(() => q.getProyecto(Number(proyId)), [proyId])
  const grupoQ   = useQuery(() => q.getGrupo(Number(grupoId)), [grupoId])
  const alumnosQ = useQuery(() => q.getAlumnosByGrupo(Number(grupoId)), [grupoId, refresh])
  const paqQ     = useQuery(() => q.getPaquetes(), [])

  const [drawer,  setDrawer]  = useState(null)
  const [form,    setForm]    = useState(EMPTY)
  const [saving,  setSaving]  = useState(false)
  const [confirm,  setConfirm]  = useState(null)
  const [errModal,  setErrModal] = useState(null)
  const [filtroPago,     setFiltroPago]     = useState('todos')
  const [filtroEntrega,  setFiltroEntrega]  = useState('todos')
  const [sortCol,        setSortCol]        = useState('nombre_alumno')
  const [sortDir,        setSortDir]        = useState('asc')

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }
  const showErr = e => setErrModal(typeof e === 'string' ? { title: 'Aviso', body: e } : (e?.title ? e : parseError(e)))
  const toast = useToast()

  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const done = (msg)  => { setRefresh(r => r + 1); setDrawer(null); if (msg) toast(msg) }

  function openCreate() {
    const defPaq = (paqQ.data ?? [])[0]?.id ?? ''
    setForm({ ...EMPTY, paquete_id: defPaq })
    setDrawer({ mode: 'create' })
  }
  function openEdit(a, e) {
    e.stopPropagation()
    setForm({ nombre_alumno: a.nombre_alumno, nombre_tutor: a.nombre_tutor ?? '', telefono_contacto: a.telefono_contacto ?? '', paquete_id: a.paquete_id, estatus_entrega: a.estatus_entrega ?? 'Pendiente', comentarios: a.comentarios ?? '' })
    setDrawer({ mode: 'edit', record: a })
  }

  async function handleSave() {
    if (!form.nombre_alumno.trim()) { showErr('El nombre del alumno es obligatorio.'); return }
    if (!form.paquete_id) { showErr('Debes seleccionar un paquete fotográfico.'); return }
    setSaving(true)
    try {
      const payload = { ...form, paquete_id: Number(form.paquete_id) }
      if (drawer.mode === 'create') await q.insertAlumno({ ...payload, grupo_id: Number(grupoId) })
      else await q.updateAlumno(drawer.record.id, payload)
      done(drawer.mode === 'create' ? 'Alumno agregado' : 'Alumno actualizado')
    } catch (e) { showErr(e) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    setSaving(true)
    try { await q.deleteAlumno(confirm); toast('Alumno eliminado'); setConfirm(null); setRefresh(r => r + 1) }
    catch (e) { showErr(e) }
    finally { setSaving(false) }
  }

  if (instQ.loading || proyQ.loading || grupoQ.loading || alumnosQ.loading)
    return <LoadingSpinner text="Cargando alumnos…" />
  if (instQ.error || proyQ.error || grupoQ.error) return <ErrorMsg message={instQ.error ?? proyQ.error ?? grupoQ.error} />
  if (!instQ.data || !proyQ.data || !grupoQ.data) return <NotFound />

  const inst     = instQ.data
  const proy     = proyQ.data
  const grupo    = grupoQ.data
  const miembros = alumnosQ.data ?? []
  const paquetes = paqQ.data ?? []

  const resumen = miembros.reduce((acc, a) => {
    acc.miembros++
    acc.totalEsperado += Number(a.precio_paquete) || 0
    acc.totalCobrado  += Number(a.total_pagado)   || 0
    acc.porCobrar     += Number(a.saldo_pendiente) || 0
    return acc
  }, { miembros: 0, totalEsperado: 0, totalCobrado: 0, porCobrar: 0 })

  const filtrados = miembros
    .filter(a => filtroPago    === 'todos' || a.estatus_pago     === filtroPago)
    .filter(a => filtroEntrega === 'todos' || a.estatus_entrega  === filtroEntrega)
    .sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol]
      if (typeof va === 'string') va = va.toLowerCase()
      if (typeof vb === 'string') vb = vb.toLowerCase()
      if (va == null) va = ''
      if (vb == null) vb = ''
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ?  1 : -1
      return 0
    })

  const crumbs = useBreadcrumbs({ instId: inst.nombre, proyId: `Gen ${proy.año_ciclo}`, grupoId: grupo.nombre_grupo })
  const { isAdmin } = useAuth()

  function exportCSV() {
    const rows = [['Alumno', 'Tutor', 'Teléfono', 'Paquete', 'Precio', 'Pagado', 'Saldo', 'Estatus', 'Entrega']]
    miembros.forEach(a => rows.push([a.nombre_alumno, a.nombre_tutor, a.telefono_contacto, a.paquete_titulo, a.precio_paquete, a.total_pagado, a.saldo_pendiente, a.estatus_pago, a.estatus_entrega]))
    const blob = new Blob(['\uFEFF' + rows.map(r => r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const el   = document.createElement('a')
      el.href = url; el.download = `${grupo.nombre_grupo}-alumnos.csv`; el.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Breadcrumbs crumbs={crumbs} />
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <h1 className="page-title" style={{ margin: 0 }}>
            <Users size={22} /> {grupo.nombre_grupo} — {grupo.turno}
          </h1>
          <div style={{ display: 'flex', gap: '.6rem' }}>
            <button className="btn btn-outline" onClick={exportCSV}><Download size={15} /> Exportar CSV</button>
            {isAdmin && <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> Nuevo alumno</button>}
          </div>
        </div>

        <div className="saldo-box" style={{ marginBottom: '1.5rem' }}>
          <div className="saldo-item"><label>Alumnos</label><span style={{ color: 'var(--accent-light)' }}>{resumen.miembros}</span></div>
          <div className="saldo-item"><label>Esperado</label><span style={{ color: 'var(--accent-light)' }}>{fmt(resumen.totalEsperado)}</span></div>
          <div className="saldo-item"><label>Cobrado</label><span style={{ color: 'var(--liquidado)' }}>{fmt(resumen.totalCobrado)}</span></div>
          <div className="saldo-item"><label>Por cobrar</label><span style={{ color: 'var(--abonado)' }}>{fmt(resumen.porCobrar)}</span></div>
        </div>
        <ProgressBar value={resumen.totalCobrado} max={resumen.totalEsperado} />

        <p className="section-heading">Lista de alumnos</p>

        {/* ── Filtros ── */}
        <div className="filter-bar">
          <div className="filter-bar-group">
            <span className="filter-bar-label">Pago:</span>
            {['todos','deuda','abonado','liquidado'].map(v => (
              <button key={v} className={`filter-pill${filtroPago === v ? ' active' : ''}`}
                onClick={() => setFiltroPago(v)}>
                {v === 'todos' ? 'Todos' : v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <div className="filter-bar-group">
            <span className="filter-bar-label">Entrega:</span>
            {['todos','Pendiente','Entregado'].map(v => (
              <button key={v} className={`filter-pill${filtroEntrega === v ? ' active' : ''}`}
                onClick={() => setFiltroEntrega(v)}>
                {v === 'todos' ? 'Todos' : v}
              </button>
            ))}
          </div>
          {(filtroPago !== 'todos' || filtroEntrega !== 'todos') && (
            <span className="filter-count">{filtrados.length} de {miembros.length} alumnos</span>
          )}
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {[
                    { label: 'Alumno',   col: 'nombre_alumno' },
                    { label: 'Tutor',    col: 'nombre_tutor' },
                    { label: 'Paquete',  col: 'paquete_titulo' },
                    { label: 'Precio',   col: 'precio_paquete' },
                    { label: 'Pagado',   col: 'total_pagado' },
                    { label: 'Saldo',    col: 'saldo_pendiente' },
                    { label: 'Estatus',  col: 'estatus_pago' },
                    { label: 'Entrega',  col: 'estatus_entrega' },
                  ].map(({ label, col }) => (
                    <th key={col} className="th-sortable" onClick={() => toggleSort(col)}>
                      {label}
                      <span className="sort-icon">
                        {sortCol === col
                          ? sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                          : <ChevronUp size={13} className="sort-icon-idle" />}
                      </span>
                    </th>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Ningún alumno coincide con los filtros aplicados.</td></tr>
                ) : filtrados.map(a => (
                  <tr key={a.id} style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/instituciones/${inst.id}/proyectos/${proy.id}/grupos/${grupo.id}/alumnos/${a.id}`)}>
                    <td className="td-name" style={{ color: 'var(--accent-light)' }}>{a.nombre_alumno}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '.82rem' }}>{a.nombre_tutor}</td>
                    <td>{a.paquete_titulo}</td>
                    <td>{fmt(a.precio_paquete)}</td>
                    <td style={{ color: 'var(--liquidado)' }}>{fmt(a.total_pagado)}</td>
                    <td style={{ color: Number(a.saldo_pendiente) > 0 ? 'var(--abonado)' : 'var(--liquidado)', fontWeight: 600 }}>{fmt(a.saldo_pendiente)}</td>
                    <td><StatusBadge status={a.estatus_pago} /></td>
                    <td><span className={`badge ${a.estatus_entrega === 'Entregado' ? 'badge-liquidado' : 'badge-abonado'}`}>{a.estatus_entrega}</span></td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '.25rem', alignItems: 'center' }}>
                        {isAdmin && <button className="btn-icon" title="Editar" onClick={e => openEdit(a, e)}><Pencil size={13} /></button>}
                        {isAdmin && (
                          <button className="btn-icon danger" title="Eliminar" onClick={() => {
                            if (Number(a.saldo_pendiente) > 0) {
                              setErrModal({
                                title: 'Alumno con deuda pendiente',
                                body: `${a.nombre_alumno} tiene un saldo sin liquidar de ${fmt(Number(a.saldo_pendiente))}. Liquida la deuda antes de eliminar al alumno.`,
                              })
                              return
                            }
                            setConfirm(a.id)
                          }}><Trash2 size={13} /></button>
                        )}
                        {Number(a.saldo_pendiente) > 0 && (
                          <WhatsAppBtn nombreTutor={a.nombre_tutor} nombreAlumno={a.nombre_alumno} telefono={a.telefono_contacto} saldo={Number(a.saldo_pendiente)} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {drawer && (
        <Drawer
          title={drawer.mode === 'create' ? 'Nuevo alumno' : 'Editar alumno'}
          onClose={() => setDrawer(null)} onSave={handleSave} saving={saving}
        >
          <div className="field"><label>Nombre del alumno *</label>
            <input value={form.nombre_alumno} onChange={e => set('nombre_alumno', e.target.value)} placeholder="ej. Luis Bravo" autoFocus />
          </div>
          <div className="field"><label>Nombre del tutor</label>
            <input value={form.nombre_tutor} onChange={e => set('nombre_tutor', e.target.value)} placeholder="ej. Roberto Bravo" />
          </div>
          <div className="field"><label>Teléfono de contacto</label>
            <input value={form.telefono_contacto} onChange={e => set('telefono_contacto', e.target.value)} placeholder="ej. 6671618370" />
          </div>
          <div className="field"><label>Paquete *</label>
            <select value={form.paquete_id} onChange={e => set('paquete_id', e.target.value)}>
              <option value="">— Seleccionar —</option>
              {paquetes.map(p => (
                <option key={p.id} value={p.id}>{p.titulo} — {fmt(p.precio)}</option>
              ))}
            </select>
          </div>
          <div className="field"><label>Estatus de entrega</label>
            <select value={form.estatus_entrega} onChange={e => set('estatus_entrega', e.target.value)}>
              <option value="Pendiente">Pendiente</option>
              <option value="Entregado">Entregado</option>
            </select>
          </div>
          <div className="field"><label>Comentarios</label>
            <textarea value={form.comentarios} onChange={e => set('comentarios', e.target.value)} placeholder="Notas adicionales…" />
          </div>
        </Drawer>
      )}

      {confirm !== null && (
        <ConfirmModal
          message="¿Eliminar este alumno? Se eliminarán también sus pagos."
          onConfirm={handleDelete} onCancel={() => setConfirm(null)} loading={saving}
        />
      )}
      {errModal && (
        <ErrorModal title={errModal.title} body={errModal.body} onClose={() => setErrModal(null)} />
      )}
    </>
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
