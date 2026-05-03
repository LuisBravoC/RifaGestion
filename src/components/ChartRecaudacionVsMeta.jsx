import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function ChartRecaudacionVsMeta({ data, loading, error, height = 300 }) {
  if (loading) return <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Cargando gráfica...</div>
  if (error) return <div style={{ color: 'var(--deuda)', padding: '1rem' }}>Error al cargar datos</div>
  if (!data || data.length === 0) return <div style={{ color: 'var(--text-muted)', padding: '1rem' }}>Sin datos</div>

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="5 5" />
          <XAxis dataKey="nombre" stroke="var(--text-muted)" />
          <YAxis stroke="var(--text-muted)" />
          <Tooltip 
            contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
            formatter={(value) => `$${Number(value).toLocaleString('es-MX')}`}
          />
          <Legend />
          <Bar dataKey="meta" fill="var(--abonado)" name="Meta" />
          <Bar dataKey="recaudado" fill="var(--liquidado)" name="Recaudado" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
