import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useChenStore } from '../store/chenStore'

/**
 * Vide les messages du Prof. Chen à chaque changement de route.
 * À appeler une seule fois dans le composant racine App.
 */
export function useNavigationBehavior(): void {
  const location = useLocation()
  const prevPathRef = useRef(location.pathname)
  const clearChenMessages = useChenStore((s) => s.clearMessages)

  useEffect(() => {
    const prev = prevPathRef.current
    const curr = location.pathname
    if (prev !== curr) clearChenMessages()
    prevPathRef.current = curr
  }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps
}
