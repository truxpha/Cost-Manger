import { Check, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface Props {
  formId: string
  submitLabel: string
  onDelete?: () => void
}

/** Speichern-Button (sendet das Formular per id) und Löschen mit Bestätigung */
export function FormFooter({ formId, submitLabel, onDelete }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="flex gap-2">
      {onDelete && (
        <button
          type="button"
          onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
          className={`flex h-12 items-center justify-center gap-2 rounded-2xl px-4 font-medium transition ${
            confirmDelete ? 'bg-rose-500 text-white' : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
          }`}
          aria-label="Löschen"
        >
          <Trash2 className="size-5" />
          {confirmDelete && <span>Wirklich löschen?</span>}
        </button>
      )}
      <button
        type="submit"
        form={formId}
        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-white font-semibold text-zinc-950 transition hover:bg-zinc-200 active:scale-[0.98]"
      >
        <Check className="size-5" />
        {submitLabel}
      </button>
    </div>
  )
}
