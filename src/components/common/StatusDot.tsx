import { cn } from '@/lib/utils'

const toneClass = {
  live: 'bg-live',
  success: 'bg-success',
  warning: 'bg-warning',
  idle: 'bg-muted-foreground/40',
} as const

/** 状态圆点。`pulse` 时外圈扩散，用于"运行中/连接中"这类持续状态 */
export function StatusDot({
  tone,
  pulse = false,
  className,
}: {
  tone: keyof typeof toneClass
  pulse?: boolean
  className?: string
}) {
  return (
    <span className={cn('relative inline-flex size-2 shrink-0', className)} aria-hidden>
      {pulse && (
        <span className={cn('absolute inset-0 rounded-full animate-on-air', toneClass[tone])} />
      )}
      <span className={cn('relative size-2 rounded-full', toneClass[tone])} />
    </span>
  )
}
