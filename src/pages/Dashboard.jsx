import { Link } from 'react-router-dom'
import { Ticket, ArrowRight, Activity } from 'lucide-react'
import { useQuery } from '../lib/useQuery.js'
import { getCampanasConResumen } from '../lib/rifas-queries.js'
import { fmt } from '../lib/formatters.js'
import ProgressBar from '../components/ProgressBar.jsx'
import LoadingSpinner, { ErrorMsg } from '../components/LoadingSpinner.jsx'

export default function Dashboard() {
  const campanasQ = useQuery(() => getCampanasConResumen(), [])

  if (campanasQ.loading) return <LoadingSpinner text="Cargando dashboard…" />
  if (campanasQ.error)   return <ErrorMsg message={campanasQ.error} />

  const campanas = campanasQ.data ?? []

  const totalMeta       = campanas.reduce((s, c) => s + (c.resumen?.meta       ?? 0), 0)
  const totalRecaudado  = campanas.reduce((s, c) => s + (c.resumen?.recaudado  ?? 0), 0)
  const totalBoletos    = campanas.reduce((s, c) => s + (c.resumen?.boletos    ?? 0), 0)
  const totalLiquidados = campanas.reduce((s, c) => s + (c.resumen?.liquidados ?? 0), 0)

  return (
    <div className="page">
      <h1 className="page-title"><Activity size={22} /> Dashboard</h1>

      <div className="grid grid-stats" style={{ marginBottom: '2rem' }}>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: 'var(--accent-light)' }}>{campanas.length}</div>
          <div className="stat-label">Campañas</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: 'var(--liquidado)' }}>{fmt(totalRecaudado)}</div>
          <div className="stat-label">Total recaudado</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: 'var(--abonado)' }}>{fmt(totalMeta - totalRecaudado)}</div>
          <div className="stat-label">Por recaudar</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: 'var(--text)' }}>{totalLiquidados} / {totalBoletos}</div>
          <div className="stat-label">Boletos pagados</div>
        </div>
      </div>

      <ProgressBar value={totalRecaudado} max={totalMeta} />

      <p className="section-heading">Campañas</p>
      <div className="grid grid-auto">
        {campanas.map(c => (
          <CampanaCard key={c.id} campana={c} />
        ))}
      </div>
    </div>
  )
}

function CampanaCard({ campana }) {
  const r = campana.resumen ?? { rifas: 0, meta: 0, boletos: 0, liquidados: 0, recaudado: 0 }

  return (
    <Link to={`/rifas/${campana.id}`} className="card card-link">
      <div className="card-header">
        <div>
          <div className="card-title">{campana.nombre}</div>
          <div className="card-sub">{r.rifas} {r.rifas === 1 ? 'rifa' : 'rifas'} · {r.boletos} boletos vendidos</div>
        </div>
        <Ticket size={20} className="card-icon" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', color: 'var(--text-muted)', margin: '.5rem 0 .25rem' }}>
        <span>Recaudado: <strong style={{ color: 'var(--liquidado)' }}>{fmt(r.recaudado)}</strong></span>
        <span>Meta: <strong style={{ color: 'var(--abonado)' }}>{fmt(r.meta)}</strong></span>
      </div>
      <ProgressBar value={r.recaudado} max={r.meta} />
      <div style={{ marginTop: '.75rem', display: 'flex', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: '.8rem', color: 'var(--accent-light)', display: 'flex', alignItems: 'center', gap: '.2rem' }}>
          Ver rifas <ArrowRight size={13} />
        </span>
      </div>
    </Link>
  )
}
