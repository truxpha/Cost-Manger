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

  return now
}
