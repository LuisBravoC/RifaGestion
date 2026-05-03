import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function ChartRecaudacionMes({ data, loading, error, height = 300, xKey = 'mes' }) {
  if (loading) return <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Cargando gráfica...</div>
  if (error) return <div style={{ color: 'var(--deuda)', padding: '1rem' }}>Error al cargar datos</div>
  if (!data || data.length === 0) return <div style={{ color: 'var(--text-muted)', padding: '1rem' }}>Sin datos</div>

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey={xKey} stroke="var(--text-muted)" tick={{ fontSize: 11 }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
          <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '.5rem', fontSize: '.82rem' }}
            formatter={(value) => [`$${Number(value).toLocaleString('es-MX')}`, 'Recaudado']}
            cursor={{ stroke: 'var(--text-muted)', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Line
            type="monotone"
            dataKey="recaudado"
            stroke="var(--liquidado)"
            name="Recaudado"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: 'var(--liquidado)', stroke: 'none' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
