import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowRight, LayoutGrid, ChevronDown, ChevronUp } from 'lucide-react'
import { useQuery } from '../lib/useQuery.js'
import { fmt, fmtNum, fmtDate } from '../lib/formatters.js'
import { getPendientes, getCampanas, getRifasByCampana } from '../lib/rifas-queries.js'
import Breadcrumbs from '../components/Breadcrumbs.jsx'
import LoadingSpinner, { ErrorMsg } from '../components/LoadingSpinner.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import WhatsAppBtn from '../components/WhatsAppBtn.jsx'

export default function Pendientes() {
  const [campanaId, setCampanaId] = useState('')
  const [rifaId,    setRifaId]    = useState('')
  const [estatus,   setEstatus]   = useState('')    // '' = Apartado + Vencido

  const campanasQ = useQuery(() => getCampanas(), [])
  const rifasQ    = useQuery(
    () => campanaId ? getRifasByCampana(campanaId) : Promise.resolve([]),
    [campanaId]
  )
  const pendQ = useQuery(
    () => getPendientes({
      campanaId: campanaId || null,
      rifaId:    rifaId    || null,
      estatus:   estatus   || null,
    }),
    [campanaId, rifaId, estatus]
  )

  const crumbs = [{ label: 'Pendientes de pago' }]
  const pendientes = pendQ.data ?? []

  // Totales
  const { totalSaldo, totalAbonado } = useMemo(() => ({
    totalSaldo:   pendientes.reduce((s, b) => s + Number(b.saldo_pendiente), 0),
    totalAbonado: pendientes.reduce((s, b) => s + Number(b.total_pagado),    0),
  }), [pendientes])

  // Agrupar por rifa con métricas por grupo
  const agrupados = useMemo(() => {
    if (rifaId) return null   // lista plana cuando se filtra por rifa
    const map = new Map()
    for (const b of pendientes) {
      if (!map.has(b.rifa_id)) map.set(b.rifa_id, {
        rifaId:   b.rifa_id,
        campanaId: b.campana_id,
        nombre:   b.nombre_premio,
        boletos:  [],
        saldo:    0,
        abonado:  0,
        apartado: 0,
        vencido:  0,
      })
      const g = map.get(b.rifa_id)
      g.boletos.push(b)
      g.saldo   += Number(b.saldo_pendiente)
      g.abonado += Number(b.total_pagado)
      if (b.estatus === 'Apartado') g.apartado++
      else if (b.estatus === 'Vencido') g.vencido++
    }
    return [...map.values()]
  }, [pendientes, rifaId])

  function handleCampana(e) {
    setCampanaId(e.target.value)
    setRifaId('')
  }

  return (
    <>
      <Breadcrumbs crumbs={crumbs} />
      <div className="page">
        <div className="page-title-row">
          <h1 className="page-title"><AlertCircle size={20} /> Pendientes de pago</h1>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {/* Campaña */}
          <select
            value={campanaId}
            onChange={handleCampana}
            style={selectStyle}
          >
            <option value="">Todas las campañas</option>
            {(campanasQ.data ?? []).map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>

          {/* Rifa (solo cuando hay campaña seleccionada) */}
          {campanaId && (
            <select value={rifaId} onChange={e => setRifaId(e.target.value)} style={selectStyle}>
              <option value="">Todas las rifas</option>
              {(rifasQ.data ?? []).map(r => (
                <option key={r.id} value={r.id}>{r.nombre_premio}</option>
              ))}
            </select>
          )}

          {/* Estatus */}
          <div style={{ display: 'flex', gap: '.35rem' }}>
            {[['', 'Todos'], ['Apartado', '🟡 Apartado'], ['Vencido', '🔴 Vencido']].map(([val, label]) => (
              <button
                key={val}
                className={`btn btn-sm ${estatus === val ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setEstatus(val)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Resumen */}
          {!pendQ.loading && (
            <span style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              <strong style={{ color: 'var(--text)' }}>{pendientes.length}</strong> boletos ·
              Abonado: <strong style={{ color: 'var(--liquidado)' }}>{fmt(totalAbonado)}</strong> ·
              Por cobrar: <strong style={{ color: 'var(--abonado)' }}>{fmt(totalSaldo)}</strong>
            </span>
          )}
        </div>

        {pendQ.loading && !pendQ.data ? (
          <LoadingSpinner text="Cargando pendientes…" />
        ) : pendQ.error ? (
          <ErrorMsg message={pendQ.error} />
        ) : pendientes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '3rem' }}>
            Sin boletos pendientes de pago.
          </p>
        ) : rifaId ? (
          // Lista plana cuando se filtra por rifa
          <PendientesList boletos={pendientes} />
        ) : (
          // Grupos por rifa con tarjeta de resumen colapsable
          (agrupados ?? []).map(grupo => (
            <GrupoRifa key={grupo.rifaId} grupo={grupo} />
          ))
        )}
      </div>
    </>
  )
}

function GrupoRifa({ grupo }) {
  const [open, setOpen] = useState(true)
  const pctVencido = grupo.boletos.length > 0 ? Math.round(grupo.vencido / grupo.boletos.length * 100) : 0

  return (
    <div style={{ marginBottom: '1.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      {/* Cabecera del grupo — clickable */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '1rem',
          padding: '.75rem 1rem', background: 'var(--bg-muted, var(--card-bg, var(--bg)))',
          border: 'none', borderBottom: open ? '1px solid var(--border)' : 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <LayoutGrid size={15} style={{ color: 'var(--accent-light)', flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '.95rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {grupo.nombre}
          </div>
          <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.1rem', display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
            <span><strong style={{ color: 'var(--text)' }}>{grupo.boletos.length}</strong> boleto{grupo.boletos.length !== 1 ? 's' : ''}</span>
            {grupo.apartado > 0 && <span style={{ color: 'var(--abonado)' }}>🟡 {grupo.apartado} apartado{grupo.apartado !== 1 ? 's' : ''}</span>}
            {grupo.vencido  > 0 && <span style={{ color: 'var(--deuda)' }}>🔴 {grupo.vencido} vencido{grupo.vencido !== 1 ? 's' : ''}</span>}
          </div>
        </div>

        {/* Métricas compactas */}
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Abonado</div>
            <div style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--liquidado)' }}>{fmt(grupo.abonado)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Por cobrar</div>
            <div style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--abonado)' }}>{fmt(grupo.saldo)}</div>
          </div>
          {pctVencido > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Vencidos</div>
              <div style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--deuda)' }}>{pctVencido}%</div>
            </div>
          )}
          <Link
            to={`/rifas/${grupo.campanaId}/sorteos/${grupo.rifaId}`}
            onClick={e => e.stopPropagation()}
            style={{ fontSize: '.75rem', color: 'var(--accent-light)', display: 'flex', alignItems: 'center', gap: '.15rem', textDecoration: 'none', flexShrink: 0 }}
          >
            Ver rifa <ArrowRight size={11} />
          </Link>
          {open ? <ChevronUp size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
        </div>
      </button>

      {/* Tabla colapsable */}
      {open && <PendientesList boletos={grupo.boletos} />}
    </div>
  )
}

function PendientesList({ boletos }) {
  return (
    <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.875rem' }}>
        <thead>
          <tr style={{ background: 'var(--bg-muted, var(--bg))', borderBottom: '1px solid var(--border)' }}>
            {['Boleto', 'Participante', 'Estatus', 'Apartado', 'Abonado', 'Saldo', ''].map(h => (
              <th key={h} style={{ padding: '.6rem .9rem', textAlign: 'left', fontWeight: 600, fontSize: '.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {boletos.map(b => (
            <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '.55rem .9rem', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                <Link
                  to={`/rifas/${b.campana_id}/sorteos/${b.rifa_id}`}
                  style={{ color: 'var(--accent-light)', textDecoration: 'none' }}
                >
                  #{fmtNum(b.numero_asignado, b.cantidad_boletos)}
                </Link>
              </td>
              <td style={{ padding: '.55rem .9rem' }}>
                {b.participante_id ? (
                  <Link
                    to={`/participantes/${b.participante_id}`}
                    style={{ color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '.2rem', textDecoration: 'none' }}
                  >
                    {b.nombre_completo ?? '—'} <ArrowRight size={11} />
                  </Link>
                ) : (b.nombre_completo ?? '—')}
              </td>
              <td style={{ padding: '.55rem .9rem' }}>
                <StatusBadge status={b.estatus} style={{ fontSize: '.72rem' }} />
              </td>
              <td style={{ padding: '.55rem .9rem', color: 'var(--text-muted)', fontSize: '.8rem', whiteSpace: 'nowrap' }}>
                {fmtDate(b.fecha_apartado)}
              </td>
              <td style={{ padding: '.55rem .9rem', color: 'var(--liquidado)', fontWeight: 500, textAlign: 'right', whiteSpace: 'nowrap' }}>
                {fmt(b.total_pagado)}
              </td>
              <td style={{ padding: '.55rem .9rem', color: 'var(--abonado)', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>
                {fmt(b.saldo_pendiente)}
              </td>
              <td style={{ padding: '.55rem .9rem', textAlign: 'right' }}>
                {b.telefono_whatsapp && (
                  <WhatsAppBtn
                    nombre={b.nombre_completo}
                    telefono={b.telefono_whatsapp}
                    saldo={b.saldo_pendiente}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const selectStyle = {
  minWidth: '13rem', height: '2.2rem',
  borderRadius: 'var(--radius)', border: '1px solid var(--border)',
  background: 'var(--bg)', color: 'var(--text)',
  padding: '0 .75rem', fontSize: '.875rem',
}
