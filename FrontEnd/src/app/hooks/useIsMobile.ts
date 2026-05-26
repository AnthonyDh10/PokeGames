import { useState, useEffect } from 'react'

/**
 * Retourne true quand la largeur de la fenêtre est inférieure à `breakpoint` (px).
 * Se met à jour automatiquement au redimensionnement.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(
    () => (typeof window !== 'undefined' ? window.innerWidth < breakpoint : false),
  )

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [breakpoint])

  return isMobile
}
