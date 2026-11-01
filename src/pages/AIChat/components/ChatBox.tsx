import { useDebounceEffect, useEventListener, useMemoizedFn } from 'ahooks'
import React, { useEffect, useRef } from 'react'
import { IPC_CHANNELS } from 'shared/ipcChannels'
import AIModelInfo from '@/components/ai-chat/AIModelInfo'
import { LoadingIcon } from '@/components/icons/loading'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { type ChatMessage, useAIChatStore } from '@/hooks/useAIChat'
import { useAIProvider } from '@/hooks/useAIProvider'
import ChatInput from './ChatInput'
import { Message } from './Message'

interface ContextMessage {
  role: string
  content: string
}

const useChatMessaging = () => {
  const {
    status,
    setStatus,
    addMessage,
    appendToChat,
    appendToReasoning,
    tryToHandleEmptyMessage,
    autoScroll,
    setAutoScroll,
  } = useAIChatStore()

  // 从 useAIProvider 获取配置
  const { config, apiKeys, customBaseURL } = useAIProvider('chat')

  useEventListener('wheel', ev => {
    if (ev.deltaY < 0 && autoScroll && status === 'replying') {
      setAutoScroll(false)
    }
  })

  const handleStreamMessage = useMemoizedFn(
    ({
      chunk,
      type,
    }: {
      chunk: string
      type: string // content | reasoning
    }) => {
      setStatus('replying')
      if (type === 'content') {
        appendToChat(chunk)
      } else if (type === 'reasoning') {
        appendToReasoning(chunk)
      }
    },
  )

  const sendMessage = useMemoizedFn(async (messages: ContextMessage[]) => {
    setAutoScroll(true)
    return new Promise<void>((resolve, reject) => {
      setStatus('waiting')

      const removeStreamListener = window.ipcRenderer.on(
        IPC_CHANNELS.tasks.aiChat.stream,
        result => {
          if ('done' in result && result.done) {
            cleanup()
            resolve()
          } else if ('chunk' in result && result.chunk) {
            handleStreamMessage({ chunk: result.chunk, type: result.type })
          }
        },
      )

      const removeErrorHandler = window.ipcRenderer.on(
        IPC_CHANNELS.tasks.aiChat.error,
        ({ error }) => {
          cleanup()
          reject(error)
        },
      )

      const cleanup = () => {
        removeStreamListener()
        removeErrorHandler()
      }

      window.ipcRenderer
        .invoke(IPC_CHANNELS.tasks.aiChat.chat, {
          messages,
          apiKey: apiKeys[config.provider],
          provider: config.provider,
          model: config.model,
          customBaseURL: customBaseURL,
        })
        .catch(error => {
          cleanup()
          reject(error)
        })
    })
      .catch(error => {
        addMessage({ role: 'assistant', content: error, isError: true })
      })
      .finally(() => {
        tryToHandleEmptyMessage('可能是网络请求超时，也可能是接收到了空数据')
        setStatus('ready')
      })
  })

  return {
    status,
    sendMessage,
  }
}

const useScrollToBottom = (messages: ContextMessage[]) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const autoScroll = useAIChatStore(state => state.autoScroll)

  useEventListener(
    'scroll',
    () => {
      if (viewportRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = viewportRef.current
        if (scrollHeight - scrollTop - clientHeight < 5) {
          useAIChatStore.getState().setAutoScroll(true)
        }
      }
    },
    { target: viewportRef },
  )

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (viewport instanceof HTMLDivElement) {
        ;(viewportRef as { current: HTMLDivElement }).current = viewport
      }
    }
  }, [])

  useDebounceEffect(
    () => {
      if (viewportRef.current && autoScroll) {
        const scrollContainer = viewportRef.current
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    },
    [messages, autoScroll],
    { wait: 1, leading: true, trailing: true },
  )

  return { scrollAreaRef }
}

const MessageList = React.memo(
  ({
    messages,
    status,
    onRetry,
  }: {
    messages: ChatMessage[]
    status: string
    onRetry: (messages: { role: string; content: string }[]) => Promise<void>
  }) => (
    <div className="space-y-6 min-h-[100px]">
      {messages.map(message => (
        <Message key={message.id} {...message} onRetry={onRetry} />
      ))}
      {status === 'waiting' && (
        <div className="flex justify-start">
          <LoadingIcon size="sm" />
        </div>
      )}
    </div>
  ),
)

export default function ChatBox() {
  const messages = useAIChatStore(state => state.messages)
  const { status, sendMessage } = useChatMessaging()
  const { scrollAreaRef } = useScrollToBottom(messages)

  return (
    <Card className="flex min-h-80 flex-1 flex-col overflow-hidden">
      <ScrollArea ref={scrollAreaRef} className="min-h-0 flex-1 px-6 py-5">
        {messages.length === 0 ? (
          <div className="flex flex-col items-start gap-1 py-6">
            <p className="text-[15px] font-medium">还没有对话</p>
            <p className="text-[13px] text-muted-foreground">
              可以让 AI 帮你写开场话术、整理商品卖点，或者给评论回复出主意。
            </p>
          </div>
        ) : (
          <MessageList messages={messages} status={status} onRetry={sendMessage} />
        )}
      </ScrollArea>

      <div className="space-y-2 border-t bg-muted/40 p-3">
        <AIModelInfo />
        <div className="flex items-stretch gap-2">
          <ChatInput onSubmit={sendMessage} />
        </div>
      </div>
    </Card>
  )
}
