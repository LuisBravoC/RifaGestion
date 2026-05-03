import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function ChartRecaudacionVsMeta({ data, loading, error, height = 300 }) {
  if (loading) return <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Cargando gráfica...</div>
  if (error) return <div style={{ color: 'var(--deuda)', padding: '1rem' }}>Error al cargar datos</div>
  if (!data || data.length === 0) return <div style={{ color: 'var(--text-muted)', padding: '1rem' }}>Sin datos</div>

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="nombre" stroke="var(--text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '.5rem', fontSize: '.82rem' }}
            formatter={(value) => `$${Number(value).toLocaleString('es-MX')}`}
            cursor={{ fill: 'transparent' }}
          />
          <Bar dataKey="meta" fill="var(--abonado)" name="Meta" radius={[3, 3, 0, 0]} opacity={0.7} activeBar={{ fill: 'var(--abonado)', opacity: 0.55 }} />
          <Bar dataKey="recaudado" fill="var(--liquidado)" name="Recaudado" radius={[3, 3, 0, 0]} activeBar={{ fill: 'var(--liquidado)', opacity: 0.75 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
