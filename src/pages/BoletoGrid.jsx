import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Trophy, Search, Plus, X, CheckCircle2, Trash2,
  MessageCircle, Calendar, DollarSign, Zap, Clock, UserPlus,
  LayoutGrid, List as ListIcon, RotateCcw, ArrowRight,
  Upload, Download, FileText,
} from 'lucide-react'
import { useQuery } from '../lib/useQuery.js'
import { useToast } from '../lib/toast.jsx'
import { fmt } from '../lib/formatters.js'
import * as q from '../lib/rifas-queries.js'
import Breadcrumbs from '../components/Breadcrumbs.jsx'
import { useBreadcrumbs } from '../lib/useBreadcrumbs.js'
import { useAuth } from '../lib/AuthContext.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import LoadingSpinner, { ErrorMsg } from '../components/LoadingSpinner.jsx'
import ErrorModal from '../components/ErrorModal.jsx'
import { parseError } from '../lib/parseError.js'
import TombolaModal from '../components/TombolaModal.jsx'
import ImportModal from '../components/ImportModal.jsx'
import { parseCSV, parseFechaCSV, csvEsc, exportarBoletos, buildImportPreview, previewToFilas } from '../lib/csv-utils.js'
import { generarRifaPDF } from '../lib/rifaPdf.js'

// ── Utilidades ──────────────────────────────────────────────────────────────

/** Formatea el número de boleto con ceros a la izquierda */
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

// ── Componente principal ─────────────────────────────────────────────────────

export default function BoletoGrid() {
  const { campanaId, rifaId } = useParams()
  const [refresh, setRefresh] = useState(0)
  const { isAdmin } = useAuth()
  const toast = useToast()

  const campanaQ = useQuery(() => q.getCampana(campanaId), [campanaId])
  const rifaQ    = useQuery(() => q.getRifa(rifaId), [rifaId])
  const boletosQ = useQuery(() => q.getBoletosByRifa(rifaId), [rifaId, refresh])

  // ── Panel lateral ──────────────────────────────────────────────────────────
  const [panel,   setPanel]   = useState(null)   // { boleto, mode: 'asignar'|'gestionar' }
  const [pagos,   setPagos]   = useState([])
  const [loadingPagos, setLoadingPagos] = useState(false)

  // Estado para modo "asignar"
  const [partSearch,       setPartSearch]       = useState('')
  const [partResults,      setPartResults]      = useState([])
  const [partSeleccionado, setPartSeleccionado] = useState(null)
  const [showNewForm,      setShowNewForm]      = useState(false)
  const [nuevoPart,        setNuevoPart]        = useState({ nombre_completo: '', telefono_whatsapp: '' })
  const [montoAbono,       setMontoAbono]       = useState('')

  // Estado para modo "gestionar"
  const [formPago,    setFormPago]    = useState({ monto: '', fecha: today(), metodo_pago: 'Efectivo' })
  const [showAddPago, setShowAddPago] = useState(false)
  const [confirmLib,  setConfirmLib]  = useState(false)

  const [saving,   setSaving]   = useState(false)
  const [errModal, setErrModal] = useState(null)
  const showErr = e => setErrModal(typeof e === 'string' ? { title: 'Aviso', body: e } : (e?.title ? e : parseError(e)))

  // ── Ganadores ──────────────────────────────────────────────────────────────
  const [ganadores,    setGanadores]    = useState([])  // boletos elegidos
  const [tombola,       setTombola]       = useState(false)
  const [ultimoGanador, setUltimoGanador] = useState(null)
  const [viewMode,     setViewMode]     = useState('grid')  // 'grid' | 'list'
  const ganadoresSeedRef = useRef(null)
  const fileInputRef    = useRef(null)
  const [importModal,   setImportModal]   = useState(null) // {preview, importing}
  const navigate = useNavigate()

  // ── Búsqueda de participante (debounced) ───────────────────────────────────
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

  // ── Abrir panel al hacer clic en un boleto ─────────────────────────────────
  async function openBoleto(boleto) {
    if (boleto.estatus === 'Disponible') {
      setPartSearch(''); setPartResults([]); setPartSeleccionado(null)
      setShowNewForm(false); setNuevoPart({ nombre_completo: '', telefono_whatsapp: '' })
      setMontoAbono('')
      setPanel({ boleto, mode: 'asignar' })
    } else {
      setFormPago({ monto: '', fecha: today(), metodo_pago: 'Efectivo' })
      setShowAddPago(false); setConfirmLib(false)
      setPanel({ boleto, mode: 'gestionar' })
      setLoadingPagos(true)
      try { setPagos(await q.getPagosByBoleto(boleto.id)) }
      catch (e) { showErr(e) }
      finally { setLoadingPagos(false) }
    }
  }

  function closePanel() { setPanel(null); setConfirmLib(false) }

  // ── Acción: Apartar boleto ─────────────────────────────────────────────────
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
      await q.asignarBoleto(panel.boleto.id, pid, montoAbono, panel.boleto.precio_boleto)
      const fueCompleto = Number(montoAbono) >= Number(panel.boleto.precio_boleto)
      toast(fueCompleto
        ? `Boleto #${fmtNum(panel.boleto.numero_asignado, rifaQ.data?.cantidad_boletos)} pagado y liquidado 🎉`
        : `Boleto #${fmtNum(panel.boleto.numero_asignado, rifaQ.data?.cantidad_boletos)} apartado`)
      closePanel(); setRefresh(r => r + 1)
    } catch (e) { showErr(e) }
    finally { setSaving(false) }
  }

  // ── Acción: Agregar pago ───────────────────────────────────────────────────
  async function handleAddPago() {
    if (!formPago.monto || Number(formPago.monto) <= 0) { showErr('Ingresa un monto válido.'); return }
    setSaving(true)
    try {
      await q.insertPagoRifa({ boleto_id: panel.boleto.id, ...formPago, monto: Number(formPago.monto) })
      toast('Pago registrado')
      const [nuevosPagos, boletoActualizado] = await Promise.all([
        q.getPagosByBoleto(panel.boleto.id),
        q.getBoleto(panel.boleto.id),
      ])
      setPagos(nuevosPagos)
      setPanel(prev => prev ? { ...prev, boleto: boletoActualizado } : null)
      setFormPago({ monto: '', fecha: today(), metodo_pago: 'Efectivo' })
      setShowAddPago(false)
      setRefresh(r => r + 1)
    } catch (e) { showErr(e) }
    finally { setSaving(false) }
  }

  // ── Acción: Eliminar pago ──────────────────────────────────────────────────
  async function handleDeletePago(pagoId) {
    setSaving(true)
    try {
      await q.deletePagoRifa(pagoId)
      toast('Pago eliminado')
      const [nuevosPagos, boletoActualizado] = await Promise.all([
        q.getPagosByBoleto(panel.boleto.id),
        q.getBoleto(panel.boleto.id),
      ])
      setPagos(nuevosPagos)
      setPanel(prev => prev ? { ...prev, boleto: boletoActualizado } : null)
      setRefresh(r => r + 1)
    } catch (e) { showErr(e) }
    finally { setSaving(false) }
  }

  // ── Acción: Liquidar boleto ────────────────────────────────────────────────
  async function handleLiquidar() {
    setSaving(true)
    try {
      await q.liquidarBoleto(panel.boleto.id, panel.boleto.saldo_pendiente)
      toast(`Boleto #${fmtNum(panel.boleto.numero_asignado, rifaQ.data?.cantidad_boletos)} liquidado 🎉`)
      closePanel(); setRefresh(r => r + 1)
    } catch (e) { showErr(e) }
    finally { setSaving(false) }
  }

  // ── Acción: Liberar boleto ─────────────────────────────────────────────────
  async function handleLiberar() {
    setSaving(true)
    try {
      await q.liberarBoleto(panel.boleto.id)
      toast('Boleto liberado y disponible nuevamente')
      closePanel(); setRefresh(r => r + 1)
    } catch (e) { showErr(e) }
    finally { setSaving(false) }
  }

  // ── Acción: Elegir ganador ─────────────────────────────────────────────────
  async function handleElegirGanador() {
    try {
      const excluir = ganadores.map(g => g.id)
      const winner  = await q.elegirGanador(rifaId, excluir)
      if (!winner) { showErr('No hay boletos liquidados disponibles para el sorteo.'); return }
      setUltimoGanador(winner)
      const newGanadores = [...ganadores, winner]
      setGanadores(newGanadores)
      setTombola(true)
      await q.saveGanadores(rifaId, newGanadores)
    } catch (e) { showErr(e) }
  }

  async function handleRemoveGanador(ganadorId) {
    const newGanadores = ganadores.filter(g => g.id !== ganadorId)
    setGanadores(newGanadores)
    try { await q.saveGanadores(rifaId, newGanadores) } catch (e) { showErr(e) }
  }

  async function handleResetSorteo() {
    setGanadores([])
    try { await q.saveGanadores(rifaId, []) } catch (e) { showErr(e) }
  }

  // ── Generar PDF ──────────────────────────────────────────────────────────
  function handlePDF() {
    generarRifaPDF(rifa, boletos, stats, total)
  }

  // ── Exportar CSV ───────────────────────────────────────────────────────────
  function handleExport() {
    exportarBoletos(boletos, rifa)
  }

  // ── Importar CSV (preview) ─────────────────────────────────────────────────
  function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setImportModal({ preview: buildImportPreview(ev.target.result, boletos), importing: false })
    }
    reader.readAsText(file, 'utf-8')
    e.target.value = ''
  }

  // ── Confirmar importación ──────────────────────────────────────────────────
  async function handleConfirmImport() {
    setImportModal(m => ({ ...m, importing: true }))
    try {
      const filas = previewToFilas(importModal.preview)
      const { importados, saltados } = await q.importarBoletos(
        rifaId, filas, rifa.precio_boleto
      )
      setImportModal(null)
      setRefresh(r => r + 1)
      toast(`Importación completada: ${importados} boleto${importados !== 1 ? 's' : ''} importados${saltados ? `, ${saltados} omitidos` : ''}`)
    } catch (e) { showErr(e); setImportModal(m => ({ ...m, importing: false })) }
  }

  // Verificar expirados al montar + cargar ganadores desde BD
  useEffect(() => {
    if (rifaQ.data?.estatus === 'Activa') {
      q.vencerBoletosExpirados(rifaId, rifaQ.data.horas_expiracion).catch(() => {})
    }
    if (rifaQ.data && ganadoresSeedRef.current !== rifaId) {
      ganadoresSeedRef.current = rifaId
      setGanadores(rifaQ.data.ganadores ?? [])
    }
  }, [rifaId, rifaQ.data])

  // ── Breadcrumbs ────────────────────────────────────────────────────────────
  const campana = campanaQ.data
  const rifa    = rifaQ.data
  const crumbs  = useBreadcrumbs({ campanaId: campana?.nombre, rifaId: rifa?.nombre_premio })

  if (campanaQ.loading || rifaQ.loading || boletosQ.loading)
    return <><Breadcrumbs crumbs={crumbs} /><LoadingSpinner text="Cargando cuadrícula…" /></>
  if (!rifa) return <ErrorMsg message="Rifa no encontrada" />

  const boletos = boletosQ.data ?? []
  const total   = rifa.cantidad_boletos
  const meta    = Number(rifa.precio_boleto) * total

  // Estadísticas en tiempo real desde los boletos cargados
  const stats = boletos.reduce(
    (acc, b) => {
      acc[b.estatus] = (acc[b.estatus] || 0) + 1
      acc.recaudado  += Number(b.total_pagado)
      return acc
    },
    { Disponible: 0, Apartado: 0, Liquidado: 0, Vencido: 0, recaudado: 0 }
  )

  const boletosLiqDisp = stats.Liquidado - ganadores.length

  return (
    <>
      <Breadcrumbs crumbs={crumbs} />
      <div className="page">

        {/* ── Cabecera ── */}
        <div className="page-title-row">
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>
              <Trophy size={20} style={{ color: 'var(--abonado)' }} /> {rifa.nombre_premio}
            </h1>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '.82rem', color: 'var(--text-muted)', marginTop: '.3rem', flexWrap: 'wrap' }}>
              <span><DollarSign size={12} /> {fmt(rifa.precio_boleto)} / boleto</span>
              {rifa.fecha_sorteo && <span><Calendar size={12} /> Sorteo: {fmtDate(rifa.fecha_sorteo)}</span>}
              <span
                className={`badge badge-${
                  rifa.estatus === 'Activa' ? 'liquidado' : rifa.estatus === 'Cancelada' ? 'deuda' : 'abonado'
                }`}
                style={{ fontSize: '.72rem' }}
              >
                {rifa.estatus}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button className="btn btn-outline btn-sm" onClick={handlePDF} title="Generar PDF / Imprimir">
              <FileText size={14} /> PDF
            </button>
            <button className="btn btn-outline btn-sm" onClick={handleExport} title="Exportar CSV">
              <Download size={14} /> Exportar
            </button>
            {isAdmin && (
              <button className="btn btn-outline btn-sm" onClick={() => fileInputRef.current?.click()} title="Importar CSV">
                <Upload size={14} /> Importar
              </button>
            )}
            {isAdmin && stats.Liquidado > 0 && (
              <button className="btn btn-primary" onClick={handleElegirGanador}>
                <Trophy size={15} /> {ganadores.length > 0 ? 'Otro ganador' : 'Elegir ganador'}
              </button>
            )}
          </div>
        </div>

        {/* ── Resumen financiero ── */}
        <div className="grid grid-stats" style={{ marginBottom: '1.25rem' }}>
          <div className="card stat-card">
            <div className="stat-value" style={{ color: 'var(--text-muted)' }}>{stats.Disponible}</div>
            <div className="stat-label">Disponibles</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value" style={{ color: 'var(--abonado)' }}>{stats.Apartado}</div>
            <div className="stat-label">Apartados</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value" style={{ color: 'var(--liquidado)' }}>{stats.Liquidado}</div>
            <div className="stat-label">Liquidados</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value" style={{ color: 'var(--accent-light)' }}>{fmt(stats.recaudado)}</div>
            <div className="stat-label">Recaudado / {fmt(meta)}</div>
          </div>
        </div>

        <ProgressBar value={stats.recaudado} max={meta} />

        {/* ── Leyenda + toggle de vista ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.5rem', margin: '.85rem 0 .75rem' }}>
          <div className="boleto-leyenda" style={{ margin: 0 }}>
            <span className="boleto-leyenda-item"><span className="dot dot-disponible" />Libre</span>
            <span className="boleto-leyenda-item"><span className="dot dot-apartado" />Apartado</span>
            <span className="boleto-leyenda-item"><span className="dot dot-liquidado" />Liquidado</span>
            {stats.Vencido > 0 && (
              <span className="boleto-leyenda-item"><span className="dot dot-vencido" />Vencido ({stats.Vencido})</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '.3rem' }}>
            <button
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setViewMode('grid')}
              title="Vista cuadrícula"
            >
              <LayoutGrid size={13} />
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setViewMode('list')}
              title="Vista lista"
            >
              <ListIcon size={13} />
            </button>
          </div>
        </div>

        {/* ── Vista cuadrícula o lista ── */}
        {viewMode === 'grid' ? (
          <div className="boleto-grid">
            {boletos.map(b => {
              const esGanador = ganadores.some(g => g.id === b.id)
              return (
                <button
                  key={b.id}
                  className={[
                    'boleto-cell',
                    `boleto-${b.estatus.toLowerCase()}`,
                    esGanador ? 'boleto-ganador' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => openBoleto(b)}
                  title={b.nombre_completo ? `${b.nombre_completo} · ${b.estatus}` : b.estatus}
                >
                  <span className="boleto-num">{fmtNum(b.numero_asignado, total)}</span>
                  {b.nombre_completo && (
                    <span className="boleto-initials">{b.nombre_completo.charAt(0).toUpperCase()}</span>
                  )}
                  {esGanador && <span className="boleto-star">★</span>}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="boleto-list">
            {boletos.map(b => {
              const esGanador = ganadores.some(g => g.id === b.id)
              return (
                <div
                  key={b.id}
                  className={[
                    'boleto-list-row',
                    `boleto-list-${b.estatus.toLowerCase()}`,
                    esGanador ? 'boleto-list-ganador' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => openBoleto(b)}
                >
                  <span className="boleto-list-num">{fmtNum(b.numero_asignado, total)}</span>
                  <span className="boleto-list-nombre">
                    {b.nombre_completo ?? <em style={{ color: 'var(--text-muted)', fontStyle: 'normal', opacity: .55 }}>Disponible</em>}
                  </span>
                  {b.estatus !== 'Disponible' && (
                    <span className={`badge badge-${
                      b.estatus === 'Liquidado' ? 'liquidado'
                        : b.estatus === 'Apartado' ? 'abonado'
                        : 'deuda'
                    }`} style={{ fontSize: '.7rem', flexShrink: 0 }}>
                      {b.estatus}
                    </span>
                  )}
                  {Number(b.total_pagado) > 0 && (
                    <span style={{ fontSize: '.8rem', color: 'var(--liquidado)', flexShrink: 0 }}>{fmt(b.total_pagado)}</span>
                  )}
                  {Number(b.saldo_pendiente) > 0 && (
                    <span style={{ fontSize: '.8rem', color: 'var(--abonado)', flexShrink: 0 }}>-{fmt(b.saldo_pendiente)}</span>
                  )}
                  {esGanador && (
                    <span style={{ marginLeft: 'auto', fontSize: '.75rem', color: 'var(--abonado)', flexShrink: 0 }}>★ Ganador</span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Lista de ganadores elegidos ── */}
        {ganadores.length > 0 && (
          <div className="ganadores-list">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.5rem 0 .5rem', flexWrap: 'wrap', gap: '.5rem' }}>
              <p className="section-heading" style={{ margin: 0 }}>Ganadores del sorteo</p>
              <button
                className="btn btn-sm"
                style={{ color: 'var(--deuda)', border: '1px solid var(--deuda)', background: 'none' }}
                onClick={handleResetSorteo}
                title="Reiniciar sorteo — elimina todos los ganadores guardados"
              >
                <RotateCcw size={13} /> Reiniciar sorteo
              </button>
            </div>
            {ganadores.map((g, i) => (
              <div key={g.id} className="ganador-row">
                <span className="ganador-lugar">{(['1er','2do','3er'][i] ?? `${i+1}to`)} lugar</span>
                <span className="ganador-num">#{fmtNum(g.numero_asignado, total)}</span>
                <span className="ganador-nombre">{g.participantes?.nombre_completo ?? '—'}</span>
                {g.participantes?.telefono_whatsapp && (
                  <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
                    {g.participantes.telefono_whatsapp}
                  </span>
                )}
                <button
                  className="btn btn-icon btn-danger-icon"
                  style={{ marginLeft: 'auto', flexShrink: 0 }}
                  onClick={() => handleRemoveGanador(g.id)}
                  title="Eliminar este ganador"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {boletosLiqDisp > 0 && (
              <button className="btn btn-outline" style={{ marginTop: '.75rem' }} onClick={handleElegirGanador}>
                <Trophy size={14} /> Elegir {ganadores.length + 1}er lugar ({boletosLiqDisp} disponibles)
              </button>
            )}
          </div>
        )}
      </div>

      {/* ══ Panel lateral ══════════════════════════════════════════════════════ */}
      {panel && (
        <>
          <div className="drawer-overlay" onClick={closePanel} />
          <div className="drawer boleto-panel" role="dialog" aria-modal="true">

            {/* Cabecera del panel */}
            <div className="drawer-header">
              <h3 className="drawer-title">
                {panel.mode === 'asignar'
                  ? `Apartar boleto #${fmtNum(panel.boleto.numero_asignado, total)}`
                  : `Boleto #${fmtNum(panel.boleto.numero_asignado, total)}`}
                {panel.mode === 'gestionar' && (
                  <span
                    className={`badge badge-${
                      panel.boleto.estatus === 'Liquidado' ? 'liquidado'
                        : panel.boleto.estatus === 'Apartado'  ? 'abonado'
                        : 'deuda'
                    }`}
                    style={{ fontSize: '.72rem', marginLeft: '.5rem' }}
                  >
                    {panel.boleto.estatus}
                  </span>
                )}
              </h3>
              <button className="drawer-close" onClick={closePanel}><X size={18} /></button>
            </div>

            {/* Cuerpo del panel */}
            <div className="drawer-body">

              {/* ── MODO: ASIGNAR ── */}
              {panel.mode === 'asignar' && (
                <>
                  <div className="boleto-panel-info-row">
                    <span>Precio del boleto</span>
                    <strong>{fmt(rifa.precio_boleto)}</strong>
                  </div>

                  <p className="field-section-label">Participante</p>

                  {/* Búsqueda de participante existente */}
                  {!showNewForm && (
                    <div className="field" style={{ position: 'relative' }}>
                      <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <input
                          value={partSearch}
                          onChange={e => handlePartSearch(e.target.value)}
                          placeholder="Buscar por nombre o teléfono…"
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
                          <button
                            className="btn btn-icon"
                            onClick={() => { setPartSeleccionado(null); setPartSearch('') }}
                          >
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
                        <label>Teléfono WhatsApp</label>
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
              {panel.mode === 'gestionar' && (
                <>
                  {/* Info del participante — clic navega al perfil */}
                  <div
                    className="boleto-participante-card"
                    style={{ cursor: panel.boleto.participante_id ? 'pointer' : 'default' }}
                    onClick={() => panel.boleto.participante_id && navigate(`/participantes/${panel.boleto.participante_id}`)}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: '.15rem' }}>
                        {panel.boleto.nombre_completo ?? '—'}
                      </div>
                      <div style={{ fontSize: '.82rem', color: 'var(--text-muted)' }}>
                        {panel.boleto.telefono_whatsapp ?? 'Sin teléfono'}
                      </div>
                      {panel.boleto.fecha_apartado && (
                        <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.15rem' }}>
                          <Clock size={11} /> Apartado: {fmtDate(panel.boleto.fecha_apartado)}
                        </div>
                      )}
                      {panel.boleto.participante_id && (
                        <div style={{ fontSize: '.73rem', color: 'var(--accent-light)', marginTop: '.3rem', display: 'flex', alignItems: 'center', gap: '.2rem' }}>
                          Ver perfil <ArrowRight size={11} />
                        </div>
                      )}
                    </div>
                    <div onClick={e => e.stopPropagation()}>
                      {panel.boleto.telefono_whatsapp && panel.boleto.saldo_pendiente > 0 && (
                        <WhatsAppLink
                          nombre={panel.boleto.nombre_completo}
                          telefono={panel.boleto.telefono_whatsapp}
                          saldo={panel.boleto.saldo_pendiente}
                        />
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
                    <strong style={{ color: 'var(--liquidado)' }}>{fmt(panel.boleto.total_pagado)}</strong>
                  </div>
                  <div className="boleto-panel-info-row" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '.5rem', marginBottom: '.75rem' }}>
                    <span>Saldo pendiente</span>
                    <strong style={{ color: panel.boleto.saldo_pendiente > 0 ? 'var(--abonado)' : 'var(--liquidado)' }}>
                      {fmt(Math.max(0, panel.boleto.saldo_pendiente))}
                    </strong>
                  </div>
                  <ProgressBar value={Number(panel.boleto.total_pagado)} max={Number(rifa.precio_boleto)} />

                  {/* Historial de pagos */}
                  <p className="field-section-label" style={{ marginTop: '1rem' }}>Historial de pagos</p>
                  {loadingPagos ? (
                    <p style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>Cargando…</p>
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
                            <button
                              className="btn btn-icon btn-danger-icon"
                              onClick={() => handleDeletePago(p.id)}
                              disabled={saving}
                              title="Eliminar pago"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Agregar pago */}
                  {isAdmin && panel.boleto.estatus !== 'Liquidado' && (
                    <>
                      {showAddPago ? (
                        <div style={{ marginTop: '.75rem' }}>
                          <p className="field-section-label">Nuevo pago</p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                            <div className="field">
                              <label>Monto</label>
                              <input
                                type="number"
                                min="1"
                                value={formPago.monto}
                                onChange={e => setFormPago(f => ({ ...f, monto: e.target.value }))}
                                placeholder="$"
                                autoFocus
                              />
                            </div>
                            <div className="field">
                              <label>Fecha</label>
                              <input
                                type="date"
                                value={formPago.fecha}
                                onChange={e => setFormPago(f => ({ ...f, fecha: e.target.value }))}
                              />
                            </div>
                          </div>
                          <div className="field">
                            <label>Método</label>
                            <select
                              value={formPago.metodo_pago}
                              onChange={e => setFormPago(f => ({ ...f, metodo_pago: e.target.value }))}
                            >
                              {['Efectivo', 'Transferencia', 'Tarjeta', 'Otro'].map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          </div>
                          <div style={{ display: 'flex', gap: '.5rem' }}>
                            <button className="btn btn-primary btn-sm" onClick={handleAddPago} disabled={saving}>
                              {saving ? 'Guardando…' : 'Guardar pago'}
                            </button>
                            <button className="btn btn-outline btn-sm" onClick={() => setShowAddPago(false)}>
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="btn btn-outline"
                          style={{ width: '100%', marginTop: '.75rem' }}
                          onClick={() => setShowAddPago(true)}
                        >
                          <Plus size={14} /> Registrar pago
                        </button>
                      )}
                    </>
                  )}

                  {/* Acciones */}
                  {isAdmin && (
                    <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                      {panel.boleto.estatus === 'Apartado' && (
                        <button
                          className="btn btn-primary"
                          onClick={handleLiquidar}
                          disabled={saving}
                        >
                          <CheckCircle2 size={15} /> Marcar como liquidado
                        </button>
                      )}

                      {/* Liberar con confirmación inline */}
                      {!confirmLib ? (
                        <button
                          className="btn btn-outline"
                          style={{ color: 'var(--deuda)', borderColor: 'var(--deuda)' }}
                          onClick={() => setConfirmLib(true)}
                          disabled={saving}
                        >
                          <Zap size={14} /> Liberar boleto
                        </button>
                      ) : (
                        <div className="inline-confirm">
                          <p>¿Liberar este boleto? Se volverá disponible y perderá su participante.</p>
                          <div style={{ display: 'flex', gap: '.5rem' }}>
                            <button className="btn btn-danger btn-sm" onClick={handleLiberar} disabled={saving}>
                              {saving ? '…' : 'Sí, liberar'}
                            </button>
                            <button className="btn btn-outline btn-sm" onClick={() => setConfirmLib(false)}>
                              No
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Pie del panel */}
            <div className="drawer-footer">
              {panel.mode === 'asignar' ? (
                <>
                  <button className="btn btn-outline" onClick={closePanel} disabled={saving}>Cancelar</button>
                  <button className="btn btn-primary" onClick={handleAsignar} disabled={saving}>
                    {saving ? 'Guardando…' : 'Apartar'}
                  </button>
                </>
              ) : (
                <button className="btn btn-outline" onClick={closePanel} style={{ width: '100%' }}>Cerrar</button>
              )}
            </div>
          </div>
        </>
      )}

      {/* ══ Import CSV ════════════════════════════════════════════════════════ */}
      <input
        type="file" accept=".csv" ref={fileInputRef}
        style={{ display: 'none' }} onChange={handleImportFile}
      />
      {importModal && (
        <ImportModal
          preview={importModal.preview}
          importing={importModal.importing}
          onConfirm={handleConfirmImport}
          onClose={() => setImportModal(null)}
        />
      )}

      {/* ══ Tómbola y ganador ══════════════════════════════════════════════════ */}
      {tombola && ultimoGanador && (
        <TombolaModal
          ganador={ultimoGanador}
          lugar={ganadores.length}
          total={total}
          onClose={() => setTombola(false)}
        />
      )}

      {errModal && <ErrorModal {...errModal} onClose={() => setErrModal(null)} />}
    </>
  )
}
