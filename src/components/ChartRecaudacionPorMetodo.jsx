import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function ChartRecaudacionPorMetodo({ data, loading, error }) {
  if (loading) return <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Cargando gráfica...</div>
  if (error) return <div style={{ color: 'var(--deuda)', padding: '1rem' }}>Error al cargar datos</div>
  if (!data || data.length === 0) return <div style={{ color: 'var(--text-muted)', padding: '1rem' }}>Sin datos</div>

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical">
          <CartesianGrid stroke="var(--border)" strokeDasharray="5 5" />
          <XAxis type="number" stroke="var(--text-muted)" />
          <YAxis dataKey="name" type="category" stroke="var(--text-muted)" width={120} />
          <Tooltip 
            contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
            formatter={(value) => `$${Number(value).toLocaleString('es-MX')}`}
          />
          <Legend />
          <Bar dataKey="value" fill="var(--accent-light)" name="Monto" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
