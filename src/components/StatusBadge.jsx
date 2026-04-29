const STATUS_LABEL = { deuda: '🔴 Deuda', abonado: '🟡 Abonado', liquidado: '🟢 Liquidado' }

export default function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${status}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}
