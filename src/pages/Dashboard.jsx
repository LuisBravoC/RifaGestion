import { Link } from 'react-router-dom'
import { Ticket, ArrowRight, Activity, LayoutDashboard, TrendingUp, Target, CreditCard, CalendarDays, Users } from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '../lib/useQuery.js'
import { getCampanasConResumen, getRecaudacionPorDia, getRecaudacionVsMeta, getRecaudacionPorMetodoPago, getApartadosPorDia, getNuevosParticipantesPorDia } from '../lib/rifas-queries.js'
import { fmt } from '../lib/formatters.js'
import ProgressBar from '../components/ProgressBar.jsx'
import LoadingSpinner, { ErrorMsg } from '../components/LoadingSpinner.jsx'
import ChartRecaudacionMes from '../components/ChartRecaudacionMes.jsx'
import ChartRecaudacionVsMeta from '../components/ChartRecaudacionVsMeta.jsx'
import ChartRecaudacionPorMetodo from '../components/ChartRecaudacionPorMetodo.jsx'
import ChartApartadosPorDia from '../components/ChartApartadosPorDia.jsx'
import ChartNuevosParticipantes from '../components/ChartNuevosParticipantes.jsx'

export default function Dashboard() {
  const [chartMode, setChartMode] = useState('todas')
  const campanasQ = useQuery(() => getCampanasConResumen(), [])
  const recaudacionDiaQ = useQuery(() => getRecaudacionPorDia(), [])
  const recaudacionPorMetodoQ = useQuery(() => getRecaudacionPorMetodoPago(), [])
  const apartadosDiaQ = useQuery(() => getApartadosPorDia(), [])
  const participantesDiaQ = useQuery(() => getNuevosParticipantesPorDia(), [])

  const primeraCampanaId = campanasQ.data?.[0]?.id
  const recaudacionVsMetaQ = useQuery(
    () => primeraCampanaId ? getRecaudacionVsMeta(primeraCampanaId) : Promise.resolve([]),
    [primeraCampanaId]
  )

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

      {/* Selector de Gráficas */}
      {(() => {
        const TABS = [
          { id: 'todas',       label: 'Todas',         Icon: LayoutDashboard },
          { id: 'recaudacion', label: 'Recaudación',   Icon: TrendingUp },
          { id: 'actividad',   label: 'Actividad',     Icon: CalendarDays },
          { id: 'metas',       label: 'Metas',         Icon: Target },
          { id: 'metodos',     label: 'Métodos',       Icon: CreditCard },
          { id: 'participantes', label: 'Participantes', Icon: Users },
        ]
        return (
          <div style={{ marginTop: '2rem', marginBottom: '1rem', display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setChartMode(id)}
                style={{
                  padding: '.45rem .9rem',
                  borderRadius: '.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '.35rem',
                  background: chartMode === id ? 'var(--accent-light)' : 'var(--bg-secondary)',
                  color: chartMode === id ? 'var(--bg)' : 'var(--text)',
                  fontSize: '.83rem',
                  fontWeight: chartMode === id ? '600' : '500',
                  transition: 'all .15s ease',
                }}
              >
                <Icon size={13} />{label}
              </button>
            ))}
          </div>
        )
      })()}

      {/* Todas las gráficas en modo compacto 2×3 */}
      {chartMode === 'todas' && (
        <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem 1.75rem' }}>
            <div>
              <p style={{ fontSize: '.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-muted)', margin: '0 0 .4rem' }}>Recaudación por día</p>
              <ChartRecaudacionMes data={recaudacionDiaQ.data} loading={recaudacionDiaQ.loading} error={recaudacionDiaQ.error} height={200} xKey="dia" />
            </div>
            <div>
              <p style={{ fontSize: '.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-muted)', margin: '0 0 .4rem' }}>Apartados por día</p>
              <ChartApartadosPorDia data={apartadosDiaQ.data} loading={apartadosDiaQ.loading} error={apartadosDiaQ.error} height={200} />
            </div>
            <div>
              <p style={{ fontSize: '.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-muted)', margin: '0 0 .4rem' }}>Nuevos participantes / día</p>
              <ChartNuevosParticipantes data={participantesDiaQ.data} loading={participantesDiaQ.loading} error={participantesDiaQ.error} height={200} />
            </div>
            {primeraCampanaId && (
              <div>
                <p style={{ fontSize: '.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-muted)', margin: '0 0 .4rem' }}>Recaudado vs Meta</p>
                <ChartRecaudacionVsMeta data={recaudacionVsMetaQ.data} loading={recaudacionVsMetaQ.loading} error={recaudacionVsMetaQ.error} height={200} />
              </div>
            )}
            <div>
              <p style={{ fontSize: '.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-muted)', margin: '0 0 .4rem' }}>Métodos de pago (30d)</p>
              <ChartRecaudacionPorMetodo data={recaudacionPorMetodoQ.data} loading={recaudacionPorMetodoQ.loading} error={recaudacionPorMetodoQ.error} height={200} />
            </div>
          </div>
        </div>
      )}

      {/* Recaudación por día */}
      {chartMode === 'recaudacion' && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <p className="section-heading" style={{ marginTop: 0 }}>Recaudación por día (30d)</p>
          <ChartRecaudacionMes data={recaudacionDiaQ.data} loading={recaudacionDiaQ.loading} error={recaudacionDiaQ.error} height={280} xKey="dia" />
        </div>
      )}

      {/* Actividad: apartados por día */}
      {chartMode === 'actividad' && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <p className="section-heading" style={{ marginTop: 0 }}>Boletos apartados por día (30d)</p>
          <ChartApartadosPorDia data={apartadosDiaQ.data} loading={apartadosDiaQ.loading} error={apartadosDiaQ.error} height={280} />
        </div>
      )}

      {/* Metas */}
      {chartMode === 'metas' && primeraCampanaId && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <p className="section-heading" style={{ marginTop: 0 }}>Recaudado vs Meta</p>
          <ChartRecaudacionVsMeta data={recaudacionVsMetaQ.data} loading={recaudacionVsMetaQ.loading} error={recaudacionVsMetaQ.error} height={280} />
        </div>
      )}

      {/* Métodos */}
      {chartMode === 'metodos' && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <p className="section-heading" style={{ marginTop: 0 }}>Recaudación por método de pago (30d)</p>
          <ChartRecaudacionPorMetodo data={recaudacionPorMetodoQ.data} loading={recaudacionPorMetodoQ.loading} error={recaudacionPorMetodoQ.error} height={280} />
        </div>
      )}

      {/* Participantes (propuesta) */}
      {chartMode === 'participantes' && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <p className="section-heading" style={{ marginTop: 0 }}>Nuevos participantes por día (30d)</p>
          <ChartNuevosParticipantes data={participantesDiaQ.data} loading={participantesDiaQ.loading} error={participantesDiaQ.error} height={280} />
        </div>
      )}

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
