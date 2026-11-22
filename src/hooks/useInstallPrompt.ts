import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Das Ereignis kann vor dem ersten Rendern kommen → schon beim Laden des Moduls abfangen.
let deferred: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    notify()
  })
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
}

/** Android/Chrome: eigener „App installieren“-Button statt Suche im Browsermenü */
export function useInstallPrompt() {
  const [, rerender] = useState(0)
  const [standalone, setStandalone] = useState(isStandalone)

  useEffect(() => {
    const update = () => {
      setStandalone(isStandalone())
      rerender((n) => n + 1)
    }
    listeners.add(update)
    return () => {
      listeners.delete(update)
    }
  }, [])

  const install = async (): Promise<boolean> => {
    if (!deferred) return false
    const event = deferred
    try {
      await event.prompt()
      const { outcome } = await event.userChoice
      return outcome === 'accepted'
    } catch {
      // Ereignis bereits verbraucht oder vom Browser abgelehnt
      return false
    } finally {
      deferred = null
      notify()
    }
  }

  return { canInstall: deferred !== null && !standalone, standalone, install }
}
