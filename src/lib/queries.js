/**
 * queries.js — Capa de acceso a datos (Supabase)
 *
 * Cada función es async y devuelve datos limpios o lanza un error.
 * Los componentes solo necesitan hacer: const data = await queries.getXxx()
 */
import { supabase } from './supabase.js'

// ─── Utilidad interna ─────────────────────────────────────────────────────────
function check({ data, error }, label) {
  if (error) {
    console.error(`[queries] ${label ?? ''}`, error)
    throw error
  }
  return data
}

// =============================================================================
// PAQUETES
// =============================================================================
export async function getPaquetes() {
  return check(await supabase.from('paquetes').select('*').order('precio'), 'getPaquetes')
}

export async function updatePaquete(id, changes) {
  return check(
    await supabase.from('paquetes').update(changes).eq('id', id).select().single()
  )
}

// =============================================================================
// INSTITUCIONES
// =============================================================================
export async function getInstituciones() {
  return check(await supabase.from('instituciones').select('*').order('nombre'), 'getInstituciones')
}

/**
 * Trae instituciones + resumen financiero activo en 2 queries paralelas
 * en lugar de 1 + N queries (N = número de instituciones).
 */
export async function getInstitucionesConResumen() {
  const [instituciones, grupos, filas] = await Promise.all([
    supabase.from('instituciones').select('*').order('nombre'),
    supabase.from('grupos').select('id, proyecto:proyectos(institucion_id)'),
    supabase.from('vista_saldo_alumnos').select('grupo_id, precio_paquete, total_pagado, saldo_pendiente'),
  ])
  check(instituciones, 'getInstitucionesConResumen:instituciones')
  check(grupos,        'getInstitucionesConResumen:grupos')
  check(filas,         'getInstitucionesConResumen:filas')

  // Mapa grupo_id → institucion_id
  const grupoInstMap = {}
  for (const g of grupos.data) {
    grupoInstMap[g.id] = g.proyecto?.institucion_id
  }

  // Agrupar resúmenes por institucion_id
  const resumenMap = {}
  for (const r of filas.data) {
    const instId = grupoInstMap[r.grupo_id]
    if (!instId) continue
    if (!resumenMap[instId]) resumenMap[instId] = { totalEsperado: 0, totalCobrado: 0, porCobrar: 0 }
    resumenMap[instId].totalEsperado += Number(r.precio_paquete)  || 0
    resumenMap[instId].totalCobrado  += Number(r.total_pagado)    || 0
    resumenMap[instId].porCobrar     += Number(r.saldo_pendiente) || 0
  }

  return instituciones.data.map(inst => ({
    ...inst,
    resumen: resumenMap[inst.id] ?? { totalEsperado: 0, totalCobrado: 0, porCobrar: 0 },
  }))
}

export async function getInstitucion(id) {
  return check(
    await supabase.from('instituciones').select('*').eq('id', id).single()
  )
}

// =============================================================================
// PROYECTOS
// =============================================================================
export async function getProyectosByInstitucion(institucionId) {
  return check(
    await supabase
      .from('proyectos')
      .select('*')
      .eq('institucion_id', institucionId)
      .order('año_ciclo', { ascending: false })
  )
}

export async function getProyecto(id) {
  return check(
    await supabase.from('proyectos').select('*').eq('id', id).single()
  )
}

// =============================================================================
// GRUPOS
// =============================================================================
export async function getGruposByProyecto(proyectoId) {
  return check(
    await supabase
      .from('grupos')
      .select('*')
      .eq('proyecto_id', proyectoId)
      .order('nombre_grupo')
  )
}

export async function getGrupo(id) {
  return check(
    await supabase.from('grupos').select('*').eq('id', id).single()
  )
}

// =============================================================================
// ALUMNOS
// =============================================================================
export async function getAlumnosByGrupo(grupoId) {
  // Trae alumno + saldo calculado desde la vista
  return check(
    await supabase
      .from('vista_saldo_alumnos')
      .select('*')
      .eq('grupo_id', grupoId)
      .order('nombre_alumno')
  )
}

export async function getAlumno(id) {
  return check(
    await supabase
      .from('vista_saldo_alumnos')
      .select('*')
      .eq('id', id)
      .single()
  )
}

export async function buscarAlumnos(query, signal) {
  if (!query || query.trim().length < 2) return []
  const q = `%${query.trim()}%`
  const { data, error } = await supabase
    .from('alumnos')
    .select(`
      id, nombre_alumno, nombre_tutor,
      grupo:grupos(
        id, nombre_grupo,
        proyecto:proyectos(
          id, año_ciclo,
          institucion:instituciones(id, nombre)
        )
      )
    `)
    .or(`nombre_alumno.ilike.${q},nombre_tutor.ilike.${q}`)
    .limit(8)
    .abortSignal(signal)
  if (error) return []
  return data.map(a => ({
    ...a,
    grupo:       a.grupo,
    proyecto:    a.grupo?.proyecto,
    institucion: a.grupo?.proyecto?.institucion,
  }))
}

// =============================================================================
// PAGOS
// =============================================================================
export async function getPagosByAlumno(alumnoId) {
  return check(
    await supabase
      .from('pagos')
      .select('*')
      .eq('alumno_id', alumnoId)
      .order('fecha', { ascending: false })
  )
}

// =============================================================================
// RESÚMENES (calculados en DB usando la vista)
// =============================================================================

export async function getResumenGrupo(grupoId) {
  const rows = check(
    await supabase
      .from('vista_saldo_alumnos')
      .select('precio_paquete, total_pagado, saldo_pendiente')
      .eq('grupo_id', grupoId)
  )
  return rows.reduce(
    (acc, r) => ({
      miembros:      acc.miembros + 1,
      totalEsperado: acc.totalEsperado + Number(r.precio_paquete),
      totalCobrado:  acc.totalCobrado  + Number(r.total_pagado),
      porCobrar:     acc.porCobrar     + Number(r.saldo_pendiente),
    }),
    { miembros: 0, totalEsperado: 0, totalCobrado: 0, porCobrar: 0 }
  )
}

export async function getResumenProyecto(proyectoId) {
  const grupos = check(
    await supabase.from('grupos').select('id').eq('proyecto_id', proyectoId)
  )
  const grupoIds = grupos.map(g => g.id)
  if (grupoIds.length === 0) return { grupos: 0, alumnos: 0, totalEsperado: 0, totalCobrado: 0, porCobrar: 0 }

  const rows = check(
    await supabase
      .from('vista_saldo_alumnos')
      .select('grupo_id, precio_paquete, total_pagado, saldo_pendiente')
      .in('grupo_id', grupoIds)
  )
  const gruposUnicos = new Set(rows.map(r => r.grupo_id)).size
  return rows.reduce(
    (acc, r) => ({
      grupos:        gruposUnicos,
      alumnos:       acc.alumnos + 1,
      totalEsperado: acc.totalEsperado + Number(r.precio_paquete),
      totalCobrado:  acc.totalCobrado  + Number(r.total_pagado),
      porCobrar:     acc.porCobrar     + Number(r.saldo_pendiente),
    }),
    { grupos: 0, alumnos: 0, totalEsperado: 0, totalCobrado: 0, porCobrar: 0 }
  )
}

export async function getResumenInstitucion(institucionId) {
  const proyectos = check(
    await supabase
      .from('proyectos')
      .select('id')
      .eq('institucion_id', institucionId)
      .eq('estatus', 'Activo')
  )
  if (proyectos.length === 0) return { totalEsperado: 0, totalCobrado: 0, porCobrar: 0 }

  const proyIds = proyectos.map(p => p.id)
  const grupos  = check(
    await supabase.from('grupos').select('id').in('proyecto_id', proyIds)
  )
  const grupoIds = grupos.map(g => g.id)
  if (grupoIds.length === 0) return { totalEsperado: 0, totalCobrado: 0, porCobrar: 0 }

  const rows = check(
    await supabase
      .from('vista_saldo_alumnos')
      .select('precio_paquete, total_pagado, saldo_pendiente')
      .in('grupo_id', grupoIds)
  )
  return rows.reduce(
    (acc, r) => ({
      totalEsperado: acc.totalEsperado + Number(r.precio_paquete),
      totalCobrado:  acc.totalCobrado  + Number(r.total_pagado),
      porCobrar:     acc.porCobrar     + Number(r.saldo_pendiente),
    }),
    { totalEsperado: 0, totalCobrado: 0, porCobrar: 0 }
  )
}

export async function getResumenGlobal() {
  const rows = check(
    await supabase
      .from('vista_saldo_alumnos')
      .select('precio_paquete, total_pagado, saldo_pendiente')
  )
  const proyectos = check(
    await supabase.from('proyectos').select('id').eq('estatus', 'Activo')
  )
  return {
    activos: proyectos.length,
    ...rows.reduce(
      (acc, r) => ({
        totalEsperado: acc.totalEsperado + Number(r.precio_paquete),
        totalCobrado:  acc.totalCobrado  + Number(r.total_pagado),
        porCobrar:     acc.porCobrar     + Number(r.saldo_pendiente),
      }),
      { totalEsperado: 0, totalCobrado: 0, porCobrar: 0 }
    ),
  }
}

// =============================================================================
// DEUDAS PENDIENTES
// =============================================================================

/**
 * Devuelve todos los alumnos con saldo_pendiente > 0 junto con la ruta completa
 * (institucion → proyecto → grupo) para poder navegar directamente al alumno.
 */
export async function getAlumnosConDeuda() {
  const [filas, grupos, proyectos, instituciones] = await Promise.all([
    supabase
      .from('vista_saldo_alumnos')
      .select('id, nombre_alumno, nombre_tutor, paquete_titulo, precio_paquete, total_pagado, saldo_pendiente, estatus_pago, grupo_id, telefono_contacto')
      .gt('saldo_pendiente', 0)
      .order('saldo_pendiente', { ascending: false }),
    supabase.from('grupos').select('id, nombre_grupo, proyecto_id'),
    supabase.from('proyectos').select('id, año_ciclo, estatus, institucion_id'),
    supabase.from('instituciones').select('id, nombre'),
  ])
  check(filas,          'getAlumnosConDeuda:filas')
  check(grupos,         'getAlumnosConDeuda:grupos')
  check(proyectos,      'getAlumnosConDeuda:proyectos')
  check(instituciones,  'getAlumnosConDeuda:instituciones')

  const grupoMap  = Object.fromEntries(grupos.data.map(g  => [g.id,  g]))
  const proyMap   = Object.fromEntries(proyectos.data.map(p => [p.id, p]))
  const instMap   = Object.fromEntries(instituciones.data.map(i => [i.id, i]))

  return filas.data.map(a => {
    const grupo = grupoMap[a.grupo_id]     ?? {}
    const proy  = proyMap[grupo.proyecto_id] ?? {}
    const inst  = instMap[proy.institucion_id] ?? {}
    return {
      ...a,
      nombre_grupo:   grupo.nombre_grupo ?? '—',
      año_ciclo:      proy.año_ciclo     ?? '—',
      estatus_proy:   proy.estatus       ?? '—',
      nombre_inst:    inst.nombre        ?? '—',
      inst_id:        inst.id,
      proy_id:        proy.id,
      grupo_id_real:  grupo.id,
    }
  })
}

// =============================================================================
// MUTACIONES — CREATE / UPDATE / DELETE
// =============================================================================

// ── Paquetes ──────────────────────────────────────────────────────────────────
export async function insertPaquete(data) {
  return check(await supabase.from('paquetes').insert(data).select().single(), 'insertPaquete')
}
export async function deletePaquete(id) {
  const res = await supabase.from('paquetes').delete().eq('id', id)
  if (res.error) throw res.error
}

// ── Instituciones ─────────────────────────────────────────────────────────────
export async function insertInstitucion(data) {
  return check(await supabase.from('instituciones').insert(data).select().single(), 'insertInstitucion')
}
export async function updateInstitucion(id, data) {
  return check(await supabase.from('instituciones').update(data).eq('id', id).select().single(), 'updateInstitucion')
}
export async function deleteInstitucion(id) {
  const res = await supabase.from('instituciones').delete().eq('id', id)
  if (res.error) throw res.error
}

// ── Proyectos ─────────────────────────────────────────────────────────────────
export async function insertProyecto(data) {
  return check(await supabase.from('proyectos').insert(data).select().single(), 'insertProyecto')
}
export async function updateProyecto(id, data) {
  return check(await supabase.from('proyectos').update(data).eq('id', id).select().single(), 'updateProyecto')
}
export async function deleteProyecto(id) {
  const res = await supabase.from('proyectos').delete().eq('id', id)
  if (res.error) throw res.error
}

// ── Grupos ────────────────────────────────────────────────────────────────────
export async function insertGrupo(data) {
  return check(await supabase.from('grupos').insert(data).select().single(), 'insertGrupo')
}
export async function updateGrupo(id, data) {
  return check(await supabase.from('grupos').update(data).eq('id', id).select().single(), 'updateGrupo')
}
export async function deleteGrupo(id) {
  const res = await supabase.from('grupos').delete().eq('id', id)
  if (res.error) throw res.error
}

// ── Alumnos ───────────────────────────────────────────────────────────────────
export async function insertAlumno(data) {
  return check(await supabase.from('alumnos').insert(data).select().single(), 'insertAlumno')
}
export async function updateAlumno(id, data) {
  return check(await supabase.from('alumnos').update(data).eq('id', id).select().single(), 'updateAlumno')
}
export async function deleteAlumno(id) {
  const res = await supabase.from('alumnos').delete().eq('id', id)
  if (res.error) throw res.error
}

// ── Pagos ─────────────────────────────────────────────────────────────────────
export async function insertPago(data) {
  return check(await supabase.from('pagos').insert(data).select().single(), 'insertPago')
}
export async function deletePago(id) {
  const res = await supabase.from('pagos').delete().eq('id', id)
  if (res.error) throw res.error
}

