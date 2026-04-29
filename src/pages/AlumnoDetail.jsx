import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, CreditCard, Package, CheckCircle2, Phone, User, MessageSquare, Pencil, Trash2, Plus, Zap, PackageCheck } from 'lucide-react'
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

const today = () => new Date().toISOString().slice(0, 10)

export default function AlumnoDetail() {
  const navigate = useNavigate()
  const { instId, proyId, grupoId, alumnoId } = useParams()
  const [refreshA, setRefreshA] = useState(0)
  const [refreshP, setRefreshP] = useState(0)

  const instQ   = useQuery(() => q.getInstitucion(Number(instId)), [instId])
  const proyQ   = useQuery(() => q.getProyecto(Number(proyId)), [proyId])
  const grupoQ  = useQuery(() => q.getGrupo(Number(grupoId)), [grupoId])
  const alumnoQ = useQuery(() => q.getAlumno(Number(alumnoId)), [alumnoId, refreshA])
  const pagosQ  = useQuery(() => q.getPagosByAlumno(Number(alumnoId)), [alumnoId, refreshP])
  const paqQ    = useQuery(() => q.getPaquetes(), [])

  // — Drawer para editar alumno
  const [drawerA, setDrawerA] = useState(false)
  const [formA,   setFormA]   = useState({})
  // — Drawer para nuevo pago
  const [drawerP, setDrawerP] = useState(false)
  const [formP,   setFormP]   = useState({ monto: '', fecha: today(), metodo_pago: 'Efectivo' })
  // — Confirmaciones
  const [confirmDel,  setConfirmDel]  = useState(false)  // eliminar alumno
  const [confirmPago, setConfirmPago] = useState(null)   // id de pago a eliminar
  const [saving, setSaving] = useState(false)
  const [errModal, setErrModal] = useState(null)
  const showErr = e => setErrModal(typeof e === 'string' ? { title: 'Aviso', body: e } : (e?.title ? e : parseError(e)))
  const toast = useToast()
  // — Menú liberar alumno
  const [liberarOpen, setLiberarOpen] = useState(false)
  const liberarRef = useRef(null)

  useEffect(() => {
    function onOutside(e) {
      if (liberarRef.current && !liberarRef.current.contains(e.target)) setLiberarOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  const setA = (k, v) => setFormA(f => ({ ...f, [k]: v }))
  const setP = (k, v) => setFormP(f => ({ ...f, [k]: v }))

  function openEditAlumno() {
    const a = alumnoQ.data
    setFormA({ nombre_alumno: a.nombre_alumno, nombre_tutor: a.nombre_tutor ?? '', telefono_contacto: a.telefono_contacto ?? '', paquete_id: a.paquete_id, estatus_entrega: a.estatus_entrega ?? 'Pendiente', comentarios: a.comentarios ?? '' })
    setDrawerA(true)
  }

  async function handleSaveAlumno() {
    if (!formA.nombre_alumno?.trim()) { showErr('El nombre del alumno es obligatorio.'); return }
    setSaving(true)
    try {
      await q.updateAlumno(Number(alumnoId), { ...formA, paquete_id: Number(formA.paquete_id) })
      toast('Datos del alumno actualizados')
      setDrawerA(false); setRefreshA(r => r + 1)
    } catch (e) { showErr(e) }
    finally { setSaving(false) }
  }

  async function handleDeleteAlumno() {
    setSaving(true)
    try {
      await q.deleteAlumno(Number(alumnoId))
      navigate(`/instituciones/${instId}/proyectos/${proyId}/grupos/${grupoId}`)
    } catch (e) { showErr(e); setSaving(false) }
  }

  async function handleAddPago() {
    if (!formP.monto || Number(formP.monto) <= 0) { showErr('El monto del pago debe ser mayor a 0.'); return }
    setSaving(true)
    try {
      await q.insertPago({ alumno_id: Number(alumnoId), monto: Number(formP.monto), fecha: formP.fecha, metodo_pago: formP.metodo_pago })
      toast('Pago registrado')
      setDrawerP(false); setFormP({ monto: '', fecha: today(), metodo_pago: 'Efectivo' })
      setRefreshP(r => r + 1); setRefreshA(r => r + 1)
    } catch (e) { showErr(e) }
    finally { setSaving(false) }
  }

  async function handleDeletePago() {
    setSaving(true)
    try { await q.deletePago(confirmPago); toast('Pago eliminado'); setConfirmPago(null); setRefreshP(r => r + 1); setRefreshA(r => r + 1) }
    catch (e) { showErr(e) }
    finally { setSaving(false) }
  }

  // conEntrega=false → solo liquida | conEntrega=true → liquida + marca Entregado
  async function handleLiberar(conEntrega) {
    setLiberarOpen(false)
    setSaving(true)
    try {
      const alumnoActual = alumnoQ.data
      const saldoActual  = Number(alumnoActual.saldo_pendiente)
      if (saldoActual > 0) {
        await q.insertPago({ alumno_id: Number(alumnoId), monto: saldoActual, fecha: today(), metodo_pago: 'Efectivo' })
      }
      if (conEntrega) {
        await q.updateAlumno(Number(alumnoId), { estatus_entrega: 'Entregado' })
      }
      setRefreshP(r => r + 1)
      setRefreshA(r => r + 1)
      toast(conEntrega ? 'Alumno liberado y entregado' : 'Deuda liquidada')
    } catch (e) { showErr(e) }
    finally { setSaving(false) }
  }

  if (instQ.loading || proyQ.loading || grupoQ.loading || alumnoQ.loading) return <LoadingSpinner text="Cargando alumno…" />
  if (alumnoQ.error) return <ErrorMsg message={alumnoQ.error} />
  if (!instQ.data || !proyQ.data || !grupoQ.data || !alumnoQ.data) return <NotFound />

  const inst    = instQ.data
  const proy    = proyQ.data
  const grupo   = grupoQ.data
  const alumno  = alumnoQ.data
  const historial = pagosQ.data ?? []
  const saldo   = Number(alumno.saldo_pendiente)
  const iniciales = (alumno.nombre_alumno ?? '').split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('') || '?'
  const paquetes  = paqQ.data ?? []

  const crumbs = useBreadcrumbs({ instId: inst.nombre, proyId: `Gen ${proy.año_ciclo}`, grupoId: grupo.nombre_grupo, alumnoId: alumno.nombre_alumno })
  const { isAdmin } = useAuth()

  const alumnoYaListo = saldo === 0 && alumno.estatus_entrega === 'Entregado'

  return (
    <>
      <Breadcrumbs crumbs={crumbs} />
      <div className="page">

        {/* ── Header ───────────────────────────────── */}
        <div className="alumno-header">
          <div className="alumno-avatar">{iniciales}</div>
          <div className="alumno-info" style={{ flex: 1 }}>
            <h2>{alumno.nombre_alumno}</h2>
            <p>{inst.nombre} · Gen {proy.año_ciclo} · {grupo.nombre_grupo}</p>
          </div>
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            {/* ── Botón acción rápida Liberar ────── */}
          {!alumnoYaListo && isAdmin && (
              <div className="liberar-wrap" ref={liberarRef}>
                <button
                  className="btn liberar-btn"
                  onClick={() => setLiberarOpen(o => !o)}
                  disabled={saving}
                  title="Acciones rápidas"
                >
                  <Zap size={14} />
                  Liberar
                </button>
                {liberarOpen && (
                  <div className="liberar-menu">
                    {saldo > 0 && (
                      <button className="liberar-opt" onClick={() => handleLiberar(false)}>
                        <CreditCard size={15} />
                        <div>
                          <div className="liberar-opt-title">Liquidar deuda</div>
                          <div className="liberar-opt-sub">Registra pago de {fmt(saldo)} restante</div>
                        </div>
                      </button>
                    )}
                    <button className="liberar-opt liberar-opt--green" onClick={() => handleLiberar(true)}>
                      <PackageCheck size={15} />
                      <div>
                        <div className="liberar-opt-title">
                          {saldo > 0 ? 'Liquidar y entregar' : 'Marcar como entregado'}
                        </div>
                        <div className="liberar-opt-sub">
                          {saldo > 0
                            ? `Liquida ${fmt(saldo)} y marca como Entregado`
                            : 'Cambia estatus a Entregado'}
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
            <StatusBadge status={alumno.estatus_pago} />
            {isAdmin && <button className="btn-icon" title="Editar alumno" onClick={openEditAlumno}><Pencil size={16} /></button>}
            {isAdmin && (
              <button
                className="btn-icon danger"
                title="Eliminar alumno"
                onClick={() => {
                  if (saldo > 0) {
                    setErrModal({
                      title: 'Alumno con deuda pendiente',
                      body: `${alumno.nombre_alumno} tiene un saldo sin liquidar de ${fmt(saldo)}. Usa el botón ⚡ Liberar para registrar el pago antes de eliminar al alumno.`,
                    })
                    return
                  }
                  setConfirmDel(true)
                }}
              ><Trash2 size={16} /></button>
            )}
          </div>
        </div>

        {/* ── Tutor ────────────────────────────────── */}
        <div className="card tutor-card">
          <div className="tutor-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <User size={15} style={{ color: 'var(--accent-light)', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Tutor / Contacto</span>
                <div style={{ fontWeight: 600 }}>{alumno.nombre_tutor}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', color: 'var(--text-muted)', fontSize: '.88rem' }}>
                <Phone size={13} />
                <a href={`tel:${alumno.telefono_contacto}`} style={{ color: 'var(--text-muted)' }}>{alumno.telefono_contacto}</a>
              </div>
              {saldo > 0 && <WhatsAppBtn nombreTutor={alumno.nombre_tutor} nombreAlumno={alumno.nombre_alumno} telefono={alumno.telefono_contacto} saldo={saldo} />}
            </div>
          </div>
          {alumno.comentarios && (
            <div style={{ marginTop: '.75rem', paddingTop: '.75rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '.5rem', fontSize: '.85rem', color: 'var(--text-muted)' }}>
              <MessageSquare size={14} style={{ flexShrink: 0, marginTop: '.15rem', color: 'var(--accent-light)' }} />
              <span>{alumno.comentarios}</span>
            </div>
          )}
        </div>

        {/* ── Saldo ────────────────────────────────── */}
        <div className="saldo-box">
          <div className="saldo-item">
            <label><Package size={12} style={{ verticalAlign: 'middle' }} /> Paquete</label>
            <span style={{ color: 'var(--accent-light)', fontSize: '1rem' }}>{alumno.paquete_titulo}</span>
          </div>
          <div className="saldo-item"><label>Precio</label><span style={{ color: 'var(--accent-light)' }}>{fmt(alumno.precio_paquete)}</span></div>
          <div className="saldo-item"><label>Pagado</label><span style={{ color: 'var(--liquidado)' }}>{fmt(alumno.total_pagado)}</span></div>
          <div className="saldo-item">
            <label>Saldo pendiente</label>
            <span style={{ color: saldo > 0 ? 'var(--abonado)' : 'var(--liquidado)', fontWeight: 700 }}>{fmt(saldo)}</span>
          </div>
          <div className="saldo-item">
            <label><CheckCircle2 size={12} style={{ verticalAlign: 'middle' }} /> Entrega</label>
            <span style={{ fontSize: '1rem', color: alumno.estatus_entrega === 'Entregado' ? 'var(--liquidado)' : 'var(--abonado)' }}>{alumno.estatus_entrega}</span>
          </div>
        </div>
        <ProgressBar value={Number(alumno.total_pagado)} max={Number(alumno.precio_paquete)} />

        {/* ── Historial ────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', marginBottom: '.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '.4rem' }}>
          <p className="section-heading" style={{ margin: 0 }}>Historial de pagos</p>
          {isAdmin && <button className="btn btn-primary" style={{ fontSize: '.8rem', padding: '.35rem .75rem' }} onClick={() => setDrawerP(true)}>
            <Plus size={13} /> Registrar pago
          </button>}
        </div>

        {historial.length === 0
          ? <p style={{ color: 'var(--text-muted)', fontSize: '.88rem' }}>Sin pagos registrados.</p>
          : (
            <div className="pagos-list">
              {historial.map(p => (
                <div key={p.id} className="pago-row">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                      <CreditCard size={14} style={{ color: 'var(--accent-light)' }} />
                      <span>{p.metodo_pago}</span>
                    </div>
                    <div className="pago-meta">{p.fecha}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                    <span className="pago-monto">+{fmt(p.monto)}</span>
                    {isAdmin && <button className="btn-icon danger" title="Eliminar pago" onClick={() => setConfirmPago(p.id)}><Trash2 size={13} /></button>}
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {/* ── Drawer editar alumno ──────────────────── */}
      {drawerA && (
        <Drawer title="Editar alumno" onClose={() => setDrawerA(false)} onSave={handleSaveAlumno} saving={saving}>
          <div className="field"><label>Nombre del alumno *</label>
            <input value={formA.nombre_alumno} onChange={e => setA('nombre_alumno', e.target.value)} autoFocus />
          </div>
          <div className="field"><label>Nombre del tutor</label>
            <input value={formA.nombre_tutor} onChange={e => setA('nombre_tutor', e.target.value)} />
          </div>
          <div className="field"><label>Teléfono de contacto</label>
            <input value={formA.telefono_contacto} onChange={e => setA('telefono_contacto', e.target.value)} />
          </div>
          <div className="field"><label>Paquete *</label>
            <select value={formA.paquete_id} onChange={e => setA('paquete_id', e.target.value)}>
              {paquetes.map(p => <option key={p.id} value={p.id}>{p.titulo} — {fmt(p.precio)}</option>)}
            </select>
          </div>
          <div className="field"><label>Estatus de entrega</label>
            <select value={formA.estatus_entrega} onChange={e => setA('estatus_entrega', e.target.value)}>
              <option value="Pendiente">Pendiente</option>
              <option value="Entregado">Entregado</option>
            </select>
          </div>
          <div className="field"><label>Comentarios</label>
            <textarea value={formA.comentarios} onChange={e => setA('comentarios', e.target.value)} />
          </div>
        </Drawer>
      )}

      {/* ── Drawer nuevo pago ────────────────────── */}
      {drawerP && (
        <Drawer title="Registrar pago" onClose={() => setDrawerP(false)} onSave={handleAddPago} saving={saving}>
          <div className="field"><label>Monto *</label>
            <input type="number" min="1" value={formP.monto} onChange={e => setP('monto', e.target.value)} placeholder="ej. 200" autoFocus />
          </div>
          <div className="field"><label>Fecha</label>
            <input type="date" value={formP.fecha} onChange={e => setP('fecha', e.target.value)} />
          </div>
          <div className="field"><label>Método de pago</label>
            <select value={formP.metodo_pago} onChange={e => setP('metodo_pago', e.target.value)}>
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Tarjeta">Tarjeta</option>
            </select>
          </div>
        </Drawer>
      )}

      {/* ── Confirmaciones ───────────────────────── */}
      {confirmDel && (
        <ConfirmModal
          message={`¿Eliminar a ${alumno.nombre_alumno} y todos sus pagos? Esta acción no se puede deshacer.`}
          onConfirm={handleDeleteAlumno} onCancel={() => setConfirmDel(false)} loading={saving}
        />
      )}
      {confirmPago !== null && (
        <ConfirmModal message="¿Eliminar este pago?" onConfirm={handleDeletePago} onCancel={() => setConfirmPago(null)} loading={saving} />
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
      <p>Alumno no encontrado.</p>
      <a href="/" style={{ color: 'var(--accent-light)' }}>← Inicio</a>
    </div>
  )
}
