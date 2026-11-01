import { X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

/** 标签输入：回车添加，空输入时退格删除最后一个。标签不重复 */
export function TagInput({
  value,
  onChange,
  placeholder = '输入后回车添加',
  className,
  'aria-label': ariaLabel,
}: {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
  'aria-label'?: string
}) {
  const [draft, setDraft] = useState('')
  // 旧版本允许重复添加，已保存的数据里可能有重复项
  const tags = [...new Set(value)]

  const commit = () => {
    const v = draft.trim()
    if (!v) return
    if (!tags.includes(v)) onChange([...tags, v])
    setDraft('')
  }

  return (
    <div
      className={cn(
        'flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-card px-1.5 py-1 transition-[border-color,box-shadow] focus-within:ring-1 focus-within:ring-ring',
        className,
      )}
    >
      {tags.map(tag => (
        <span
          key={tag}
          className="inline-flex h-6 max-w-full items-center gap-0.5 rounded-sm bg-muted pr-0.5 pl-2 text-[13px]"
        >
          <span className="truncate">{tag}</span>
          <button
            type="button"
            className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            onClick={() => onChange(tags.filter(t => t !== tag))}
            aria-label={`移除 ${tag}`}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
            e.preventDefault()
            commit()
          } else if (e.key === 'Backspace' && !draft && tags.length) {
            onChange(tags.slice(0, -1))
          }
        }}
        onBlur={commit}
        placeholder={tags.length ? '' : placeholder}
        aria-label={ariaLabel ?? placeholder}
        className="h-6 min-w-24 flex-1 bg-transparent px-1 text-[13px] outline-none placeholder:text-muted-foreground"
      />
    </div>
  )
}
