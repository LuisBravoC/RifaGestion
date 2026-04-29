import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Ticket, Search, X, Settings, LogOut, Menu, Users, CreditCard } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { buscarParticipantes } from '../lib/rifas-queries.js'
import { useAuth } from '../lib/AuthContext.jsx'
import { signOut } from '../lib/auth.js'

export default function Topbar() {
  const { session } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [open,    setOpen]    = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const wrapRef   = useRef(null)
  const menuRef   = useRef(null)
  const timerRef   = useRef(null)

  const doSearch = useCallback(async (v) => {
    if (!v || v.trim().length < 2) { setResults([]); setOpen(false); return }
    try {
      const r = await buscarParticipantes(v)
      setResults(r)
      setOpen(r.length > 0)
    } catch (e) {
      console.error(e)
    }
  }, [])

  function handleChange(e) {
    const v = e.target.value
    setQuery(v)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(v), 300)
  }

  function handleClear() {
    setQuery('')
    setResults([])
    setOpen(false)
    clearTimeout(timerRef.current)
  }

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <header className="topbar">
      <Link to="/" className="topbar-brand">
        <Ticket size={22} />
        <span className="nav-label">RifaGestión</span>
      </Link>

      <div className="topbar-search" ref={wrapRef}>
        <Search size={15} className="search-icon" />
        <input
          type="text"
          placeholder="Buscar participante…"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          autoComplete="off"
        />
        {query && (
          <button
            onClick={handleClear}
            style={{ position: 'absolute', right: '.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
          >
            <X size={14} />
          </button>
        )}
        {open && (
          <div className="search-dropdown">
            {results.map(r => (
              <Link
                key={r.id}
                to={`/participantes/${r.id}`}
                className="search-item"
                onClick={handleClear}
              >
                <span className="search-item-name">{r.nombre_completo}</span>
                {r.telefono_whatsapp && (
                  <span className="search-item-meta">{r.telefono_whatsapp}</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="topbar-nav-area" ref={menuRef}>
        <nav className="topbar-nav">
          <NavLink to="/rifas" className={({ isActive }) => 'topbar-nav-link' + (isActive ? ' active' : '')}>
            <Ticket size={15} /> <span className="nav-label">Rifas</span>
          </NavLink>
          <NavLink to="/participantes" className={({ isActive }) => 'topbar-nav-link' + (isActive ? ' active' : '')}>
            <Users size={15} /> <span className="nav-label">Participantes</span>
          </NavLink>
          <NavLink to="/historial" className={({ isActive }) => 'topbar-nav-link' + (isActive ? ' active' : '')}>
            <CreditCard size={15} /> <span className="nav-label">Historial</span>
          </NavLink>
          <NavLink to="/opciones" className={({ isActive }) => 'topbar-nav-link' + (isActive ? ' active' : '')}>
            <Settings size={15} /> <span className="nav-label">Opciones</span>
          </NavLink>
          {session && (
            <button className="topbar-nav-link btn-logout" onClick={handleLogout} title="Cerrar sesión">
              <LogOut size={15} /> <span className="nav-label">Salir</span>
            </button>
          )}
        </nav>

        <button
          className="topbar-hamburger"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
        >
          <Menu size={22} />
        </button>

        {menuOpen && (
          <div className="mobile-nav">
            <NavLink to="/rifas" className={({ isActive }) => 'mobile-nav-link' + (isActive ? ' active' : '')} onClick={() => setMenuOpen(false)}>
              <Ticket size={16} /> Rifas
            </NavLink>
            <NavLink to="/participantes" className={({ isActive }) => 'mobile-nav-link' + (isActive ? ' active' : '')} onClick={() => setMenuOpen(false)}>
              <Users size={16} /> Participantes
            </NavLink>
            <NavLink to="/historial" className={({ isActive }) => 'mobile-nav-link' + (isActive ? ' active' : '')} onClick={() => setMenuOpen(false)}>
              <CreditCard size={16} /> Historial
            </NavLink>
            <NavLink to="/opciones" className={({ isActive }) => 'mobile-nav-link' + (isActive ? ' active' : '')} onClick={() => setMenuOpen(false)}>
              <Settings size={16} /> Opciones
            </NavLink>
            {session && (
              <button className="mobile-nav-link mobile-nav-logout" onClick={() => { setMenuOpen(false); handleLogout() }}>
                <LogOut size={16} /> Salir
              </button>
            )}
          </div>
        )}
      </div>

    </header>
  )
}
