/**
 * boleto-expiry.js — Lógica de vencimiento de boletos.
 *
 * Módulo PURO: sin imports, sin dependencias de backend.
 * Puede reutilizarse con cualquier fuente de datos (Supabase, REST, local, etc.).
 *
 * El write-back a la BD es responsabilidad del adaptador (rifas-queries.js).
 * Reemplazar ese adaptador es suficiente para migrar de backend.
 */

/**
 * Fecha límite a partir de la cual un Apartado se considera Vencido.
 * @param {number} horasExpiracion
 * @returns {Date}
 */
export function cutoffDate(horasExpiracion) {
  return new Date(Date.now() - horasExpiracion * 3_600_000)
}

/**
 * Devuelve true si el boleto debería vencerse.
 * @param {{ estatus: string, fecha_apartado: string|null }} boleto
 * @param {number} horasExpiracion
 */
export function shouldExpire(boleto, horasExpiracion) {
  if (!horasExpiracion || boleto.estatus !== 'Apartado' || !boleto.fecha_apartado) return false
  return new Date(boleto.fecha_apartado) < cutoffDate(horasExpiracion)
}

/**
 * Aplica la expiración EN MEMORIA sobre un array de boletos.
 * No realiza ninguna llamada a BD.
 * Los boletos Apartados cuya fecha_apartado superó el límite aparecen como Vencidos.
 *
 * @param {Array}  boletos
 * @param {number} horasExpiracion
 * @returns {Array} nuevo array (inmutable)
 */
export function applyExpiry(boletos, horasExpiracion) {
  if (!horasExpiracion || !boletos?.length) return boletos ?? []
  return boletos.map(b => shouldExpire(b, horasExpiracion) ? { ...b, estatus: 'Vencido' } : b)
}
