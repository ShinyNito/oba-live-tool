import type * as React from 'react'
import { useState } from 'react'
import { SectionVariantProvider } from '@/components/common/Layout'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export interface SettingsDialogSection {
  id: string
  label: string
  content: React.ReactNode
}

/** 设置弹窗：左侧分类导航，右侧滚动显示当前分类。修改即时保存，没有确认按钮 */
export function SettingsDialog({
  title,
  description,
  sections,
  trigger,
}: {
  title: string
  description?: string
  sections: SettingsDialogSection[]
  trigger: React.ReactNode
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id)
  const active = sections.find(section => section.id === activeId) ?? sections[0]

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex h-[min(680px,85vh)] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <nav className="flex w-44 shrink-0 flex-col gap-0.5 border-r bg-sidebar p-3">
          <div className="px-2 pt-1 pb-3">
            <DialogTitle className="text-[15px]">{title}</DialogTitle>
            <DialogDescription className="mt-1 text-xs">
              {description ?? '修改会自动保存'}
            </DialogDescription>
          </div>
          {sections.map(section => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveId(section.id)}
              aria-current={section.id === active?.id ? 'page' : undefined}
              className={cn(
                'h-8 rounded-md px-2 text-left text-[13px] transition-colors',
                section.id === active?.id
                  ? 'bg-card font-medium text-foreground shadow-xs ring-1 ring-border'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {section.label}
            </button>
          ))}
        </nav>
        <div className="min-w-0 flex-1 overflow-y-auto bg-card px-7 py-6">
          <SectionVariantProvider value="plain">{active?.content}</SectionVariantProvider>
        </div>
      </DialogContent>
    </Dialog>
  )
}
