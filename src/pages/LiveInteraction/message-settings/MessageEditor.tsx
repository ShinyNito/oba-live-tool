import { useDebounceEffect, useUpdateEffect } from 'ahooks'
import { PinIcon, PinOffIcon } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import type { Message } from '@/hooks/useAutoMessage'
import { cn } from '@/lib/utils'

const MAX_LENGTH = 50

export default function MessageEditor({
  messages,
  unlimitedLength,
  onChange,
}: {
  messages: Message[]
  unlimitedLength: boolean
  onChange: (messages: Message[]) => void
}) {
  const [localMessages, setLocalMessages] = useState<Message[]>(messages)
  const [text, setText] = useState(() => messages.map(msg => msg.content).join('\n'))

  useUpdateEffect(() => {
    setLocalMessages(messages)
    setText(messages.map(msg => msg.content).join('\n'))
  }, [messages])

  useDebounceEffect(
    () => {
      onChange(localMessages)
    },
    [localMessages],
    { wait: 100 },
  )

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setText(text)
    setLocalMessages(prev =>
      text.split('\n').map((content, i) =>
        prev[i]
          ? {
              ...prev[i],
              content,
            }
          : {
              content,
              id: crypto.randomUUID(),
              pinTop: false,
            },
      ),
    )
  }

  const handleCheckboxChange = (index: number, checked: boolean) => {
    setLocalMessages(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], pinTop: checked }
      return updated
    })
  }

  const getLineLengthInfo = (index: number) => {
    const line = localMessages[index]
    if (!line) return null
    const length = line.content.length
    const isOverLimit = !unlimitedLength && length > MAX_LENGTH
    return { length, isOverLimit }
  }

  const getOverLimitLines = () => {
    if (unlimitedLength) return []
    return localMessages
      .map((msg, index) => ({
        index: index + 1,
        length: msg.content.length,
      }))
      .filter(item => item.length > MAX_LENGTH)
  }

  const overLimitLines = getOverLimitLines()

  return (
    <div className="space-y-2">
      <div className="flex overflow-hidden rounded-lg border bg-card focus-within:ring-2 focus-within:ring-ring/30">
        <div className="border-r bg-muted/60 py-1 font-mono text-xs text-muted-foreground select-none">
          {localMessages.map((msg, i) => {
            const isOverLimit = getLineLengthInfo(i)?.isOverLimit
            return (
              <button
                type="button"
                title={msg.pinTop ? '取消置顶' : '发送后置顶'}
                aria-label={`第 ${i + 1} 行${msg.pinTop ? '，已置顶' : ''}`}
                aria-pressed={msg.pinTop}
                key={msg.id}
                className="group flex h-8 w-full items-center gap-1.5 pr-2.5 pl-2 transition-colors hover:bg-accent"
                onClick={() => handleCheckboxChange(i, !msg.pinTop)}
              >
                {msg.pinTop ? (
                  <PinIcon size={14} className="text-foreground" fill="currentColor" />
                ) : (
                  <PinOffIcon
                    size={14}
                    className="opacity-35 transition-opacity group-hover:opacity-100"
                  />
                )}
                <span
                  className={cn(
                    'ml-auto min-w-4 text-right tabular-nums',
                    isOverLimit && 'font-medium text-destructive',
                  )}
                >
                  {i + 1}
                </span>
              </button>
            )
          })}
        </div>

        <textarea
          value={text}
          spellCheck={false}
          onChange={handleChange}
          rows={localMessages.length || 1}
          placeholder="欢迎{宝宝/家人}来到直播间"
          className="flex-1 resize-none bg-transparent px-3 py-1 text-[13px] whitespace-pre outline-none [scrollbar-width:none] placeholder:text-muted-foreground"
          style={{ lineHeight: '2rem' }}
        />
      </div>
      <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
        <span className="tabular-nums">
          共 {localMessages.filter(msg => msg.content.trim()).length} 条
          {!unlimitedLength && ` · 每行最多 ${MAX_LENGTH} 个字`}
        </span>
        {overLimitLines.length > 0 && (
          <span className="text-destructive">
            第 {overLimitLines.map(item => item.index).join('、')} 行超出字数限制
          </span>
        )}
      </div>
    </div>
  )
}
