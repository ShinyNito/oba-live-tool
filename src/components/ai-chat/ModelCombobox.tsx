import { CheckIcon, ChevronsUpDownIcon, SearchIcon } from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface ModelComboboxProps {
  models: string[]
  model: string
  onChange: (model: string) => void
  placeholder?: string
}

/** 可搜索的模型选择框，列表外的 ID 也可以直接输入后回车使用 */
export const ModelCombobox = memo(
  ({ models, model, onChange, placeholder = '选择模型' }: ModelComboboxProps) => {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')

    const keyword = query.trim()
    const filtered = useMemo(() => {
      const q = keyword.toLowerCase()
      return q ? models.filter(m => m.toLowerCase().includes(q)) : models
    }, [models, keyword])
    const showCustom = keyword !== '' && !models.includes(keyword)

    const select = (value: string) => {
      onChange(value)
      setOpen(false)
      setQuery('')
    }

    return (
      // modal: 在 Dialog 中使用时，内容区域才能正常滚动
      <Popover
        modal
        open={open}
        onOpenChange={next => {
          setOpen(next)
          if (!next) setQuery('')
        }}
      >
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between font-mono font-normal">
            <span className={cn('truncate', !model && 'text-muted-foreground font-sans')}>
              {model || placeholder}
            </span>
            <ChevronsUpDownIcon className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
          <div className="flex items-center gap-2 border-b px-3">
            <SearchIcon className="h-4 w-4 shrink-0 opacity-50" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                // 优先选中第一个匹配项，没有匹配时才使用输入的 ID
                const first = filtered[0]
                if (first) select(first)
                else if (showCustom) select(keyword)
              }}
              placeholder="搜索或输入模型 ID"
              className="h-9 w-full bg-transparent text-sm outline-hidden placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {filtered.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => select(m)}
                className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left font-mono text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <span className="truncate">{m}</span>
                {m === model && <CheckIcon className="h-4 w-4 shrink-0" />}
              </button>
            ))}
            {showCustom && (
              <button
                type="button"
                onClick={() => select(keyword)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <span className="text-muted-foreground">使用</span>
                <span className="truncate font-mono">{keyword}</span>
              </button>
            )}
            {!showCustom && filtered.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {models.length === 0 ? '暂无模型，可直接输入模型 ID' : '没有匹配的模型'}
              </p>
            )}
          </div>
          {models.length > 0 && (
            <p className="border-t px-3 py-1.5 text-xs text-muted-foreground">
              {keyword ? `${filtered.length} / ${models.length}` : `共 ${models.length}`} 个模型 ·
              数据来自 models.dev
            </p>
          )}
        </PopoverContent>
      </Popover>
    )
  },
)
