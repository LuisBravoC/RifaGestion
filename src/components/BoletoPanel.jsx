import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Plus, X, CheckCircle2, Trash2,
  MessageCircle, Zap, Clock, UserPlus, ArrowRight,
} from 'lucide-react'
import { fmt } from '../lib/formatters.js'
import * as q from '../lib/rifas-queries.js'
import ProgressBar from './ProgressBar.jsx'
import { parseError } from '../lib/parseError.js'

// ── Utilidades locales ────────────────────────────────────────────────────────

function fmtNum(n, total) {
  const digits = total <= 100 ? 2 : String(total).length
  return String(n).padStart(digits, '0')
}

const today = () => new Date().toISOString().slice(0, 10)

function fmtDate(d) {
  if (!d) return '—'
  const raw = typeof d === 'string' && d.length === 10 ? d + 'T12:00:00' : d
  return new Date(raw).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function WhatsAppLink({ nombre, telefono, saldo }) {
  const phone = '52' + (telefono ?? '').replace(/\D/g, '')
  if (phone.length < 12) return null
  const msg = encodeURIComponent(
    `Hola ${nombre}, te recordamos que tu saldo pendiente para la rifa es de *${fmt(saldo)}*. ¡Gracias por participar!`
  )
  return (
    <a
      href={`https://wa.me/${phone}?text=${msg}`}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-wa"
      title={`WhatsApp a ${nombre}`}
    >
      <MessageCircle size={15} />
    </a>
  )
}

// ── Componente ────────────────────────────────────────────────────────────────

/**
 * Panel lateral para apartar o gestionar un boleto.
 *
 * Props:
 *   boleto   – boleto seleccionado (con estatus, nombre_completo, etc.)
 *   rifa     – datos de la rifa (precio_boleto, cantidad_boletos)
 *   total    – rifa.cantidad_boletos (número)
 *   isAdmin  – booleano
 *   onClose  – cierra el panel sin refrescar
 *   onDone   – cierra el panel Y dispara un refresco de boletos en el padre
 *   onError  – muestra un ErrorModal en el padre ({ title, body })
 *   toast    – función toast del padre
 */
export default function BoletoPanel({ boleto: boletoInicial, rifa, total, isAdmin, onClose, onDone, onError, toast }) {
  const navigate = useNavigate()

  // ── Estado modo "asignar" ─────────────────────────────────────────────────
  const [mode, setMode]                         = useState(boletoInicial.estatus === 'Disponible' ? 'asignar' : 'gestionar')
  const [boleto, setBoleto]                     = useState(boletoInicial)
  const [partSearch, setPartSearch]             = useState('')
  const [partResults, setPartResults]           = useState([])
  const [partSeleccionado, setPartSeleccionado] = useState(null)
  const [showNewForm, setShowNewForm]           = useState(false)
  const [nuevoPart, setNuevoPart]               = useState({ nombre_completo: '', telefono_whatsapp: '' })
  const [montoAbono, setMontoAbono]             = useState('')

  // ── Estado modo "gestionar" ───────────────────────────────────────────────
  const [pagos, setPagos]                 = useState([])
  const [loadingPagos, setLoadingPagos]   = useState(mode === 'gestionar')
  const [formPago, setFormPago]           = useState({ monto: '', fecha: today(), metodo_pago: 'Efectivo' })
  const [showAddPago, setShowAddPago]     = useState(false)
  const [confirmLib, setConfirmLib]       = useState(false)
  const [saving, setSaving]               = useState(false)

  const showErr = e => onError(typeof e === 'string' ? { title: 'Aviso', body: e } : (e?.title ? e : parseError(e)))

  // Cargar pagos al abrir en modo gestionar
  const pagosLoadedRef = useRef(false)
  if (mode === 'gestionar' && !pagosLoadedRef.current) {
    pagosLoadedRef.current = true
    q.getPagosByBoleto(boleto.id)
      .then(setPagos)
      .catch(showErr)
      .finally(() => setLoadingPagos(false))
  }

  // ── Búsqueda de participante (debounced) ──────────────────────────────────
  const searchRef = useRef(null)
  const handlePartSearch = useCallback(async (v) => {
    setPartSearch(v)
    clearTimeout(searchRef.current)
    if (!v.trim() || v.trim().length < 2) { setPartResults([]); return }
    searchRef.current = setTimeout(async () => {
      const r = await q.buscarParticipantes(v)
      setPartResults(r)
    }, 300)
  }, [])

  // ── Acciones: asignar ─────────────────────────────────────────────────────
  async function handleAsignar() {
    if (!partSeleccionado && !showNewForm) { showErr('Selecciona o crea un participante.'); return }
    if (showNewForm && !nuevoPart.nombre_completo.trim()) { showErr('El nombre del participante es obligatorio.'); return }
    setSaving(true)
    try {
      let pid = partSeleccionado?.id
      if (!pid) {
        const p = await q.insertParticipante(nuevoPart)
        pid = p.id
      }
      await q.asignarBoleto(boleto.id, pid, montoAbono, boleto.precio_boleto)
      const fueCompleto = Number(montoAbono) >= Number(boleto.precio_boleto)
      toast(fueCompleto
        ? `Boleto #${fmtNum(boleto.numero_asignado, total)} pagado y liquidado 🎉`
        : `Boleto #${fmtNum(boleto.numero_asignado, total)} apartado`)
      onDone()
    } catch (e) { showErr(e) }
    finally { setSaving(false) }
  }

  // ── Acciones: gestionar ───────────────────────────────────────────────────
  async function handleAddPago() {
    if (!formPago.monto || Number(formPago.monto) <= 0) { showErr('Ingresa un monto válido.'); return }
    setSaving(true)
    try {
      await q.insertPagoRifa({ boleto_id: boleto.id, ...formPago, monto: Number(formPago.monto) })
      const [nuevosPagos, boletoActualizado] = await Promise.all([
        q.getPagosByBoleto(boleto.id),
        q.getBoleto(boleto.id),
      ])
      // Auto-liquidar si el saldo quedó en cero
      if (Number(boletoActualizado.saldo_pendiente) <= 0 && boletoActualizado.estatus !== 'Liquidado') {
        await q.liquidarBoleto(boleto.id, 0)
        setBoleto(await q.getBoleto(boleto.id))
        toast(`Boleto #${fmtNum(boleto.numero_asignado, total)} liquidado 🎉`)
      } else {
        setBoleto(boletoActualizado)
        toast('Pago registrado')
      }
      setPagos(nuevosPagos)
      setFormPago({ monto: '', fecha: today(), metodo_pago: 'Efectivo' })
      setShowAddPago(false)
      onDone({ noClose: true })
    } catch (e) { showErr(e) }
    finally { setSaving(false) }
  }

  async function handleDeletePago(pagoId) {
    setSaving(true)
    try {
      await q.deletePagoRifa(pagoId)
      toast('Pago eliminado')
      const [nuevosPagos, boletoActualizado] = await Promise.all([
        q.getPagosByBoleto(boleto.id),
        q.getBoleto(boleto.id),
      ])
      // Revertir a Apartado si era Liquidado y ahora tiene saldo pendiente
      if (boletoActualizado.estatus === 'Liquidado' && Number(boletoActualizado.saldo_pendiente) > 0) {
        await q.revertirApartado(boleto.id)
        setBoleto(await q.getBoleto(boleto.id))
      } else {
        setBoleto(boletoActualizado)
      }
      setPagos(nuevosPagos)
      onDone({ noClose: true })
    } catch (e) { showErr(e) }
    finally { setSaving(false) }
  }

  async function handleLiquidar() {
    setSaving(true)
    try {
      await q.liquidarBoleto(boleto.id, boleto.saldo_pendiente)
      toast(`Boleto #${fmtNum(boleto.numero_asignado, total)} liquidado 🎉`)
      onDone()
    } catch (e) { showErr(e) }
    finally { setSaving(false) }
  }

  async function handleLiberar() {
    setSaving(true)
    try {
      await q.liberarBoleto(boleto.id)
      toast('Boleto liberado y disponible nuevamente')
      onDone()
    } catch (e) { showErr(e) }
    finally { setSaving(false) }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer boleto-panel" role="dialog" aria-modal="true">

        {/* Cabecera */}
        <div className="drawer-header">
          <h3 className="drawer-title">
            {mode === 'asignar'
              ? `Apartar boleto #${fmtNum(boleto.numero_asignado, total)}`
              : `Boleto #${fmtNum(boleto.numero_asignado, total)}`}
            {mode === 'gestionar' && (
              <span
                className={`badge badge-${
                  boleto.estatus === 'Liquidado' ? 'liquidado'
                    : boleto.estatus === 'Apartado' ? 'abonado'
                    : 'deuda'
                }`}
                style={{ fontSize: '.72rem', marginLeft: '.5rem' }}
              >
                {boleto.estatus}
              </span>
            )}
          </h3>
          <button className="drawer-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Cuerpo */}
        <div className="drawer-body">

          {/* ── MODO: ASIGNAR ── */}
          {mode === 'asignar' && (
            <>
              <div className="boleto-panel-info-row">
                <span>Precio del boleto</span>
                <strong>{fmt(rifa.precio_boleto)}</strong>
              </div>

              <p className="field-section-label">Participante</p>

              {/* Búsqueda existente */}
              {!showNewForm && (
                <div className="field" style={{ position: 'relative' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input
                      value={partSearch}
                      onChange={e => handlePartSearch(e.target.value)}
                      placeholder="Buscar por nombre o telefono"
                      autoFocus
                      style={{ paddingLeft: '2.2rem' }}
                    />
                  </div>
                  {partResults.length > 0 && (
                    <div className="search-dropdown" style={{ position: 'static', marginTop: '.25rem', maxHeight: '200px', overflowY: 'auto' }}>
                      {partResults.map(p => (
                        <button
                          key={p.id}
                          className="search-item"
                          style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                          onClick={() => { setPartSeleccionado(p); setPartSearch(p.nombre_completo); setPartResults([]) }}
                        >
                          <span className="search-item-name">{p.nombre_completo}</span>
                          <span className="search-item-meta">{p.telefono_whatsapp}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {partSeleccionado && (
                    <div className="boleto-part-selected">
                      <span>{partSeleccionado.nombre_completo}</span>
                      <button className="btn btn-icon" onClick={() => { setPartSeleccionado(null); setPartSearch('') }}>
                        <X size={13} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Formulario nuevo participante */}
              {showNewForm ? (
                <div>
                  <div className="field">
                    <label>Nombre completo *</label>
                    <input
                      value={nuevoPart.nombre_completo}
                      onChange={e => setNuevoPart(f => ({ ...f, nombre_completo: e.target.value }))}
                      placeholder="Nombre del comprador"
                      autoFocus
                    />
                  </div>
                  <div className="field">
                    <label>Tel\u00e9fono WhatsApp</label>
                    <input
                      value={nuevoPart.telefono_whatsapp}
                      onChange={e => setNuevoPart(f => ({ ...f, telefono_whatsapp: e.target.value }))}
                      placeholder="ej. 6671234567"
                      type="tel"
                    />
                  </div>
                  <button
                    className="btn btn-sm btn-outline"
                    style={{ marginBottom: '.75rem' }}
                    onClick={() => { setShowNewForm(false); setNuevoPart({ nombre_completo: '', telefono_whatsapp: '' }) }}
                  >
                    <X size={13} /> Cancelar
                  </button>
                </div>
              ) : (
                !partSeleccionado && (
                  <button
                    className="btn btn-sm btn-outline"
                    style={{ width: '100%', marginBottom: '.75rem' }}
                    onClick={() => { setShowNewForm(true); setPartSearch(''); setPartResults([]) }}
                  >
                    <UserPlus size={14} /> Nuevo participante
                  </button>
                )
              )}

              {/* Abono inicial */}
              <p className="field-section-label">Abono inicial <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(opcional)</span></p>
              <div className="field">
                <input
                  type="number"
                  min="0"
                  value={montoAbono}
                  onChange={e => setMontoAbono(e.target.value)}
                  placeholder={`0 — ${fmt(rifa.precio_boleto)}`}
                />
              </div>
            </>
          )}

          {/* ── MODO: GESTIONAR ── */}
          {mode === 'gestionar' && (
            <>
              {/* Info del participante */}
              <div
                className="boleto-participante-card"
                style={{ cursor: boleto.participante_id ? 'pointer' : 'default' }}
                onClick={() => boleto.participante_id && navigate(`/participantes/${boleto.participante_id}`)}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: '.15rem' }}>{boleto.nombre_completo ?? '—'}</div>
                  <div style={{ fontSize: '.82rem', color: 'var(--text-muted)' }}>{boleto.telefono_whatsapp ?? 'Sin tel\u00e9fono'}</div>
                  {boleto.fecha_apartado && (
                    <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.15rem' }}>
                      <Clock size={11} /> Apartado: {fmtDate(boleto.fecha_apartado)}
                    </div>
                  )}
                  {boleto.participante_id && (
                    <div style={{ fontSize: '.73rem', color: 'var(--accent-light)', marginTop: '.3rem', display: 'flex', alignItems: 'center', gap: '.2rem' }}>
                      Ver perfil <ArrowRight size={11} />
                    </div>
                  )}
                </div>
                <div onClick={e => e.stopPropagation()}>
                  {boleto.telefono_whatsapp && boleto.saldo_pendiente > 0 && (
                    <WhatsAppLink nombre={boleto.nombre_completo} telefono={boleto.telefono_whatsapp} saldo={boleto.saldo_pendiente} />
                  )}
                </div>
              </div>

              {/* Resumen de pagos */}
              <div className="boleto-panel-info-row">
                <span>Precio boleto</span>
                <strong>{fmt(rifa.precio_boleto)}</strong>
              </div>
              <div className="boleto-panel-info-row">
                <span>Total abonado</span>
                <strong style={{ color: 'var(--liquidado)' }}>{fmt(boleto.total_pagado)}</strong>
              </div>
              <div className="boleto-panel-info-row" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '.5rem', marginBottom: '.75rem' }}>
                <span>Saldo pendiente</span>
                <strong style={{ color: boleto.saldo_pendiente > 0 ? 'var(--abonado)' : 'var(--liquidado)' }}>
                  {fmt(Math.max(0, boleto.saldo_pendiente))}
                </strong>
              </div>
              <ProgressBar value={Number(boleto.total_pagado)} max={Number(rifa.precio_boleto)} />

              {/* Historial de pagos */}
              <p className="field-section-label" style={{ marginTop: '1rem' }}>Historial de pagos</p>
              {loadingPagos ? (
                <p style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>Cargando...</p>
              ) : pagos.length === 0 ? (
                <p style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>Sin pagos registrados.</p>
              ) : (
                <div className="pagos-list">
                  {pagos.map(p => (
                    <div key={p.id} className="pago-row">
                      <div>
                        <span className="pago-monto">{fmt(p.monto)}</span>
                        <span className="pago-meta">{fmtDate(p.fecha)} · {p.metodo_pago}</span>
                      </div>
                      {isAdmin && (
                        <button className="btn btn-icon btn-danger-icon" onClick={() => handleDeletePago(p.id)} disabled={saving} title="Eliminar pago">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Agregar pago */}
              {isAdmin && boleto.estatus !== 'Liquidado' && (
                <>
                  {showAddPago ? (
                    <div style={{ marginTop: '.75rem' }}>
                      <p className="field-section-label">Nuevo pago</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                        <div className="field">
                          <label>Monto</label>
                          <input type="number" min="1" value={formPago.monto} onChange={e => setFormPago(f => ({ ...f, monto: e.target.value }))} placeholder="$" autoFocus />
                        </div>
                        <div className="field">
                          <label>Fecha</label>
                          <input type="date" value={formPago.fecha} onChange={e => setFormPago(f => ({ ...f, fecha: e.target.value }))} />
                        </div>
                      </div>
                      <div className="field">
                        <label>Método</label>
                        <select value={formPago.metodo_pago} onChange={e => setFormPago(f => ({ ...f, metodo_pago: e.target.value }))}>
                          {['Efectivo', 'Transferencia', 'Tarjeta', 'Otro'].map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: '.5rem' }}>
                        <button className="btn btn-primary btn-sm" onClick={handleAddPago} disabled={saving}>
                          {saving ? 'Guardando…' : 'Guardar pago'}
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => setShowAddPago(false)}>Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn btn-outline" style={{ width: '100%', marginTop: '.75rem' }} onClick={() => setShowAddPago(true)}>
                      <Plus size={14} /> Registrar pago
                    </button>
                  )}
                </>
              )}

              {/* Acciones admin */}
              {isAdmin && (
                <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                  {boleto.estatus === 'Apartado' && (
                    <button className="btn btn-primary" onClick={handleLiquidar} disabled={saving}>
                      <CheckCircle2 size={15} /> Marcar como liquidado
                    </button>
                  )}
                  {!confirmLib ? (
                    <button className="btn btn-outline" style={{ color: 'var(--deuda)', borderColor: 'var(--deuda)' }} onClick={() => setConfirmLib(true)} disabled={saving}>
                      <Zap size={14} /> Liberar boleto
                    </button>
                  ) : (
                    <div className="inline-confirm">
                      <p>¿Liberar este boleto? Se volverá disponible y perderá su participante.</p>
                      <div style={{ display: 'flex', gap: '.5rem' }}>
                        <button className="btn btn-danger btn-sm" onClick={handleLiberar} disabled={saving}>
                          {saving ? '…' : 'Sí, liberar'}
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => setConfirmLib(false)}>No</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Pie */}
        <div className="drawer-footer">
          {mode === 'asignar' ? (
            <>
              <button className="btn btn-outline" onClick={onClose} disabled={saving}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAsignar} disabled={saving}>
                {saving ? 'Guardando…' : 'Apartar'}
              </button>
            </>
          ) : (
            <button className="btn btn-outline" onClick={onClose} style={{ width: '100%' }}>Cerrar</button>
          )}
        </div>
      </div>
    </>
  )
}
