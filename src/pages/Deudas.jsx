import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ChevronUp, ChevronDown } from 'lucide-react'
import { useQuery } from '../lib/useQuery.js'
import * as q from '../lib/queries.js'
import { fmt } from '../lib/formatters.js'
import { useBreadcrumbs } from '../lib/useBreadcrumbs.js'
import Breadcrumbs from '../components/Breadcrumbs.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import WhatsAppBtn from '../components/WhatsAppBtn.jsx'
import LoadingSpinner, { ErrorMsg } from '../components/LoadingSpinner.jsx'

const NUMERIC_COLS = ['precio_paquete', 'total_pagado', 'saldo_pendiente']

export default function Deudas() {
  const navigate = useNavigate()
  const crumbs   = useBreadcrumbs()
  const deudaQ   = useQuery(() => q.getAlumnosConDeuda(), [])

  const [busqueda,  setBusqueda]  = useState('')
  const [filtroInst, setFiltroInst] = useState('todos')
  const [sortCol,   setSortCol]   = useState('saldo_pendiente')
  const [sortDir,   setSortDir]   = useState('desc')

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  if (deudaQ.loading) return <><Breadcrumbs crumbs={crumbs} /><LoadingSpinner text="Cargando deudas…" /></>
  if (deudaQ.error)   return <ErrorMsg message={deudaQ.error} />

  const todos = deudaQ.data ?? []

  // Instituciones únicas para el filtro rápido
  const instituciones = [...new Map(todos.map(a => [a.inst_id, a.nombre_inst])).entries()]
    .sort((a, b) => a[1].localeCompare(b[1], 'es'))

  const totalDeuda = todos.reduce((s, a) => s + Number(a.saldo_pendiente), 0)

  const filtrados = todos
    .filter(a => filtroInst === 'todos' || a.inst_id === filtroInst)
    .filter(a => {
      if (!busqueda.trim()) return true
      const q = busqueda.toLowerCase()
      return (
        a.nombre_alumno?.toLowerCase().includes(q) ||
        a.nombre_tutor?.toLowerCase().includes(q)  ||
        a.nombre_inst?.toLowerCase().includes(q)   ||
        a.nombre_grupo?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol]
      if (typeof va === 'string') va = va.toLowerCase()
      if (typeof vb === 'string') vb = vb.toLowerCase()
      if (va == null) va = ''
      if (vb == null) vb = ''
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ?  1 : -1
      return 0
    })

  const SortTh = ({ col, children }) => (
    <th className="th-sortable" onClick={() => toggleSort(col)}>
      {children}
      <span className="sort-icon">
        {sortCol === col
          ? sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
          : <ChevronUp size={13} className="sort-icon-idle" />}
      </span>
    </th>
  )

  return (
    <>
      <Breadcrumbs crumbs={crumbs} />
      <div className="page">
        <div className="page-title-row">
          <h1 className="page-title" style={{ margin: 0 }}>
            <AlertCircle size={22} /> Deudas pendientes
          </h1>
          <div style={{ fontSize: '.88rem', color: 'var(--text-muted)' }}>
            {filtrados.length} alumno{filtrados.length !== 1 ? 's' : ''} ·&nbsp;
            <strong style={{ color: 'var(--abonado)' }}>{fmt(totalDeuda)}</strong> total
          </div>
        </div>

        {/* ── Filtros ─────────────────────────────────────────────── */}
        <div className="filter-bar" style={{ marginBottom: '1rem' }}>
          <input
            className="deuda-search"
            placeholder="Buscar alumno, tutor o grupo…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <div className="filter-bar-group" style={{ flexWrap: 'wrap' }}>
            <span className="filter-bar-label">Institución:</span>
            <button
              className={`filter-pill${filtroInst === 'todos' ? ' active' : ''}`}
              onClick={() => setFiltroInst('todos')}
            >Todas</button>
            {instituciones.map(([id, nombre]) => (
              <button
                key={id}
                className={`filter-pill${filtroInst === id ? ' active' : ''}`}
                onClick={() => setFiltroInst(id)}
              >{nombre}</button>
            ))}
          </div>
        </div>

        {/* ── Tabla ───────────────────────────────────────────────── */}
        {filtrados.length === 0 ? (
          <div className="empty">
            <AlertCircle size={40} />
            <p>{todos.length === 0 ? '¡Sin deudas pendientes!' : 'Ningún alumno coincide con los filtros.'}</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <SortTh col="nombre_alumno">Alumno</SortTh>
                    <SortTh col="nombre_tutor">Tutor</SortTh>
                    <SortTh col="nombre_inst">Institución</SortTh>
                    <SortTh col="año_ciclo">Gen</SortTh>
                    <SortTh col="nombre_grupo">Grupo</SortTh>
                    <SortTh col="precio_paquete">Precio</SortTh>
                    <SortTh col="total_pagado">Pagado</SortTh>
                    <SortTh col="saldo_pendiente">Saldo</SortTh>
                    <th>Estatus</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(a => (
                    <tr
                      key={a.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() =>
                        navigate(
                          `/instituciones/${a.inst_id}/proyectos/${a.proy_id}/grupos/${a.grupo_id_real}/alumnos/${a.id}`
                        )
                      }
                    >
                      <td className="td-name" style={{ color: 'var(--accent-light)' }}>{a.nombre_alumno}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '.82rem' }}>{a.nombre_tutor}</td>
                      <td style={{ fontSize: '.82rem' }}>{a.nombre_inst}</td>
                      <td style={{ fontSize: '.82rem', color: 'var(--text-muted)' }}>{a.año_ciclo}</td>
                      <td style={{ fontSize: '.82rem' }}>{a.nombre_grupo}</td>
                      <td>{fmt(a.precio_paquete)}</td>
                      <td style={{ color: 'var(--liquidado)' }}>{fmt(a.total_pagado)}</td>
                      <td style={{ color: 'var(--abonado)', fontWeight: 700 }}>{fmt(a.saldo_pendiente)}</td>
                      <td><StatusBadge status={a.estatus_pago} /></td>
                      <td onClick={e => e.stopPropagation()}>
                        <WhatsAppBtn
                          phone={a.telefono_contacto}
                          nombre={a.nombre_alumno}
                          saldo={a.saldo_pendiente}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
