import { useEffect, useState } from 'react'

/** Aktuelles Datum; aktualisiert sich, wenn die App wieder in den Vordergrund kommt. */
export function useToday(): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') setNow(new Date())
    }
    document.addEventListener('visibilitychange', refresh)
    const interval = window.setInterval(() => setNow(new Date()), 60 * 60 * 1000)
    return () => {
      document.removeEventListener('visibilitychange', refresh)
      window.clearInterval(interval)
    }
  }, [])

  // Kurz nach Mitternacht aktualisieren, damit „heute“/„noch offen“ nicht bis zu einer Stunde veraltet ist
  useEffect(() => {
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const timer = window.setTimeout(() => setNow(new Date()), next.getTime() - Date.now() + 1000)
    return () => window.clearTimeout(timer)
  }, [now])

  return now
}
