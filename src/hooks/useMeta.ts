import { useCallback, useEffect, useState } from 'react'
import { loadMeta, saveMeta, type Meta } from '../lib/storage'

export function useMeta() {
  const [meta, setMeta] = useState<Meta>(loadMeta)

  useEffect(() => {
    saveMeta(meta)
  }, [meta])

  const updateMeta = useCallback((patch: Partial<Meta>) => setMeta((m) => ({ ...m, ...patch })), [])

  return { meta, updateMeta }
}
