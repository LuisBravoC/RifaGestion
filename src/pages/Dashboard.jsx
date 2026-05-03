import { Link } from 'react-router-dom'
import { Ticket, ArrowRight, Activity } from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '../lib/useQuery.js'
import { getCampanasConResumen, getRecaudacionPorMes, getRecaudacionVsMeta, getRecaudacionPorMetodoPago } from '../lib/rifas-queries.js'
import { fmt } from '../lib/formatters.js'
import ProgressBar from '../components/ProgressBar.jsx'
import LoadingSpinner, { ErrorMsg } from '../components/LoadingSpinner.jsx'
import ChartRecaudacionMes from '../components/ChartRecaudacionMes.jsx'
import ChartRecaudacionVsMeta from '../components/ChartRecaudacionVsMeta.jsx'
import ChartRecaudacionPorMetodo from '../components/ChartRecaudacionPorMetodo.jsx'

export default function Dashboard() {
  const [chartMode, setChartMode] = useState('todas')
  const campanasQ = useQuery(() => getCampanasConResumen(), [])
  const recaudacionMesQ = useQuery(() => getRecaudacionPorMes(), [])
  const recaudacionPorMetodoQ = useQuery(() => getRecaudacionPorMetodoPago(), [])

  // Para gráfica vs Meta, necesitamos seleccionar una campaña o mostrar todas
  // Por ahora mostraremos la primera campaña activa
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
      <div style={{ marginTop: '2rem', marginBottom: '1rem', display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
        {['todas', 'recaudacion', 'metas', 'metodos'].map(mode => (
          <button
            key={mode}
            onClick={() => setChartMode(mode)}
            style={{
              padding: '.5rem 1rem',
              borderRadius: '.5rem',
              border: 'none',
              cursor: 'pointer',
              background: chartMode === mode ? 'var(--accent-light)' : 'var(--bg-secondary)',
              color: chartMode === mode ? 'var(--bg)' : 'var(--text)',
              fontSize: '.85rem',
              fontWeight: chartMode === mode ? '600' : '500',
              transition: 'all .2s ease',
            }}
          >
            {mode === 'todas' && '📊 Todas'}
            {mode === 'recaudacion' && '📈 Recaudación'}
            {mode === 'metas' && '🎯 Metas'}
            {mode === 'metodos' && '💳 Métodos'}
          </button>
        ))}
      </div>

      {/* Todas las gráficas en modo compacto */}
      {chartMode === 'todas' && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem' }}>
            <div>
              <p style={{ fontSize: '.9rem', fontWeight: '600', marginBottom: '.5rem', color: 'var(--text-muted)' }}>Recaudación por Mes</p>
              <ChartRecaudacionMes 
                data={recaudacionMesQ.data} 
                loading={recaudacionMesQ.loading} 
                error={recaudacionMesQ.error} 
              />
            </div>
            {primeraCampanaId && (
              <div>
                <p style={{ fontSize: '.9rem', fontWeight: '600', marginBottom: '.5rem', color: 'var(--text-muted)' }}>Recaudado vs Meta</p>
                <ChartRecaudacionVsMeta 
                  data={recaudacionVsMetaQ.data} 
                  loading={recaudacionVsMetaQ.loading} 
                  error={recaudacionVsMetaQ.error} 
                />
              </div>
            )}
            <div>
              <p style={{ fontSize: '.9rem', fontWeight: '600', marginBottom: '.5rem', color: 'var(--text-muted)' }}>Recaudación por Método (30d)</p>
              <ChartRecaudacionPorMetodo 
                data={recaudacionPorMetodoQ.data} 
                loading={recaudacionPorMetodoQ.loading} 
                error={recaudacionPorMetodoQ.error} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Modo individual - Recaudación */}
      {chartMode === 'recaudacion' && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <p className="section-heading" style={{ marginTop: 0 }}>📈 Recaudación por Mes</p>
          <div style={{ height: 400 }}>
            <ChartRecaudacionMes 
              data={recaudacionMesQ.data} 
              loading={recaudacionMesQ.loading} 
              error={recaudacionMesQ.error} 
            />
          </div>
        </div>
      )}

      {/* Modo individual - Metas */}
      {chartMode === 'metas' && primeraCampanaId && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <p className="section-heading" style={{ marginTop: 0 }}>🎯 Recaudado vs Meta</p>
          <div style={{ height: 400 }}>
            <ChartRecaudacionVsMeta 
              data={recaudacionVsMetaQ.data} 
              loading={recaudacionVsMetaQ.loading} 
              error={recaudacionVsMetaQ.error} 
            />
          </div>
        </div>
      )}

      {/* Modo individual - Métodos */}
      {chartMode === 'metodos' && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <p className="section-heading" style={{ marginTop: 0 }}>💳 Recaudación por Método (últimos 30 días)</p>
          <div style={{ height: 400 }}>
            <ChartRecaudacionPorMetodo 
              data={recaudacionPorMetodoQ.data} 
              loading={recaudacionPorMetodoQ.loading} 
              error={recaudacionPorMetodoQ.error} 
            />
          </div>
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
