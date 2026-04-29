import { MessageCircle } from 'lucide-react'
import { fmt } from '../lib/formatters.js'

/**
 * Props:
 *   nombreTutor   — string
 *   nombreAlumno  — string
 *   telefono      — string (10 dígitos, sin código de país)
 *   saldo         — number
 */
export default function WhatsAppBtn({ nombreTutor, nombreAlumno, telefono, saldo }) {
  const phone = '52' + (telefono ?? '').replace(/\D/g, '')
  // Requiere al menos 10 dígitos después del código de país (12 total)
  if (phone.length < 12) return null
  const saldoFmt = fmt(saldo)
  const msg = `Hola ${nombreTutor}, le recordamos que el saldo pendiente de *${nombreAlumno}* es de *${saldoFmt}*. Puede comunicarse con nosotros para realizar su pago. ¡Gracias!`
  const url  = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-wa"
      title={`WhatsApp a ${nombreTutor}`}
    >
      <MessageCircle size={15} />
    </a>
  )
}
