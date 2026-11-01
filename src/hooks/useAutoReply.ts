import { useMemoizedFn } from 'ahooks'
import { type Draft, isDraft, original } from 'immer'
import { IPC_CHANNELS } from 'shared/ipcChannels'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useShallow } from 'zustand/react/shallow'
import { AUTO_REPLY } from '@/constants'
import { EVENTS, eventEmitter } from '@/utils/events'
import { matchObject } from '@/utils/filter'
import { useAccounts } from './useAccounts'
import type { ChatMessage } from './useAIChat'
import { type AIProvider, useAIProvider } from './useAIProvider'
import { type AutoReplyConfig, useAutoReplyConfig } from './useAutoReplyConfig'
import { useErrorHandler } from './useErrorHandler'
import { useCurrentLiveControl } from './useLiveControl'

/** 来源：关键词规则、互动事件、AI 生成，以及主动发出的定时发言、一键刷屏 */
export type ReplySource = 'keyword' | 'event' | 'ai' | 'scheduled' | 'batch'

export interface ReplyPreview {
  id: string
  commentId: string
  replyContent: string
  replyFor: string
  time: string
  source: ReplySource
  /** 是否已发送到直播间（AI 关闭自动发送时为 false） */
  sent: boolean
}

export type Message = LiveMessage
export type MessageType = Message['msg_type']
export type EventMessageType = Extract<
  MessageType,
  | 'room_enter'
  | 'room_like'
  | 'live_order'
  | 'subscribe_merchant_brand_vip'
  | 'room_follow'
  | 'ecom_fansclub_participate'
>
export type MessageOf<T extends MessageType> = Extract<Message, { msg_type: T }>
type CommentMessage = MessageOf<Exclude<MessageType, EventMessageType>>

type ListeningStatus = 'waiting' | 'listening' | 'stopped' | 'error'

/** 本场统计。列表有条数上限，统计单独累计 */
export interface AutoReplyStats {
  comments: number
  events: number
  replies: number
  messages: number
}

interface AutoReplyContext {
  isRunning: boolean
  isListening: ListeningStatus
  replies: ReplyPreview[]
  comments: Message[]
  stats: AutoReplyStats
}

const COMMENT_TYPES: ReadonlySet<MessageType> = new Set(['comment', 'wechat_channel_live_msg'])
/** 是否为观众评论（其余为进房、点赞、下单等互动事件） */
export const isCommentMessage = (message: Message) => COMMENT_TYPES.has(message.msg_type)

interface AutoReplyState {
  contexts: Record<string, AutoReplyContext>
}
interface AutoReplyAction {
  setIsRunning: (accountId: string, isRunning: boolean) => void
  setIsListening: (accountId: string, isListening: ListeningStatus) => void
  addComment: (accountId: string, comment: Message) => void
  addReply: (
    accountId: string,
    reply: Pick<ReplyPreview, 'commentId' | 'replyFor' | 'replyContent' | 'source' | 'sent'>,
  ) => void
  removeReply: (accountId: string, commentId: string) => void
}

const createDefaultContext = (): AutoReplyContext => ({
  isRunning: false,
  isListening: 'stopped',
  replies: [],
  comments: [],
  stats: { comments: 0, events: 0, replies: 0, messages: 0 },
})

/** 取 draft 对应的原数组。直接展开 draft 会给每个元素都创建代理，列表 500 条时每来一条评论都要多做 500 次 */
const baseOf = <T>(value: T): T => (isDraft(value) ? (original(value as Draft<T>) as T) : value)

export const useAutoReplyStore = create<AutoReplyState & AutoReplyAction>()(
  immer(set => {
    eventEmitter.on(EVENTS.ACCOUNT_REMOVED, (accountId: string) => {
      set(state => {
        delete state.contexts[accountId]
      })
    })

    const ensureContext = (state: AutoReplyState, accountId: string) => {
      if (!state.contexts[accountId]) {
        state.contexts[accountId] = createDefaultContext()
      }
      return state.contexts[accountId]
    }

    return {
      contexts: {},
      setIsRunning: (accountId, isRunning) =>
        set(state => {
          const context = ensureContext(state, accountId)
          context.isRunning = isRunning
        }),
      setIsListening: (accountId, isListening) =>
        set(state => {
          const context = ensureContext(state, accountId)
          context.isListening = isListening
        }),

      addComment: (accountId, comment) =>
        set(state => {
          const context = ensureContext(state, accountId)
          // 限制评论数量，防止内存无限增长
          context.comments = [comment, ...baseOf(context.comments)].slice(
            0,
            AUTO_REPLY.MAX_COMMENTS,
          )
          if (isCommentMessage(comment)) context.stats.comments++
          else context.stats.events++
        }),
      addReply: (accountId, reply) =>
        set(state => {
          const context = ensureContext(state, accountId)
          context.replies = [
            {
              ...reply,
              id: crypto.randomUUID(),
              time: new Date().toISOString(),
            },
            ...baseOf(context.replies),
          ].slice(0, AUTO_REPLY.MAX_REPLIES)
          if (reply.source === 'scheduled' || reply.source === 'batch') context.stats.messages++
          else context.stats.replies++
        }),
      removeReply: (accountId, commentId) =>
        set(state => {
          const context = ensureContext(state, accountId)
          context.replies = context.replies.filter(reply => reply.commentId !== commentId)
        }),
    }
  }),
)

function generateAIMessages(
  comments: CommentMessage[],
  replies: ReplyPreview[],
): Omit<ChatMessage, 'id' | 'timestamp'>[] {
  // 1. 按时间排序混合评论和回复
  const sortedItems = [
    ...comments.map(c => ({ type: 'comment' as const, time: c.time, data: c })),
    ...replies.map(r => ({ type: 'reply' as const, time: r.time, data: r })),
  ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

  // 2. 转换为 AI 消息格式
  const rawMessages: Omit<ChatMessage, 'id' | 'timestamp'>[] = sortedItems.map(item => {
    if (item.type === 'comment') {
      return {
        role: 'user',
        // 发送给 AI 的格式，包含昵称和内容
        content: JSON.stringify({
          nickname: item.data.nick_name,
          content: item.data.content ?? '', // 确保 content 是字符串
        }),
      }
    }
    // item.type === 'reply'
    return {
      role: 'assistant',
      content: item.data.replyContent,
    }
  })

  // 3. 合并连续的同角色消息
  if (rawMessages.length === 0) {
    return []
  }

  const mergedMessages: Omit<ChatMessage, 'id' | 'timestamp'>[] = []
  let currentMessage = { ...rawMessages[0], content: [rawMessages[0].content] } // 初始化第一个消息

  for (let i = 1; i < rawMessages.length; i++) {
    if (rawMessages[i].role === currentMessage.role) {
      currentMessage.content.push(rawMessages[i].content) // 追加内容
    } else {
      // 角色变化，保存之前的消息，开始新消息
      mergedMessages.push({
        role: currentMessage.role,
        content: currentMessage.content.join('\n'), // 用换行符合并内容
      })
      currentMessage = { ...rawMessages[i], content: [rawMessages[i].content] }
    }
  }

  // 添加最后一条消息
  mergedMessages.push({
    role: currentMessage.role,
    content: currentMessage.content.join('\n'),
  })

  return mergedMessages
}

/** 发送互动事件的回复，返回实际发送的内容 */
function sendConfiguredReply(
  accountId: string,
  config: AutoReplyConfig,
  sourceMessage: Message,
  errorHandler: ReturnType<typeof useErrorHandler>['handleError'],
): string | null {
  const replyConfig = config[sourceMessage.msg_type as EventMessageType]
  if (replyConfig.enable && replyConfig.messages.length > 0) {
    const filterMessages = []
    const pureMessages = []
    for (const message of replyConfig.messages) {
      if (typeof message === 'string') {
        pureMessages.push(message)
      } else if (matchObject(sourceMessage, message.filter)) {
        filterMessages.push(message.content)
      }
    }
    const replyMessages = filterMessages.length ? filterMessages : pureMessages
    const content = getRandomElement(replyMessages)
    if (content) {
      const message = replaceUsername(content, sourceMessage.nick_name, config.hideUsername)
      void sendMessage(accountId, message, errorHandler) // 注意：这里是异步的，但我们不等待它完成
      return message
    }
  }
  return null
}

function getRandomElement<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined
  const randomIndex = Math.floor(Math.random() * arr.length)
  return arr[randomIndex]
}

async function sendMessage(
  accountId: string,
  content: string,
  errorHandler: ReturnType<typeof useErrorHandler>['handleError'],
) {
  if (!content) return
  try {
    await window.ipcRenderer.invoke(IPC_CHANNELS.tasks.autoReply.sendReply, accountId, content)
  } catch (err) {
    errorHandler(err, '自动发送回复失败')
  }
}

function replaceUsername(content: string, username: string, mask: boolean) {
  if (!content) return ''
  // 把 {用户名} 替换为 username
  const displayedUsername = mask
    ? `${String.fromCodePoint(username.codePointAt(0) ?? 42 /* 42 是星号 */)}***`
    : username
  return content.replace(new RegExp(AUTO_REPLY.USERNAME_PLACEHOLDER, 'g'), displayedUsername)
}

/**
 * 处理关键字回复逻辑
 * @returns 匹配成功时返回发送的内容，否则返回 null
 */
const handleKeywordReply = (
  comment: CommentMessage,
  config: AutoReplyConfig,
  accountId: string,
  errorHandler: ReturnType<typeof useErrorHandler>['handleError'],
): string | null => {
  if (!config.comment.keywordReply.enable || !comment.content) {
    return null
  }

  const rule = config.comment.keywordReply.rules.find(({ keywords }) =>
    keywords.some(kw => comment.content?.includes(kw)),
  )

  if (rule && rule.contents.length > 0) {
    const content = getRandomElement(rule.contents)
    if (content) {
      const message = replaceUsername(content, comment.nick_name, config.hideUsername)
      void sendMessage(accountId, message, errorHandler)
      return message
    }
  }
  return null
}

/**
 * 处理 AI 回复逻辑
 */
const handleAIReply = async (
  accountId: string,
  comment: CommentMessage,
  allComments: Message[],
  allReplies: ReplyPreview[],
  config: AutoReplyConfig,
  {
    provider,
    model,
    apiKey,
    customBaseURL,
  }: {
    provider: AIProvider
    model: string
    apiKey: string
    customBaseURL: string
  },
  onReply: (content: string) => void,
  errorHandler: ReturnType<typeof useErrorHandler>['handleError'],
) => {
  if (!config.comment.aiReply.enable) return

  const { prompt, autoSend } = config.comment.aiReply

  // 筛选与该用户相关的评论和回复
  const userComments = [comment, ...allComments].filter(
    cmt =>
      (cmt.msg_type === 'comment' || cmt.msg_type === 'wechat_channel_live_msg') &&
      cmt.nick_name === comment.nick_name,
  ) as CommentMessage[]
  const userReplies = allReplies.filter(reply => reply.replyFor === comment.nick_name)

  // 生成 AI 请求的消息体
  const plainMessages = generateAIMessages(userComments, userReplies)

  // 构造系统提示
  const systemPrompt = `你将接收到一个或多个 JSON 字符串，每个字符串代表用户的评论，格式为 {"nickname": "用户昵称", "content": "评论内容"}。请分析所有评论，并根据以下要求生成一个回复：\n${prompt}`

  const messages = [
    { role: 'system', content: systemPrompt }, // id 和 timestamp 对请求不重要
    ...plainMessages,
  ]

  try {
    const replyContent = await window.ipcRenderer.invoke(IPC_CHANNELS.tasks.aiChat.normalChat, {
      messages,
      provider,
      model,
      apiKey,
      customBaseURL,
    })

    if (replyContent && typeof replyContent === 'string') {
      onReply(replyContent)
      // 自动发送
      if (autoSend) {
        sendMessage(accountId, replyContent, errorHandler)
      }
    }
  } catch (err) {
    errorHandler(err, 'AI 生成回复失败')
  }
}

const defaultContext = createDefaultContext()

/**
 * 按需订阅当前账号的自动回复状态。只在 getter 返回值变化时重新渲染，
 * 避免每来一条评论就让所有用到自动回复的组件都重新渲染
 */
export function useCurrentAutoReply<T>(getter: (context: AutoReplyContext) => T): T {
  const currentAccountId = useAccounts(state => state.currentAccountId)
  return useAutoReplyStore(
    useShallow(state => getter(state.contexts[currentAccountId] ?? defaultContext)),
  )
}

/** 绑定到当前账号的操作，不订阅任何列表数据 */
export function useAutoReplyActions() {
  const currentAccountId = useAccounts(state => state.currentAccountId)
  return {
    setIsRunning: (running: boolean) =>
      useAutoReplyStore.getState().setIsRunning(currentAccountId, running),
    setIsListening: (listening: ListeningStatus) =>
      useAutoReplyStore.getState().setIsListening(currentAccountId, listening),
  }
}

/** 收到评论后的处理：记录评论并按配置自动回复。状态都从 getState() 现取，不订阅 store */
export function useAutoReplyCommentHandler() {
  const accountName = useCurrentLiveControl(ctx => ctx.accountName)
  const aiStore = useAIProvider('autoReply')
  const { config } = useAutoReplyConfig()
  const { handleError } = useErrorHandler()

  const handleComment = useMemoizedFn((comment: Message, accountId: string) => {
    const store = useAutoReplyStore.getState()
    const currentContext = store.contexts[accountId] || defaultContext
    const { isRunning, comments: allComments, replies: allReplies } = currentContext

    store.addComment(accountId, comment)
    if (!isRunning) {
      return
    }

    const addReply = (replyContent: string, source: ReplySource, sent: boolean) => {
      store.addReply(accountId, {
        commentId: comment.msg_id,
        replyFor: comment.nick_name,
        replyContent,
        source,
        sent,
      })
    }

    ;(function handleReply() {
      if (
        // 如果是主播评论就跳过
        comment.nick_name === accountName ||
        // 在黑名单也跳过
        config.blockList?.includes(comment.nick_name)
      ) {
        return
      }
      switch (comment.msg_type) {
        case 'wechat_channel_live_msg':
        case 'comment': {
          // 优先尝试关键字回复
          const keywordReply = handleKeywordReply(comment, config, accountId, handleError)
          if (keywordReply) {
            addReply(keywordReply, 'keyword', true)
          }
          // 如果关键字未回复，且 AI 回复已启用，则尝试 AI 回复
          if (!keywordReply && config.comment.aiReply.enable) {
            const { provider, model } = aiStore.config
            const apiKey = aiStore.apiKeys[provider]
            const customBaseURL = aiStore.customBaseURL
            handleAIReply(
              accountId,
              comment,
              allComments,
              allReplies,
              config,
              {
                provider,
                model,
                apiKey,
                customBaseURL,
              },
              (replyContent: string) => {
                addReply(replyContent, 'ai', config.comment.aiReply.autoSend)
              },
              handleError,
            )
          }
          break
        }
        case 'live_order': {
          /* 如果设置了仅已支付回复且当前非已支付时不回复 */
          if (!config.live_order.options?.onlyReplyPaid || comment.order_status === '已付款') {
            const content = sendConfiguredReply(accountId, config, comment, handleError)
            if (content) addReply(content, 'event', true)
          }
          break
        }
        default: {
          const content = sendConfiguredReply(accountId, config, comment, handleError)
          if (content) addReply(content, 'event', true)
        }
      }
    })()

    ;(function handlePinComment() {
      // 视频号上墙
      if (comment.msg_type === 'wechat_channel_live_msg' && config.pinComment.enable) {
        if (!config.pinComment.includeHost && comment.nick_name === accountName) {
          return
        }
        const { matchStr } = config.pinComment
        // 把平台表情去掉，表情为 [xx]
        const pureTextContent = comment.content.replace(/\[[^\]]{1,3}\]/g, '')
        if (matchStr.some(str => pureTextContent.includes(str))) {
          window.ipcRenderer.invoke(IPC_CHANNELS.tasks.pinComment, {
            accountId,
            content: pureTextContent,
          })
        }
      }
    })()
  })

  return handleComment
}
