import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function ChartApartadosPorDia({ data, loading, error, height = 300 }) {
  if (loading) return <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Cargando gráfica...</div>
  if (error) return <div style={{ color: 'var(--deuda)', padding: '1rem' }}>Error al cargar datos</div>
  if (!data || data.length === 0) return <div style={{ color: 'var(--text-muted)', padding: '1rem' }}>Sin datos</div>

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="5 5" />
          <XAxis dataKey="dia" stroke="var(--text-muted)" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
            formatter={(value) => [`${value} boletos`, 'Apartados']}
          />
          <Bar dataKey="apartados" fill="var(--abonado)" name="Apartados" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
