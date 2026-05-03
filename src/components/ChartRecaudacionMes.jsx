import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function ChartRecaudacionMes({ data, loading, error }) {
  if (loading) return <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Cargando gráfica...</div>
  if (error) return <div style={{ color: 'var(--deuda)', padding: '1rem' }}>Error al cargar datos</div>
  if (!data || data.length === 0) return <div style={{ color: 'var(--text-muted)', padding: '1rem' }}>Sin datos</div>

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="5 5" />
          <XAxis dataKey="mes" stroke="var(--text-muted)" />
          <YAxis stroke="var(--text-muted)" />
          <Tooltip 
            contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
            formatter={(value) => `$${Number(value).toLocaleString('es-MX')}`}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="recaudado" 
            stroke="var(--liquidado)" 
            name="Recaudado"
            strokeWidth={2}
            dot={{ fill: 'var(--liquidado)', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
