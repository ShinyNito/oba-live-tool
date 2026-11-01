import { Input } from '@/components/ui/input'

/** 随机间隔区间（秒）。`value` 为毫秒，`onChange` 传回输入框原始字符串（秒） */
export function IntervalInput({
  value,
  onChange,
}: {
  value: [number, number]
  onChange: (index: 0 | 1, seconds: string) => void
}) {
  return (
    <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
      <Input
        type="number"
        value={value[0] / 1000}
        onChange={e => onChange(0, e.target.value)}
        className="w-20 tabular-nums text-foreground"
        min="1"
        aria-label="最小间隔（秒）"
      />
      <span>至</span>
      <Input
        type="number"
        value={value[1] / 1000}
        onChange={e => onChange(1, e.target.value)}
        className="w-20 tabular-nums text-foreground"
        min="1"
        aria-label="最大间隔（秒）"
      />
      <span>秒</span>
    </div>
  )
}
