import { TrashIcon } from 'lucide-react'
import { APIKeyDialog } from '@/components/ai-chat/APIKeyDialog'
import { Title } from '@/components/common/Title'
import { Button } from '@/components/ui/button'
import { useAIChatStore } from '@/hooks/useAIChat'
import ChatBox from './components/ChatBox'

export default function AIChat() {
  const { messages, clearMessages } = useAIChatStore()

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <Title title="AI 助手" description="与 AI 助手对话，写话术、改文案、问运营问题" />
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            disabled={messages.length === 0}
            className="text-muted-foreground hover:text-destructive"
          >
            <TrashIcon />
            清空对话
          </Button>
          <APIKeyDialog />
        </div>
      </div>

      <ChatBox />
    </div>
  )
}
