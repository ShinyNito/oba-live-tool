import { useMemoizedFn } from 'ahooks'
import { Pause, Play, RefreshCcw, Settings2Icon } from 'lucide-react'
import { motion } from 'motion/react'
import type * as React from 'react'
import { useId, useState } from 'react'
import { autoReplyPlatforms } from '@/abilities'
import { SettingsDialog } from '@/components/common/SettingsDialog'
import { StatusDot } from '@/components/common/StatusDot'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAutoMessageActions, useCurrentAutoMessage } from '@/hooks/useAutoMessage'
import { useAutoReplyActions, useCurrentAutoReply } from '@/hooks/useAutoReply'
import { useAutoReplyConfig } from '@/hooks/useAutoReplyConfig'
import { useCurrentLiveControl } from '@/hooks/useLiveControl'
import { useTaskControl } from '@/hooks/useTaskControl'
import { cn } from '@/lib/utils'
import { RollingNumber } from './components/RollingNumber'
import { Timeline, type TimelineFilter } from './components/Timeline'
import { useCommentListenerControl } from './components/useCommentListenerControl'
import { useMessageSettingsSections } from './message-settings'
import { useReplySettingsSections } from './reply-settings'

const filters: { value: TimelineFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'comment', label: '评论' },
  { value: 'event', label: '互动' },
  { value: 'outgoing', label: '已发出' },
]

export default function LiveInteraction() {
  const platform = useCurrentLiveControl(context => context.platform)
  const isConnected = useCurrentLiveControl(context => context.isConnected)
  const isListening = useCurrentAutoReply(context => context.isListening)
  const replySupported = autoReplyPlatforms.includes(platform)
  const [filter, setFilter] = useState<TimelineFilter>('all')
  const [hideHost, setHideHost] = useState(false)
  const hideHostId = useId()

  const emptyText = !replySupported
    ? filter === 'outgoing'
      ? '开启定时发言后，发出的消息会出现在这里'
      : '当前平台暂不支持监听评论，定时发言仍可使用'
    : filter === 'outgoing'
      ? '开启自动回复或定时发言后，发出的消息会出现在这里'
      : isListening === 'listening'
        ? '等待直播间的新消息…'
        : isConnected === 'connected'
          ? '点击右上角"开始监听"接收直播间评论'
          : '连接中控台后才能监听评论'

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <header className="flex h-9 shrink-0 items-center gap-4">
        <h1 className="text-xl font-semibold tracking-[-0.012em]">直播互动</h1>
        <Tabs value={filter} onValueChange={value => setFilter(value as TimelineFilter)}>
          <TabsList className="h-8">
            {filters.map(item => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className="relative px-3 text-[13px] data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent"
              >
                {filter === item.value && (
                  <motion.span
                    layoutId="timeline-filter"
                    className="absolute inset-0 rounded-md bg-card shadow-sm dark:bg-input/30"
                    transition={{ type: 'spring', bounce: 0, visualDuration: 0.22 }}
                  />
                )}
                <span className="relative">{item.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <label
          htmlFor={hideHostId}
          className="flex items-center gap-2 text-xs whitespace-nowrap text-muted-foreground"
        >
          <Switch id={hideHostId} checked={hideHost} onCheckedChange={setHideHost} />
          隐藏主播
        </label>
        {replySupported && <ListenerControl />}
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_clamp(260px,22vw,320px)] gap-4">
        <section
          aria-label="直播间消息"
          className="min-h-0 overflow-hidden rounded-xl border bg-card"
        >
          <Timeline
            filter={filter}
            hideHost={hideHost}
            empty={
              <p className="px-4 py-16 text-center text-[13px] text-muted-foreground">
                {emptyText}
              </p>
            }
          />
        </section>

        <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto">
          <AutoReplyBlock supported={replySupported} />
          <AutoMessageBlock />
          <SessionStats />
        </aside>
      </div>
    </div>
  )
}

const listenStatus = {
  listening: { tone: 'live', text: '监听中' },
  waiting: { tone: 'warning', text: '连接中' },
  error: { tone: 'live', text: '监听失败' },
  stopped: { tone: 'idle', text: '未监听' },
} as const

/** 监听状态 + 开始/停止，放在工具栏最右侧 */
function ListenerControl() {
  const isListening = useCurrentAutoReply(context => context.isListening)
  const isConnected = useCurrentLiveControl(context => context.isConnected)
  const { startListening, stopListening } = useCommentListenerControl()
  const { tone, text } = listenStatus[isListening] ?? listenStatus.stopped

  return (
    <div className="ml-auto flex items-center gap-3">
      <span className="inline-flex items-center gap-1.5 text-xs whitespace-nowrap text-muted-foreground">
        <StatusDot tone={tone} pulse={isListening === 'listening'} />
        {text}
      </span>
      {isListening === 'error' && isConnected === 'connected' && (
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={startListening}
          aria-label="重试"
        >
          <RefreshCcw />
        </Button>
      )}
      {isListening === 'listening' ? (
        <Button variant="outline" size="sm" onClick={stopListening}>
          <Pause />
          停止监听
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={startListening}
          title={isConnected !== 'connected' ? '请先连接直播间' : undefined}
          disabled={isListening === 'waiting' || isConnected !== 'connected'}
        >
          <Play />
          {isListening === 'waiting' ? '连接中…' : '开始监听'}
        </Button>
      )}
    </div>
  )
}

const EVENT_TYPES = [
  'room_enter',
  'room_like',
  'room_follow',
  'live_order',
  'subscribe_merchant_brand_vip',
  'ecom_fansclub_participate',
] as const

function AutoReplyBlock({ supported }: { supported: boolean }) {
  const isRunning = useCurrentAutoReply(context => context.isRunning)
  const isListening = useCurrentAutoReply(context => context.isListening)
  const { setIsRunning } = useAutoReplyActions()
  const { config } = useAutoReplyConfig()
  const { startListening } = useCommentListenerControl()
  const sections = useReplySettingsSections()

  const handleToggle = useMemoizedFn(() => {
    if (isRunning) {
      setIsRunning(false)
      return
    }
    setIsRunning(true)
    // 自动回复依赖评论监听，开启时顺带开始监听
    if (isListening !== 'listening' && isListening !== 'waiting') void startListening()
  })

  const ways = [
    config.comment.keywordReply.enable && `关键词 ${config.comment.keywordReply.rules.length} 条`,
    config.comment.aiReply.enable && 'AI 回复',
    EVENT_TYPES.some(type => config[type].enable) && '互动回复',
  ].filter(Boolean)

  return (
    <TaskBlock
      name="自动回复"
      running={isRunning}
      summary={
        !supported
          ? '当前平台暂不支持'
          : ways.length
            ? ways.join(' · ')
            : '还没有开启任何回复方式，请先在设置中开启'
      }
      warn={supported && ways.length === 0}
      disabled={!supported}
      onToggle={handleToggle}
      settings={
        supported && (
          <SettingsDialog
            title="回复设置"
            sections={sections}
            trigger={<SettingsButton label="回复设置" />}
          />
        )
      }
    />
  )
}

function AutoMessageBlock() {
  const isRunning = useCurrentAutoMessage(context => context.isRunning)
  const config = useCurrentAutoMessage(context => context.config)
  const { setIsRunning } = useAutoMessageActions()
  const sections = useMessageSettingsSections()
  const { onStartTask, onStopTask } = useTaskControl({
    taskType: 'auto-comment',
    getIsRunning: () => isRunning,
    getConfig: () => config,
    setIsRunning,
    startSuccessMessage: '定时发言已开启',
    startFailureMessage: '定时发言开启失败',
  })

  const count = config.messages.filter(message => message.content.trim()).length
  const [min, max] = config.scheduler.interval.map(ms => ms / 1000)

  return (
    <TaskBlock
      name="定时发言"
      running={isRunning}
      summary={count ? `${count} 条消息 · 每 ${min}–${max} 秒一条` : '还没有消息，请先在设置中添加'}
      warn={count === 0}
      onToggle={() => (isRunning ? onStopTask() : onStartTask())}
      settings={
        <SettingsDialog
          title="发言设置"
          sections={sections}
          trigger={<SettingsButton label="发言设置" />}
        />
      }
    />
  )
}

function TaskBlock({
  name,
  running,
  summary,
  warn,
  disabled,
  onToggle,
  settings,
}: {
  name: string
  running: boolean
  summary: string
  warn?: boolean
  disabled?: boolean
  onToggle: () => void
  settings: React.ReactNode
}) {
  const isConnected = useCurrentLiveControl(context => context.isConnected)
  // 未连接中控台时不能开启；已在运行的任务仍可停止
  const blocked = !running && isConnected !== 'connected'
  return (
    <section
      className={cn('rounded-xl border bg-card p-4 transition-colors', running && 'border-live/25')}
    >
      <div className="flex h-6 items-center gap-2">
        <StatusDot tone={running ? 'live' : 'idle'} pulse={running} />
        <h2 className="text-[13px] font-semibold">{name}</h2>
        <span className={cn('text-xs', running ? 'text-live' : 'text-muted-foreground')}>
          {running ? '运行中' : '未开启'}
        </span>
        <div className="-mr-1.5 ml-auto">{settings}</div>
      </div>
      <p
        className={cn(
          'mt-1.5 text-xs leading-relaxed',
          warn ? 'text-warning-ink' : 'text-muted-foreground',
        )}
      >
        {summary}
      </p>
      <Button
        size="sm"
        variant={running ? 'outline' : 'default'}
        className={cn(
          'mt-3 w-full',
          running && 'border-live/30 bg-live-soft text-live hover:bg-live-soft/80',
        )}
        disabled={disabled || blocked}
        title={blocked && !disabled ? '请先连接中控台' : undefined}
        onClick={onToggle}
      >
        {running ? `停止${name}` : `开启${name}`}
      </Button>
      {blocked && !disabled && (
        <p className="mt-2 text-center text-xs text-muted-foreground">连接中控台后才能开启</p>
      )}
    </section>
  )
}

function SettingsButton({ label, ...props }: { label: string } & React.ComponentProps<'button'>) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7"
      aria-label={label}
      title={label}
      {...props}
    >
      <Settings2Icon />
    </Button>
  )
}

/** 本场累计数据，不受列表条数上限影响。按"收到 / 发出"分组，数字右对齐方便扫读 */
function SessionStats() {
  const stats = useCurrentAutoReply(context => context.stats)
  const groups = [
    {
      title: '收到',
      total: stats.comments + stats.events,
      rows: [
        { label: '评论', value: stats.comments },
        { label: '互动', value: stats.events },
      ],
    },
    {
      title: '发出',
      total: stats.replies + stats.messages,
      rows: [
        { label: '自动回复', value: stats.replies },
        { label: '主动发言', value: stats.messages },
      ],
    },
  ]

  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="flex h-6 items-center text-[13px] font-semibold">本场</h2>
      <div className="mt-2 divide-y">
        {groups.map(group => (
          <dl key={group.title} className="py-2.5 first:pt-1 last:pb-0">
            <div className="flex items-baseline justify-between">
              <dt className="text-xs text-muted-foreground">{group.title}</dt>
              <dd className="text-base font-semibold tracking-[-0.01em]">
                <RollingNumber value={group.total} />
              </dd>
            </div>
            {group.rows.map(row => (
              <div key={row.label} className="mt-1 flex items-baseline justify-between text-xs">
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="text-foreground/80">
                  <RollingNumber value={row.value} />
                </dd>
              </div>
            ))}
          </dl>
        ))}
      </div>
    </section>
  )
}
