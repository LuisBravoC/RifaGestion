// ─── Paquetes (con localStorage para edición de precios) ─────────────────────
const DEFAULT_PAQUETES = [
  {
    id: 1, titulo: 'Básico', precio: 350,
    descripcion: 'Paquete de entrada para grupos pequeños.',
    que_incluye: ['10 fotografías digitales', '1 foto impresa 20×25 cm', 'Galería online por 6 meses'],
  },
  {
    id: 2, titulo: 'Estándar', precio: 550,
    descripcion: 'La opción más popular para primaria y secundaria.',
    que_incluye: ['25 fotografías digitales', '3 fotos impresas 20×25 cm', 'Álbum digital', 'Galería online 1 año'],
  },
  {
    id: 3, titulo: 'Premium', precio: 800,
    descripcion: 'Experiencia completa con sesión extra y álbum físico.',
    que_incluye: ['50 fotografías digitales', '5 fotos impresas 20×25 cm', 'Álbum impreso 20 páginas', 'Video montaje', 'Galería online ilimitada'],
  },
]

function loadPaquetes() {
  try {
    const stored = localStorage.getItem('fg_paquetes')
    if (!stored) return DEFAULT_PAQUETES.map(p => ({ ...p }))
    const overrides = JSON.parse(stored)
    return DEFAULT_PAQUETES.map(p => {
      const ov = overrides.find(o => o.id === p.id)
      return ov ? { ...p, ...ov } : { ...p }
    })
  } catch {
    return DEFAULT_PAQUETES.map(p => ({ ...p }))
  }
}

let _paquetes = loadPaquetes()

export function getAllPaquetes() { return _paquetes }
export function getPaquete(id)   { return _paquetes.find(p => p.id === id) }

export function updatePaquete(id, changes) {
  _paquetes = _paquetes.map(p => p.id === id ? { ...p, ...changes } : p)
  localStorage.setItem('fg_paquetes', JSON.stringify(
    _paquetes.map(({ id, titulo, precio, descripcion }) => ({ id, titulo, precio, descripcion }))
  ))
}

// ─── Instituciones ───────────────────────────────────────────────────────────
export const instituciones = [
  { id: 1, nombre: 'Primaria Benito Juárez',  direccion: 'Calle Morelos 45, Col. Centro', ciudad: 'Culiacán',  contacto: 'Directora M. García' },
  { id: 2, nombre: 'Colegio Occidente',        direccion: 'Av. Las Palmas 200, Col. Norte', ciudad: 'Culiacán',  contacto: 'Director R. López' },
  { id: 3, nombre: 'Escuela Lázaro Cárdenas', direccion: 'Blvd. Insurgentes 88, Col. Sur',  ciudad: 'Mazatlán',  contacto: 'Directora P. Ruiz' },
]

// ─── Proyectos (Generaciones) ─────────────────────────────────────────────────
export const proyectos = [
  { id: 1, institucion_id: 1, año_ciclo: '2023-2026', estatus: 'Finalizado' },
  { id: 2, institucion_id: 1, año_ciclo: '2024-2027', estatus: 'Activo' },
  { id: 3, institucion_id: 2, año_ciclo: '2023-2026', estatus: 'Finalizado' },
  { id: 4, institucion_id: 2, año_ciclo: '2024-2027', estatus: 'Activo' },
  { id: 5, institucion_id: 3, año_ciclo: '2024-2027', estatus: 'Activo' },
]

// ─── Grupos ───────────────────────────────────────────────────────────────────
export const grupos = [
  { id: 1, proyecto_id: 2, nombre: '6to A', turno: 'Matutino' },
  { id: 2, proyecto_id: 2, nombre: '6to B', turno: 'Vespertino' },
  { id: 3, proyecto_id: 4, nombre: '3ro B', turno: 'Matutino' },
  { id: 4, proyecto_id: 4, nombre: '3ro C', turno: 'Vespertino' },
  { id: 5, proyecto_id: 5, nombre: '6to A', turno: 'Matutino' },
]

// ─── Alumnos ──────────────────────────────────────────────────────────────────
export const alumnos = [
  { id: 1,  grupo_id: 1, paquete_id: 2, nombre_alumno: 'Luis Bravo',        nombre_tutor: 'Roberto Bravo',      telefono_contacto: '6671618370', estatus_entrega: 'Pendiente', comentarios: 'Pendiente confirmar talla de toga' },
  { id: 2,  grupo_id: 1, paquete_id: 3, nombre_alumno: 'Ana Martínez',      nombre_tutor: 'Karla Martínez',     telefono_contacto: '6671234502', estatus_entrega: 'Entregado', comentarios: '' },
  { id: 3,  grupo_id: 1, paquete_id: 1, nombre_alumno: 'Carlos Reyes',      nombre_tutor: 'José Reyes',         telefono_contacto: '6671234503', estatus_entrega: 'Pendiente', comentarios: 'Le gusta la foto natural sin pose' },
  { id: 4,  grupo_id: 1, paquete_id: 2, nombre_alumno: 'Sofía Torres',      nombre_tutor: 'Luz Torres',         telefono_contacto: '6671234504', estatus_entrega: 'Entregado', comentarios: '' },
  { id: 5,  grupo_id: 1, paquete_id: 3, nombre_alumno: 'Diego Ramírez',     nombre_tutor: 'Mario Ramírez',      telefono_contacto: '6671234505', estatus_entrega: 'Pendiente', comentarios: '' },
  { id: 6,  grupo_id: 1, paquete_id: 1, nombre_alumno: 'Valeria Gómez',     nombre_tutor: 'Patricia Gómez',     telefono_contacto: '6671234506', estatus_entrega: 'Pendiente', comentarios: 'Quiere sesión extra al aire libre' },
  { id: 7,  grupo_id: 2, paquete_id: 2, nombre_alumno: 'Marcos Hernández',  nombre_tutor: 'Alicia Hernández',   telefono_contacto: '6671234507', estatus_entrega: 'Pendiente', comentarios: '' },
  { id: 8,  grupo_id: 2, paquete_id: 3, nombre_alumno: 'Fernanda Castro',   nombre_tutor: 'Ignacio Castro',     telefono_contacto: '6671234508', estatus_entrega: 'Entregado', comentarios: '' },
  { id: 9,  grupo_id: 2, paquete_id: 1, nombre_alumno: 'Ricardo Vega',      nombre_tutor: 'Carmen Vega',        telefono_contacto: '6671234509', estatus_entrega: 'Pendiente', comentarios: '' },
  { id: 10, grupo_id: 2, paquete_id: 2, nombre_alumno: 'Patricia Leal',     nombre_tutor: 'Enrique Leal',       telefono_contacto: '6671234510', estatus_entrega: 'Pendiente', comentarios: 'Prefiere fotos en interiores' },
  { id: 11, grupo_id: 3, paquete_id: 2, nombre_alumno: 'Juan Morales',      nombre_tutor: 'Sandra Morales',     telefono_contacto: '6672234511', estatus_entrega: 'Entregado', comentarios: '' },
  { id: 12, grupo_id: 3, paquete_id: 1, nombre_alumno: 'Elena Sánchez',     nombre_tutor: 'David Sánchez',      telefono_contacto: '6672234512', estatus_entrega: 'Pendiente', comentarios: '' },
  { id: 13, grupo_id: 3, paquete_id: 3, nombre_alumno: 'Roberto Díaz',      nombre_tutor: 'Norma Díaz',         telefono_contacto: '6672234513', estatus_entrega: 'Pendiente', comentarios: 'Necesita factura' },
  { id: 14, grupo_id: 4, paquete_id: 2, nombre_alumno: 'Claudia Flores',    nombre_tutor: 'Ramón Flores',       telefono_contacto: '6672234514', estatus_entrega: 'Pendiente', comentarios: '' },
  { id: 15, grupo_id: 4, paquete_id: 1, nombre_alumno: 'Sergio Peña',       nombre_tutor: 'Verónica Peña',      telefono_contacto: '6672234515', estatus_entrega: 'Entregado', comentarios: '' },
  { id: 16, grupo_id: 5, paquete_id: 3, nombre_alumno: 'Andrea López',      nombre_tutor: 'Felipe López',       telefono_contacto: '6693234516', estatus_entrega: 'Pendiente', comentarios: '' },
  { id: 17, grupo_id: 5, paquete_id: 2, nombre_alumno: 'Miguel Ángel Cruz', nombre_tutor: 'Beatriz Cruz',       telefono_contacto: '6693234517', estatus_entrega: 'Entregado', comentarios: '' },
  { id: 18, grupo_id: 5, paquete_id: 1, nombre_alumno: 'Laura Jiménez',     nombre_tutor: 'Arturo Jiménez',     telefono_contacto: '6693234518', estatus_entrega: 'Pendiente', comentarios: 'Avisarle con 1 semana de anticipación' },
]

// ─── Pagos ────────────────────────────────────────────────────────────────────
export const pagos = [
  { id: 1,  alumno_id: 1,  monto: 200, fecha: '2026-01-10', metodo: 'Efectivo' },
  { id: 2,  alumno_id: 2,  monto: 550, fecha: '2026-01-15', metodo: 'Transferencia' },
  { id: 3,  alumno_id: 3,  monto: 175, fecha: '2026-01-12', metodo: 'Efectivo' },
  { id: 4,  alumno_id: 4,  monto: 550, fecha: '2026-02-01', metodo: 'Efectivo' },
  { id: 5,  alumno_id: 5,  monto: 400, fecha: '2026-02-05', metodo: 'Transferencia' },
  { id: 6,  alumno_id: 7,  monto: 300, fecha: '2026-02-10', metodo: 'Efectivo' },
  { id: 7,  alumno_id: 8,  monto: 800, fecha: '2026-02-12', metodo: 'Transferencia' },
  { id: 8,  alumno_id: 9,  monto: 350, fecha: '2026-02-20', metodo: 'Efectivo' },
  { id: 9,  alumno_id: 11, monto: 550, fecha: '2026-03-01', metodo: 'Transferencia' },
  { id: 10, alumno_id: 13, monto: 200, fecha: '2026-03-05', metodo: 'Efectivo' },
  { id: 11, alumno_id: 15, monto: 350, fecha: '2026-03-10', metodo: 'Efectivo' },
  { id: 12, alumno_id: 16, monto: 500, fecha: '2026-03-15', metodo: 'Transferencia' },
  { id: 13, alumno_id: 17, monto: 550, fecha: '2026-03-18', metodo: 'Transferencia' },
  { id: 14, alumno_id: 1,  monto: 150, fecha: '2026-03-20', metodo: 'Efectivo' },
  { id: 15, alumno_id: 5,  monto: 200, fecha: '2026-03-22', metodo: 'Efectivo' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function getPagosAlumno(alumnoId) {
  return pagos.filter(p => p.alumno_id === alumnoId)
}

export function getSaldoAlumno(alumno) {
  const paquete    = getPaquete(alumno.paquete_id)
  const totalPagado = getPagosAlumno(alumno.id).reduce((sum, p) => sum + p.monto, 0)
  const precio      = paquete?.precio ?? 0
  return { precio, totalPagado, saldo: precio - totalPagado }
}

export function getEstatusAlumno(alumno) {
  const { saldo, totalPagado } = getSaldoAlumno(alumno)
  if (saldo <= 0)      return 'liquidado'
  if (totalPagado > 0) return 'abonado'
  return 'deuda'
}

export function getResumenGrupo(grupoId) {
  const miembros = alumnos.filter(a => a.grupo_id === grupoId)
  let totalEsperado = 0, totalCobrado = 0
  miembros.forEach(a => {
    const { precio, totalPagado } = getSaldoAlumno(a)
    totalEsperado += precio
    totalCobrado  += totalPagado
  })
  return { miembros: miembros.length, totalEsperado, totalCobrado, porCobrar: totalEsperado - totalCobrado }
}

export function getResumenProyecto(proyectoId) {
  const misGrupos = grupos.filter(g => g.proyecto_id === proyectoId)
  let totalEsperado = 0, totalCobrado = 0, totalAlumnos = 0
  misGrupos.forEach(g => {
    const r = getResumenGrupo(g.id)
    totalEsperado += r.totalEsperado
    totalCobrado  += r.totalCobrado
    totalAlumnos  += r.miembros
  })
  return { grupos: misGrupos.length, alumnos: totalAlumnos, totalEsperado, totalCobrado, porCobrar: totalEsperado - totalCobrado }
}

export function getResumenInstitucion(institucionId) {
  const misProyectos = proyectos.filter(p => p.institucion_id === institucionId && p.estatus === 'Activo')
  let totalEsperado = 0, totalCobrado = 0
  misProyectos.forEach(p => {
    const r = getResumenProyecto(p.id)
    totalEsperado += r.totalEsperado
    totalCobrado  += r.totalCobrado
  })
  return { totalEsperado, totalCobrado, porCobrar: totalEsperado - totalCobrado }
}

export function getResumenGlobal() {
  let totalEsperado = 0, totalCobrado = 0
  alumnos.forEach(a => {
    const { precio, totalPagado } = getSaldoAlumno(a)
    totalEsperado += precio
    totalCobrado  += totalPagado
  })
  return { totalEsperado, totalCobrado, porCobrar: totalEsperado - totalCobrado }
}

export function buscarAlumnos(query) {
  if (!query || query.trim().length < 2) return []
  const q = query.toLowerCase()
  return alumnos
    .filter(a =>
      a.nombre_alumno.toLowerCase().includes(q) ||
      a.nombre_tutor.toLowerCase().includes(q)
    )
    .map(a => {
      const grupo       = grupos.find(g => g.id === a.grupo_id)
      const proyecto    = proyectos.find(p => p.id === grupo?.proyecto_id)
      const institucion = instituciones.find(i => i.id === proyecto?.institucion_id)
      return { ...a, grupo, proyecto, institucion }
    })
}
