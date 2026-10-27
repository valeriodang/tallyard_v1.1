// Fields that save when they lose focus, for the audit screens. Each keeps what is typed until the stored value
// changes under it (an undo, another tab), then starts again from the stored value.
import { useEffect, useState, type ReactNode } from 'react'
import { Field, Input, Textarea, cx } from '../../ui'

type SavedProps = {
  label: ReactNode
  value: string
  /** Returns whether the save went through. */
  onSave: (text: string) => boolean
  testId: string
  hint?: ReactNode
  placeholder?: string
  disabled?: boolean
  className?: string
}

function useSaved(value: string, onSave: (text: string) => boolean) {
  const [text, setText] = useState(value)
  const [stored, setStored] = useState(value)
  const [saved, setSaved] = useState(false)
  if (stored !== value) {
    setStored(value)
    setText(value)
  }
  useEffect(() => {
    if (!saved) return
    const t = window.setTimeout(() => setSaved(false), 1600)
    return () => window.clearTimeout(t)
  }, [saved])
  const commit = () => {
    if (text.trim() === value.trim()) return
    if (onSave(text)) setSaved(true)
    else setText(value)
  }
  return { text, setText, saved, commit }
}

function SavedMark({ saved }: { saved: boolean }) {
  return (
    <span aria-live="polite" className={cx('text-xs font-medium text-brand-700 transition-opacity', saved ? 'opacity-100' : 'opacity-0')}>
      Saved
    </span>
  )
}

export function SavedTextarea({ label, value, onSave, testId, hint, placeholder, disabled = false, className, rows = 3 }: SavedProps & { rows?: number }) {
  const f = useSaved(value, onSave)
  return (
    <Field label={label} hint={hint} id={testId} labelAction={<SavedMark saved={f.saved} />} className={className}>
      <Textarea id={testId} data-testid={testId} rows={rows} value={f.text} placeholder={placeholder} disabled={disabled} onChange={(e) => f.setText(e.target.value)} onBlur={f.commit} />
    </Field>
  )
}

export function SavedInput({ label, value, onSave, testId, hint, placeholder, disabled = false, className, type = 'text', inputMode, trailing }: SavedProps & { type?: 'text' | 'date'; inputMode?: 'decimal' | 'text'; trailing?: ReactNode }) {
  const f = useSaved(value, onSave)
  return (
    <Field label={label} hint={hint} id={testId} labelAction={<SavedMark saved={f.saved} />} className={className}>
      <Input
        id={testId}
        data-testid={testId}
        type={type}
        inputMode={inputMode}
        value={f.text}
        placeholder={placeholder}
        disabled={disabled}
        trailing={trailing}
        onChange={(e) => f.setText(e.target.value)}
        onBlur={f.commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            f.commit()
          }
        }}
      />
    </Field>
  )
}

/** A read-only value with its label, for a complete audit or a reader who cannot write. */
export function ReadValue({ label, value, testId }: { label: ReactNode; value: ReactNode; testId?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-sm text-muted">{label}</span>
      <span className="whitespace-pre-wrap text-base text-ink" data-testid={testId}>
        {value || 'Not given'}
      </span>
    </div>
  )
}
