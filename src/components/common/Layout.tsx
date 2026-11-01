import type * as React from 'react'
import { createContext, useContext } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/** Section 的外观：页面里是卡片，弹窗里平铺（弹窗本身已是容器） */
const SectionVariantContext = createContext<'card' | 'plain'>('card')
export const SectionVariantProvider = SectionVariantContext.Provider

/** 页面中的一个内容块：标题 + 说明 + 右侧操作，内容区在下 */
export function Section({
  id,
  title,
  description,
  action,
  className,
  contentClassName,
  children,
}: {
  id?: string
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
  contentClassName?: string
  children?: React.ReactNode
}) {
  const variant = useContext(SectionVariantContext)
  if (variant === 'plain') {
    return (
      <section id={id} className={cn('space-y-5', className)}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h3 className="text-[15px] leading-none font-semibold">{title}</h3>
            {description && <p className="text-[13px] text-muted-foreground">{description}</p>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>
        {children && <div className={cn('space-y-5', contentClassName)}>{children}</div>}
      </section>
    )
  }
  return (
    <Card id={id} className={cn('scroll-mt-6', className)}>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="min-w-0 space-y-1">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </CardHeader>
      {children && (
        <CardContent className={cn('space-y-5', contentClassName)}>{children}</CardContent>
      )}
    </Card>
  )
}

/** 一行设置：左侧名称和说明，右侧控件（开关、按钮、短输入） */
export function SettingRow({
  label,
  description,
  htmlFor,
  children,
  className,
}: {
  label: React.ReactNode
  description?: React.ReactNode
  htmlFor?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between gap-6', className)}>
      <div className="min-w-0 space-y-0.5">
        <label htmlFor={htmlFor} className="block text-[13px] font-medium leading-5">
          {label}
        </label>
        {description && <Hint>{description}</Hint>}
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  )
}

/** 纵向表单项：标签、控件、提示 */
export function Field({
  label,
  hint,
  htmlFor,
  action,
  children,
  className,
}: {
  label: React.ReactNode
  hint?: React.ReactNode
  htmlFor?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={htmlFor} className="text-[13px] font-medium leading-5">
          {label}
        </label>
        {action}
      </div>
      {children}
      {hint && <Hint>{hint}</Hint>}
    </div>
  )
}

export function Hint({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <p className={cn('text-xs leading-relaxed text-muted-foreground', className)}>{children}</p>
  )
}

/** 行内变量/代码标记，如 {用户名} */
export function Token({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-sm bg-muted px-1 py-px font-mono text-[12px] text-foreground">
      {children}
    </code>
  )
}

/** 内容块之间的细分隔线 */
export function Divider() {
  return <div className="h-px bg-border" />
}
