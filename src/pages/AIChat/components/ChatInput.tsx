import { useMemoizedFn } from 'ahooks'
import { SendIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAIChatStore } from '@/hooks/useAIChat'
import { useAIProvider } from '@/hooks/useAIProvider'
import { useToast } from '@/hooks/useToast'
import { messagesToContext } from '@/lib/utils'

export default function ChatInput({
  onSubmit,
}: {
  onSubmit: (messages: { role: string; content: string }[]) => void
}) {
  const [input, setInput] = useState('')
  const { status, addMessage, messages } = useAIChatStore()
  const { toast } = useToast()

  // 从 useAIProvider 获取配置
  const { config, apiKeys } = useAIProvider('chat')

  const handleSubmit = useMemoizedFn(async () => {
    if (!apiKeys[config.provider]) {
      toast.error('请先配置 API Key')
      return
    }
    if (!input.trim() || status !== 'ready') return

    const userMessage = input.trim()
    setInput('')
    addMessage({ role: 'user', content: userMessage })
    const contextMessages = messagesToContext(messages, userMessage)
    onSubmit(contextMessages)
  })

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <>
      <Textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="输入消息，Enter 发送，Shift + Enter 换行"
        className="max-h-[200px] min-h-[56px] flex-1 resize-none"
        rows={2}
      />
      <Button
        size="icon"
        className="h-auto w-12 self-stretch"
        aria-label="发送"
        onClick={handleSubmit}
        disabled={!input.trim() || status !== 'ready'}
      >
        <SendIcon />
      </Button>
    </>
  )
}
