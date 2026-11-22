interface Props {
  checked: boolean
  onChange: () => void
  label: string
  color?: string
}

export function Toggle({ checked, onChange, label, color = '#34d399' }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => {
        // kurzes haptisches Feedback (Android)
        navigator.vibrate?.(8)
        onChange()
      }}
      className="flex h-11 w-13 shrink-0 items-center justify-center"
    >
      <span
        className="relative h-7 w-12 rounded-full transition-colors duration-200"
        style={{ backgroundColor: checked ? color : 'rgba(255,255,255,0.12)' }}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  )
}
