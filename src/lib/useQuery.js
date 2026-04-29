import { useState, useEffect, useRef } from 'react'

/**
 * Hook genérico para queries async.
 * queryFn: función async que devuelve los datos.
 * deps: array de dependencias (como useEffect).
 *
 * Solo muestra loading=true en la primera carga.
 * Los re-fetches (cuando los deps cambian y ya hay data) actualizan en silencio,
 * evitando desmontar componentes hijos que tengan estado local.
 */
export function useQuery(queryFn, deps = []) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const hasDataRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    // Primera carga: mostrar spinner. Re-fetches: actualizar en segundo plano.
    if (!hasDataRef.current) setLoading(true)
    setError(null)
    queryFn()
      .then(result => {
        if (!cancelled) {
          setData(result)
          hasDataRef.current = true
        }
      })
      .catch(err   => { if (!cancelled) setError(err.message ?? String(err)) })
      .finally(()  => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error }
}
