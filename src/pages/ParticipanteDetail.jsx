import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Users, Phone, Mail, Pencil, Trash2, CheckCircle2,
  Clock, AlertCircle, Trophy, Calendar, ArrowRight, ExternalLink, DollarSign,
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
import Drawer from '../components/Drawer.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'
import ErrorModal from '../components/ErrorModal.jsx'
import { parseError } from '../lib/parseError.js'

// ── Utilidades ────────────────────────────────────────────────────────────────

function fmtNum(n, total) {
  const digits = (total ?? 100) <= 100 ? 2 : String(total ?? 100).length
  return String(n).padStart(digits, '0')
}

function fmtDate(d) {
  if (!d) return '—'
  const raw = typeof d === 'string' && d.length === 10 ? d + 'T12:00:00' : d
  return new Date(raw).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

const STATUS_INFO = {
  Apartado:  { label: '🟡 Apartado',  cls: 'badge-abonado',   icon: Clock },
  Liquidado: { label: '🟢 Liquidado', cls: 'badge-liquidado', icon: CheckCircle2 },
  Vencido:   { label: '🔴 Vencido',   cls: 'badge-deuda',     icon: AlertCircle },
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function ParticipanteDetail() {
  const navigate = useNavigate()
  const { partId } = useParams()
  const [refresh, setRefresh] = useState(0)
  const { isAdmin } = useAuth()
  const toast = useToast()

  const { data, loading, error } = useQuery(
    () => q.getParticipanteConBoletos(partId),
    [partId, refresh]
  )

  const [drawerEdit, setDrawerEdit] = useState(false)
  const [form,       setForm]       = useState({})
  const [saving,     setSaving]     = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [errModal,   setErrModal]   = useState(null)
  const showErr = e => setErrModal(typeof e === 'string' ? { title: 'Aviso', body: e } : (e?.title ? e : parseError(e)))

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function openEdit() {
    const p = data.participante
    setForm({ nombre_completo: p.nombre_completo, telefono_whatsapp: p.telefono_whatsapp ?? '', email: p.email ?? '' })
    setDrawerEdit(true)
  }

  async function handleSave() {
    if (!form.nombre_completo.trim()) { showErr('El nombre es obligatorio.'); return }
    setSaving(true)
    try {
      await q.updateParticipante(partId, form)
      toast('Datos actualizados')
      setDrawerEdit(false)
      setRefresh(r => r + 1)
    } catch (e) { showErr(e) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    setSaving(true)
    try {
      const { supabase } = await import('../lib/supabase.js')
      const { error: err } = await supabase.from('participantes').delete().eq('id', partId)
      if (err) throw err
      toast('Participante eliminado')
      navigate('/participantes', { replace: true })
    } catch (e) { showErr(e) }
    finally { setSaving(false) }
  }

  const crumbs = useBreadcrumbs({ partId: data?.participante?.nombre_completo })

  if (loading) return <><Breadcrumbs crumbs={crumbs} /><LoadingSpinner text="Cargando perfil…" /></>
  if (error)   return <ErrorMsg message={error} />
  if (!data?.participante) return <ErrorMsg message="Participante no encontrado" />

  const { participante: p, rifas } = data

  // Totales globales
  const globalStats = rifas.reduce(
    (acc, rifa) => {
      for (const b of rifa.boletos) {
        acc.total++
        if (b.estatus === 'Liquidado') acc.liquidados++
        if (b.estatus === 'Apartado')  acc.apartados++
        acc.pagado    += Number(b.total_pagado)
        acc.pendiente += Math.max(0, Number(b.saldo_pendiente))
      }
      return acc
    },
    { total: 0, liquidados: 0, apartados: 0, pagado: 0, pendiente: 0 }
  )

  return (
    <>
      <Breadcrumbs crumbs={crumbs} />
      <div className="page">

        {/* ── Cabecera del participante ── */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="part-avatar part-avatar-lg">
              {p.nombre_completo.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '.25rem' }}>{p.nombre_completo}</h2>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '.88rem', color: 'var(--text-muted)' }}>
                {p.telefono_whatsapp && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                    <Phone size={13} /> {p.telefono_whatsapp}
                  </span>
                )}
                {p.email && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                    <Mail size={13} /> {p.email}
                  </span>
                )}
              </div>
            </div>
            {isAdmin && (
              <div style={{ display: 'flex', gap: '.4rem', flexShrink: 0 }}>
                <button className="btn btn-outline btn-sm" onClick={openEdit}>
                  <Pencil size={13} /> Editar
                </button>
                <button
                  className="btn btn-sm"
                  style={{ background: 'none', border: '1px solid var(--deuda)', color: 'var(--deuda)' }}
                  onClick={() => setConfirmDel(true)}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Resumen global de pagos ── */}
        {globalStats.total > 0 && (
          <div className="grid grid-stats" style={{ marginBottom: '1.5rem' }}>
            <div className="card stat-card">
              <div className="stat-value" style={{ color: 'var(--accent-light)' }}>{globalStats.total}</div>
              <div className="stat-label">Boletos totales</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value" style={{ color: 'var(--liquidado)' }}>{globalStats.liquidados}</div>
              <div className="stat-label">Liquidados</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value cobrado">{fmt(globalStats.pagado)}</div>
              <div className="stat-label">Total pagado</div>
            </div>
            {globalStats.pendiente > 0 && (
              <div className="card stat-card">
                <div className="stat-value por-cobrar">{fmt(globalStats.pendiente)}</div>
                <div className="stat-label">Saldo pendiente</div>
              </div>
            )}
          </div>
        )}

        {/* ── Boletos por rifa ── */}
        {rifas.length === 0 ? (
          <div className="empty">
            <Trophy size={40} style={{ opacity: .25 }} />
            <p style={{ marginTop: '.75rem' }}>Este participante no tiene boletos activos.</p>
          </div>
        ) : (
          <>
            <p className="section-heading">
              Boletos por sorteo ({rifas.length} {rifas.length === 1 ? 'rifa' : 'rifas'})
            </p>
            {rifas.map(rifa => (
              <RifaSection key={rifa.rifa_id} rifa={rifa} />
            ))}
          </>
        )}
      </div>

      {/* Drawer editar participante */}
      {drawerEdit && (
        <Drawer
          title="Editar participante"
          onClose={() => setDrawerEdit(false)}
          onSave={handleSave}
          saving={saving}
        >
          <div className="field">
            <label>Nombre completo *</label>
            <input value={form.nombre_completo} onChange={e => set('nombre_completo', e.target.value)} autoFocus />
          </div>
          <div className="field">
            <label>Teléfono WhatsApp</label>
            <input type="tel" value={form.telefono_whatsapp} onChange={e => set('telefono_whatsapp', e.target.value)} />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
        </Drawer>
      )}

      {confirmDel && (
        <ConfirmModal
          message={`¿Eliminar a ${p.nombre_completo}? Sus boletos quedarán disponibles nuevamente.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDel(false)}
          loading={saving}
        />
      )}

      {errModal && <ErrorModal {...errModal} onClose={() => setErrModal(null)} />}
    </>
  )
}

// ── Sección de una rifa con sus boletos ────────────────────────────────────────

function RifaSection({ rifa }) {
  const boletos = rifa.boletos ?? []
  const total   = rifa.cantidad_boletos
  const meta    = Number(rifa.precio_boleto) * boletos.length
  const pagado  = boletos.reduce((s, b) => s + Number(b.total_pagado), 0)
  const pendiente = boletos.reduce((s, b) => s + Math.max(0, Number(b.saldo_pendiente)), 0)

  const gridUrl = rifa.campana_id
    ? `/rifas/${rifa.campana_id}/sorteos/${rifa.rifa_id}`
    : null

  return (
    <div className="part-rifa-section">
      {/* Cabecera de la rifa */}
      <div className="part-rifa-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
            <Trophy size={15} style={{ color: 'var(--abonado)', flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>{rifa.nombre_premio}</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '.25rem', fontSize: '.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            <span><DollarSign size={11} /> {fmt(rifa.precio_boleto)} / boleto</span>
            {rifa.fecha_sorteo && (
              <span><Calendar size={11} /> Sorteo: {fmtDate(rifa.fecha_sorteo)}</span>
            )}
            <span>
              {boletos.length} {boletos.length === 1 ? 'boleto' : 'boletos'} en esta rifa
            </span>
          </div>
        </div>
        {gridUrl && (
          <Link
            to={gridUrl}
            className="btn btn-outline btn-sm"
            style={{ flexShrink: 0 }}
            title="Ver cuadrícula de la rifa"
            onClick={e => e.stopPropagation()}
          >
            <ExternalLink size={13} /> Ver cuadrícula
          </Link>
        )}
      </div>

      {/* Barra de progreso de pago */}
      {meta > 0 && (
        <div style={{ margin: '.5rem 0 .75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: '.25rem' }}>
            <span>Pagado: <strong style={{ color: 'var(--liquidado)' }}>{fmt(pagado)}</strong></span>
            {pendiente > 0
              ? <span>Falta: <strong style={{ color: 'var(--abonado)' }}>{fmt(pendiente)}</strong></span>
              : <span style={{ color: 'var(--liquidado)' }}>✓ Todo liquidado</span>
            }
          </div>
          <ProgressBar value={pagado} max={meta} />
        </div>
      )}

      {/* Lista de boletos */}
      <div className="part-boletos-list">
        {boletos.map(b => <BoletoRow key={b.id} boleto={b} total={total} />)}
      </div>
    </div>
  )
}

// ── Fila individual de boleto ──────────────────────────────────────────────────

function BoletoRow({ boleto: b, total }) {
  const si   = STATUS_INFO[b.estatus] ?? { label: b.estatus, cls: 'badge-abonado' }
  const saldo = Math.max(0, Number(b.saldo_pendiente))

  return (
    <div className={`part-boleto-row part-boleto-${b.estatus.toLowerCase()}`}>
      {/* Número */}
      <div className="part-boleto-num">#{fmtNum(b.numero_asignado, total)}</div>

      {/* Badge estatus */}
      <span className={`badge ${si.cls}`} style={{ fontSize: '.72rem', flexShrink: 0 }}>
        {si.label}
      </span>

      {/* Pagos */}
      <div className="part-boleto-pagos">
        <span>
          Pagado: <strong style={{ color: 'var(--liquidado)' }}>{fmt(b.total_pagado)}</strong>
        </span>
        {saldo > 0 ? (
          <span style={{ color: 'var(--abonado)' }}>
            Falta: <strong>{fmt(saldo)}</strong>
          </span>
        ) : b.estatus !== 'Vencido' ? (
          <span style={{ color: 'var(--liquidado)' }}>✓ Completo</span>
        ) : null}
      </div>

      {/* Fecha apartado */}
      {b.fecha_apartado && (
        <span style={{ fontSize: '.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>
          <Clock size={10} /> {new Date(b.fecha_apartado).toLocaleDateString('es-MX')}
        </span>
      )}
    </div>
  )
}
