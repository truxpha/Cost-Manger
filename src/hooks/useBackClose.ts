import { useEffect, useRef } from 'react'

/*
 * Android-Zurück-Taste schließt offene Sheets, statt die App zu verlassen.
 * Beim Öffnen wird ein Verlaufseintrag angelegt; Schließen per Button entfernt ihn wieder.
 */
let ignorePops = 0
let activeHandler: (() => void) | null = null

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    if (ignorePops > 0) {
      ignorePops--
      return
    }
    activeHandler?.()
  })
}

export function useBackClose(onClose: () => void) {
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    let closedByBack = false
    const handler = () => {
      closedByBack = true
      closeRef.current()
    }
    window.history.pushState({ fixkostenSheet: true }, '')
    activeHandler = handler
    return () => {
      if (activeHandler === handler) activeHandler = null
      if (!closedByBack) {
        ignorePops++
        window.history.back()
      }
    }
  }, [])
}
