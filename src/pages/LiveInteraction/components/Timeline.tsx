import { useMemoizedFn } from 'ahooks'
import { CornerDownRightIcon, SendHorizontalIcon } from 'lucide-react'
import { memo, useMemo } from 'react'
import { IPC_CHANNELS } from 'shared/ipcChannels'
import { Button } from '@/components/ui/button'
import { useAccounts } from '@/hooks/useAccounts'
import {
  isCommentMessage,
  type Message,
  type ReplyPreview,
  type ReplySource,
  useCurrentAutoReply,
} from '@/hooks/useAutoReply'
import { useCurrentLiveControl } from '@/hooks/useLiveControl'
import { cn } from '@/lib/utils'
import { LiveList } from './LiveList'

export type TimelineFilter = 'all' | 'comment' | 'event' | 'outgoing'

/** 非评论类消息：显示为一行灰色的事件 */
const eventText: Partial<Record<Message['msg_type'], string>> = {
  room_enter: '进入直播间',
  room_like: '点赞了直播间',
  room_follow: '关注了直播间',
  subscribe_merchant_brand_vip: '加入了品牌会员',
  ecom_fansclub_participate: '加入了粉丝团',
}

const orderTone: Record<LiveOrderMessage['order_status'], string> = {
  已下单: 'bg-warning-soft text-warning-ink',
  已付款: 'bg-success-soft text-success',
  未知状态: 'bg-muted text-muted-foreground',
}

const sourceLabel: Record<ReplySource, string> = {
  keyword: '关键词',
  event: '互动',
  ai: 'AI',
  scheduled: '定时',
  batch: '刷屏',
}

type TimelineItem =
  | { kind: 'message'; key: string; time: number; message: Message; replies: ReplyPreview[] }
  | { kind: 'outgoing'; key: string; time: number; reply: ReplyPreview; target?: Message }

// 复用同一个格式化器：toLocaleTimeString 每次调用都会新建一个 Intl.DateTimeFormat
const timeFormat = new Intl.DateTimeFormat('zh-CN', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})
const formatTime = (time: number) => timeFormat.format(time)

const messageText = (message: Message) =>
  eventText[message.msg_type] ??
  (message.msg_type === 'live_order'
    ? `下单 ${message.product_title}`
    : 'content' in message
      ? message.content
      : '')

/**
 * 把评论和发出的消息合成一条按时间正序的时间线（最新的在最后）。
 * 自动回复挂在触发它的评论下面；定时发言、刷屏以及原评论已被挤出列表的回复单独成行
 */
function useTimelineItems(filter: TimelineFilter, hideHost: boolean) {
  const comments = useCurrentAutoReply(context => context.comments)
  const replies = useCurrentAutoReply(context => context.replies)
  const accountName = useCurrentLiveControl(context => context.accountName)

  return useMemo(() => {
    const commentById = new Map(comments.map(comment => [comment.msg_id, comment]))

    if (filter === 'outgoing') {
      return replies.toReversed().map<TimelineItem>(reply => ({
        kind: 'outgoing',
        key: reply.id,
        time: Date.parse(reply.time),
        reply,
        target: commentById.get(reply.commentId),
      }))
    }

    const repliesByComment = new Map<string, ReplyPreview[]>()
    const standalone: TimelineItem[] = []
    // replies 是新的在前，挂到评论下时反转成先后顺序
    for (const reply of replies.toReversed()) {
      if (reply.commentId && commentById.has(reply.commentId)) {
        const list = repliesByComment.get(reply.commentId) ?? []
        list.push(reply)
        repliesByComment.set(reply.commentId, list)
      } else if (filter === 'all') {
        standalone.unshift({
          kind: 'outgoing',
          key: reply.id,
          time: Date.parse(reply.time),
          reply,
        })
      }
    }

    const messages: TimelineItem[] = []
    for (const message of comments) {
      if (hideHost && accountName && message.nick_name === accountName) continue
      const isComment = isCommentMessage(message)
      if ((filter === 'comment' && !isComment) || (filter === 'event' && isComment)) continue
      messages.push({
        kind: 'message',
        key: message.msg_id,
        time: message.time,
        message,
        replies: repliesByComment.get(message.msg_id) ?? [],
      })
    }

    // 两个列表都已按时间倒序，归并即可
    const merged: TimelineItem[] = []
    let i = 0
    let j = 0
    while (i < messages.length || j < standalone.length) {
      if (j >= standalone.length || (i < messages.length && messages[i].time >= standalone[j].time))
        merged.push(messages[i++])
      else merged.push(standalone[j++])
    }
    // store 里是新的在前，展示为聊天式：旧的在上、新的在下
    return merged.reverse()
  }, [comments, replies, filter, hideHost, accountName])
}

export function Timeline({
  filter,
  hideHost,
  empty,
}: {
  filter: TimelineFilter
  hideHost: boolean
  empty: React.ReactNode
}) {
  const items = useTimelineItems(filter, hideHost)
  const accountName = useCurrentLiveControl(context => context.accountName)
  const currentAccountId = useAccounts(state => state.currentAccountId)

  const resend = useMemoizedFn(async (content: string) => {
    try {
      await window.ipcRenderer.invoke(
        IPC_CHANNELS.tasks.autoReply.sendReply,
        currentAccountId,
        content,
        { manual: true },
      )
    } catch (error) {
      console.error('发送失败:', error)
    }
  })

  return (
    <LiveList
      // 切换筛选时重新挂载：回到底部，也不会让整屏的行都播放进入动画
      key={`${filter}-${hideHost}`}
      items={items}
      getKey={item => item.key}
      estimateSize={item =>
        item.kind === 'outgoing'
          ? 36
          : (eventText[item.message.msg_type] ? 26 : 34) + item.replies.length * 30
      }
      renderItem={item =>
        item.kind === 'outgoing' ? (
          <OutgoingRow time={item.time} reply={item.reply} target={item.target} onResend={resend} />
        ) : (
          <MessageRow
            message={item.message}
            replies={item.replies}
            isHost={!!accountName && item.message.nick_name === accountName}
            onResend={resend}
          />
        )
      }
      empty={empty}
    />
  )
}

/** 左侧时间列 + 右侧内容，所有行共用 */
function Row({
  time,
  className,
  children,
}: {
  time: number
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('group/row flex gap-3 px-4', className)}>
      <time className="w-[52px] shrink-0 pt-px font-mono text-[11px] leading-5 tabular-nums text-muted-foreground/70">
        {formatTime(time)}
      </time>
      <div className="min-w-0 max-w-[72ch] flex-1">{children}</div>
    </div>
  )
}

interface MessageRowProps {
  message: Message
  replies: ReplyPreview[]
  isHost: boolean
  onResend: (content: string) => void
}

const MessageRow = memo(function MessageRow({
  message,
  replies,
  isHost,
  onResend,
}: MessageRowProps) {
  const event = eventText[message.msg_type]

  if (event) {
    return (
      <Row time={message.time} className="py-[3px]">
        <p className="truncate text-xs leading-5 text-muted-foreground">
          {message.nick_name} {event}
        </p>
        <ReplyLines replies={replies} onResend={onResend} />
      </Row>
    )
  }

  return (
    <Row time={message.time} className="py-1.5 transition-colors hover:bg-muted/40">
      <p className="text-[13px] leading-5 break-words">
        <span
          className={cn(
            'mr-2 text-xs font-medium',
            isHost ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          {message.nick_name}
          {isHost && <span className="ml-1 font-normal">· 主播</span>}
        </span>
        {message.msg_type === 'live_order' && (
          <span
            className={cn(
              'mr-1.5 inline-block rounded-sm px-1.5 align-[1px] text-[11px] leading-[18px] font-medium',
              orderTone[message.order_status],
            )}
          >
            {message.order_status}
          </span>
        )}
        {message.msg_type === 'live_order'
          ? message.product_title
          : 'content' in message && message.content}
      </p>
      <ReplyLines replies={replies} onResend={onResend} />
    </Row>
  )
}, sameMessageRow)

/** 每次合成时间线都会新建 replies 数组，按元素比较；评论和回复对象本身在 store 里是稳定的 */
function sameMessageRow(prev: MessageRowProps, next: MessageRowProps) {
  return (
    prev.message === next.message &&
    prev.isHost === next.isHost &&
    prev.onResend === next.onResend &&
    prev.replies.length === next.replies.length &&
    prev.replies.every((reply, i) => reply === next.replies[i])
  )
}

/** 挂在评论下面的自动回复 */
function ReplyLines({
  replies,
  onResend,
}: {
  replies: ReplyPreview[]
  onResend: (content: string) => void
}) {
  if (replies.length === 0) return null
  return (
    <ul className="mt-1 space-y-1">
      {replies.map(reply => (
        <li key={reply.id} className="group/reply flex items-start gap-1.5">
          <CornerDownRightIcon className="mt-[3px] size-3.5 shrink-0 text-muted-foreground/60" />
          <SourceTag source={reply.source} />
          <p className="min-w-0 text-[13px] leading-5 break-words">{reply.replyContent}</p>
          <SendState reply={reply} onResend={onResend} group="reply" />
        </li>
      ))}
    </ul>
  )
}

/** 主动发出的消息（定时、刷屏），以及原评论已经不在列表里的回复 */
const OutgoingRow = memo(function OutgoingRow({
  time,
  reply,
  target,
  onResend,
}: {
  time: number
  reply: ReplyPreview
  target?: Message
  onResend: (content: string) => void
}) {
  return (
    <Row time={time} className="py-1.5">
      <div className="flex w-fit max-w-full items-start gap-1.5 rounded-md bg-primary/[0.045] py-1 pr-1 pl-2 ring-1 ring-primary/10 ring-inset">
        <SourceTag source={reply.source} />
        <div className="min-w-0">
          {reply.replyFor && (
            <p className="truncate text-xs leading-5 text-muted-foreground">
              回复 {reply.replyFor}
              {target && `：${messageText(target)}`}
            </p>
          )}
          <p className="text-[13px] leading-5 break-words">{reply.replyContent}</p>
        </div>
        <SendState reply={reply} onResend={onResend} group="row" />
      </div>
    </Row>
  )
})

function SourceTag({ source }: { source: ReplySource }) {
  const outgoing = source === 'scheduled' || source === 'batch'
  return (
    <span
      className={cn(
        'mt-px shrink-0 rounded-sm px-1.5 text-[11px] leading-[18px] font-medium',
        source === 'ai'
          ? 'bg-primary text-primary-foreground'
          : outgoing
            ? 'bg-primary/10 text-primary'
            : 'bg-muted text-muted-foreground',
      )}
    >
      {sourceLabel[source] ?? 'AI'}
    </span>
  )
}

/** 未发送标记 + 发送按钮。按钮占固定位置，悬停时才显示，不会盖住文字 */
function SendState({
  reply,
  onResend,
  group,
}: {
  reply: ReplyPreview
  onResend: (content: string) => void
  group: 'reply' | 'row'
}) {
  const label = reply.sent ? '再次发送' : '发送'
  return (
    <div className="-my-0.5 flex h-6 shrink-0 items-center gap-1 pl-1">
      {!reply.sent && (
        <span className="text-[11px] whitespace-nowrap text-warning-ink">未发送</span>
      )}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'size-6 text-muted-foreground opacity-0 focus-visible:opacity-100 [&_svg]:size-3.5',
          group === 'reply' ? 'group-hover/reply:opacity-100' : 'group-hover/row:opacity-100',
        )}
        aria-label={label}
        title={label}
        onClick={() => onResend(reply.replyContent)}
      >
        <SendHorizontalIcon />
      </Button>
    </div>
  )
}
