import { useMemo, useState } from 'react'
import { IPC_CHANNELS } from 'shared/ipcChannels'
import { Section } from '@/components/common/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAccounts } from '@/hooks/useAccounts'
import { useAutoMessageActions, useCurrentAutoMessage } from '@/hooks/useAutoMessage'
import { useCurrentLiveControl } from '@/hooks/useLiveControl'

export function MessageOneKey() {
  const [isRunning, setIsRunning] = useState(false)
  const batchCount = useCurrentAutoMessage(ctx => ctx.batchCount ?? 5)
  const { setBatchCount } = useAutoMessageActions()
  const messages = useCurrentAutoMessage(ctx => ctx.config.messages)
  const isConnected = useCurrentLiveControl(ctx => ctx.isConnected)
  const accountId = useAccounts(s => s.currentAccountId)

  const mappedMessages = useMemo(() => messages.map(msg => msg.content), [messages])

  const handleClick = async () => {
    setIsRunning(true)
    await window.ipcRenderer.invoke(
      IPC_CHANNELS.tasks.autoMessage.sendBatchMessages,
      accountId,
      mappedMessages,
      batchCount,
    )
    setIsRunning(false)
  }

  return (
    <Section
      title="一键刷屏"
      description="立即从消息列表中随机挑选，连续发送指定条数的评论"
      action={
        <>
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Input
              type="number"
              value={batchCount}
              onChange={e => setBatchCount(+e.target.value)}
              className="w-20 tabular-nums text-foreground"
              aria-label="刷屏条数"
            />
            <span>条</span>
          </div>
          <Button
            variant="outline"
            onClick={handleClick}
            disabled={isConnected !== 'connected' || isRunning}
          >
            {isRunning ? '发送中…' : '开始刷屏'}
          </Button>
        </>
      }
    />
  )
}
