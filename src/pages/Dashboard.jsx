import { Link } from 'react-router-dom'
import { Building2, ArrowRight, Activity, AlertCircle } from 'lucide-react'
import { useQuery } from '../lib/useQuery.js'
import * as q from '../lib/queries.js'
import { fmt } from '../lib/formatters.js'
import ProgressBar from '../components/ProgressBar.jsx'
import LoadingSpinner, { ErrorMsg } from '../components/LoadingSpinner.jsx'


export default function Dashboard() {
  const global = useQuery(() => q.getResumenGlobal(), [])
  const insts  = useQuery(() => q.getInstitucionesConResumen(), [])

  if (global.loading || insts.loading) return <LoadingSpinner text="Cargando dashboard…" />
  if (global.error) return <ErrorMsg message={global.error} />
  if (insts.error)  return <ErrorMsg message={insts.error} />

  const g = global.data

  return (
    <div className="page">
      <h1 className="page-title"><Activity size={22} /> Dashboard Global</h1>

      <div className="grid grid-stats" style={{ marginBottom: '2rem' }}>
        <div className="card stat-card">
          <div className="stat-value esperado">{fmt(g.totalEsperado)}</div>
          <div className="stat-label">Total esperado</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value cobrado">{fmt(g.totalCobrado)}</div>
          <div className="stat-label">Total cobrado</div>
        </div>
        <Link to="/deudas" className="card stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="stat-value por-cobrar">{fmt(g.porCobrar)}</div>
          <div className="stat-label">Por cobrar</div>
          <div style={{ marginTop: '.5rem', fontSize: '.75rem', color: 'var(--abonado)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.2rem' }}>
            <AlertCircle size={11} /> Ver deudas
          </div>
        </Link>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: 'var(--accent-light)' }}>{g.activos}</div>
          <div className="stat-label">Proyectos activos</div>
        </div>
      </div>

      <ProgressBar value={g.totalCobrado} max={g.totalEsperado} />

      <p className="section-heading">Instituciones — resumen activo</p>
      <div className="grid grid-auto">
        {insts.data.map(inst => (
          <InstCard key={inst.id} inst={inst} resumen={inst.resumen} />
        ))}
      </div>
    </div>
  )
}

function InstCard({ inst, resumen }) {
  const res = resumen ?? { totalEsperado: 0, totalCobrado: 0, porCobrar: 0 }

  return (
    <Link to={`/instituciones/${inst.id}`} className="card card-link">
      <div className="card-header">
        <div>
          <div className="card-title">{inst.nombre}</div>
          <div className="card-sub">{inst.contacto}</div>
        </div>
        <Building2 size={20} className="card-icon" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', color: 'var(--text-muted)', margin: '.5rem 0 .25rem' }}>
        <span>Cobrado: <strong style={{ color: 'var(--liquidado)' }}>{fmt(res.totalCobrado)}</strong></span>
        <span>Falta: <strong style={{ color: 'var(--abonado)' }}>{fmt(res.porCobrar)}</strong></span>
      </div>
      <ProgressBar value={res.totalCobrado} max={res.totalEsperado} />
      <div style={{ marginTop: '.75rem', display: 'flex', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: '.8rem', color: 'var(--accent-light)', display: 'flex', alignItems: 'center', gap: '.2rem' }}>
          Ver detalle <ArrowRight size={13} />
        </span>
      </div>
    </Link>
  )
}
