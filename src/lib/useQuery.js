import { useState, useEffect } from 'react'

/**
 * Hook genérico para queries async.
 * queryFn: función async que devuelve los datos.
 * deps: array de dependencias (como useEffect).
 */
export function useQuery(queryFn, deps = []) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    queryFn()
      .then(result => { if (!cancelled) setData(result) })
      .catch(err   => { if (!cancelled) setError(err.message ?? String(err)) })
      .finally(()  => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error }
}
