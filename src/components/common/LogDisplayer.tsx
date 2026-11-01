import type { LogMessage } from 'electron-log'
import { ChevronUpIcon } from 'lucide-react'
import { memo, useCallback, useEffect, useId, useRef, useState } from 'react'
import { IPC_CHANNELS } from 'shared/ipcChannels'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { useIpcListener } from '@/hooks/useIpc'
import { cn } from '@/lib/utils'

interface ParsedLog {
  id: string
  time: string
  fullTime: string
  module: string
  level: string
  message: string
}

const MAX_LOG_MESSAGES = 200 // 仅展示最近的 200 条日志
const EXPANDED_KEY = 'log-panel-expanded'

const levelClass: Record<string, string> = {
  ERROR: 'text-destructive font-medium',
  FATAL: 'text-destructive font-semibold',
  WARN: 'text-warning font-medium',
  DEBUG: 'text-chart-3',
  SUCCESS: 'text-success',
}

const isError = (level: string) => level === 'ERROR' || level === 'FATAL'

function parseLogMessage(log: LogMessage): ParsedLog | null {
  if (!log.data || log.data.length === 0) {
    return null
  }
  return {
    id: crypto.randomUUID(),
    time: log.date.toLocaleTimeString('zh-CN', { hour12: false }),
    fullTime: log.date.toLocaleString(),
    module: log.scope ?? 'App',
    level: typeof log.level === 'string' ? log.level.toUpperCase() : 'INFO',
    // 只保留换行符之前的内容
    message: log.data.map(String).join(' ').split('\n')[0],
  }
}

export default function LogDisplayer() {
  const [logMessages, setLogMessages] = useState<ParsedLog[]>([])
  const [autoScroll, setAutoScroll] = useState(true)
  const [expanded, setExpanded] = useState(() => localStorage.getItem(EXPANDED_KEY) === '1')
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    const scrollContainer = viewportRef.current
    if (scrollContainer && autoScroll) {
      requestAnimationFrame(() => {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      })
    }
  }, [autoScroll])

  useEffect(() => {
    // 监听 ScrollArea 的 viewport 元素
    viewportRef.current =
      scrollAreaRef.current?.querySelector<HTMLDivElement>('[data-radix-scroll-area-viewport]') ??
      null
  }, [])

  useEffect(() => {
    localStorage.setItem(EXPANDED_KEY, expanded ? '1' : '0')
    if (expanded) scrollToBottom()
  }, [expanded, scrollToBottom])

  const handleLogMessage = useCallback(
    (message: LogMessage) => {
      const parsed = parseLogMessage(message)
      if (parsed) {
        setLogMessages(prev => [...prev.slice(-MAX_LOG_MESSAGES + 1), parsed])
        scrollToBottom()
      }
    },
    [scrollToBottom],
  )

  useIpcListener(IPC_CHANNELS.log, handleLogMessage)

  const autoScrollId = useId()
  const latest = logMessages.at(-1)
  const errorCount = logMessages.filter(log => isError(log.level)).length

  return (
    <section className="shrink-0 border-t bg-card">
      <div className="flex h-9 items-center gap-3 pr-3">
        <button
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          aria-expanded={expanded}
          className="flex h-full min-w-0 flex-1 items-center gap-2 pl-4 text-left text-[13px] transition-colors hover:bg-accent/60"
        >
          <ChevronUpIcon
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out',
              expanded && 'rotate-180',
            )}
          />
          <span className="shrink-0 font-medium">运行日志</span>
          <span className="shrink-0 tabular-nums text-muted-foreground">{logMessages.length}</span>
          {errorCount > 0 && (
            <span className="shrink-0 rounded-sm bg-live-soft px-1.5 text-xs font-medium tabular-nums text-destructive">
              {errorCount} 个错误
            </span>
          )}
          {!expanded && latest && (
            <span className="min-w-0 truncate font-mono text-xs text-muted-foreground">
              <span className="tabular-nums">{latest.time}</span>
              <span className={cn('mx-2', levelClass[latest.level])}>{latest.level}</span>
              <span className="text-foreground/80">{latest.message}</span>
            </span>
          )}
        </button>

        {expanded && (
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch id={autoScrollId} checked={autoScroll} onCheckedChange={setAutoScroll} />
              <label
                htmlFor={autoScrollId}
                className="cursor-pointer text-xs text-muted-foreground select-none"
              >
                自动滚动
              </label>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLogMessages([])}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
            >
              清空
            </Button>
          </div>
        )}
      </div>

      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
      >
        <div className="min-h-0 overflow-hidden">
          <ScrollArea ref={scrollAreaRef} className="h-48 border-t">
            <div className="py-1.5 font-mono text-xs">
              {logMessages.length === 0 && (
                <p className="px-4 py-3 font-sans text-muted-foreground">暂无日志</p>
              )}
              {logMessages.map(log => (
                <LogItem key={log.id} log={log} />
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </section>
  )
}

// 日志不可变，新日志到来时已有的行不必重新渲染
const LogItem = memo(function LogItem({ log }: { log: ParsedLog }) {
  return (
    <div
      className={cn(
        'flex items-baseline gap-3 px-4 py-0.5 leading-5 whitespace-nowrap hover:bg-muted',
        isError(log.level) && 'bg-live-soft/60',
      )}
    >
      <span className="shrink-0 tabular-nums text-muted-foreground" title={log.fullTime}>
        {log.time}
      </span>
      <span className="shrink-0 text-foreground/60">{log.module}</span>
      <span className={cn('w-14 shrink-0', levelClass[log.level] ?? 'text-muted-foreground')}>
        {log.level}
      </span>
      <span className="truncate text-foreground">{log.message}</span>
    </div>
  )
})
