import { IPC_CHANNELS } from 'shared/ipcChannels'
import { useAccounts } from '@/hooks/useAccounts'
import { useAutoReplyActions } from '@/hooks/useAutoReply'
import { useAutoReplyConfig } from '@/hooks/useAutoReplyConfig'
import { useCurrentLiveControl } from '@/hooks/useLiveControl'
import { useToast } from '@/hooks/useToast'

/** 开始/停止监听评论。工具栏和"开启自动回复"共用 */
export function useCommentListenerControl() {
  const { setIsListening } = useAutoReplyActions()
  const { config } = useAutoReplyConfig()
  const isConnected = useCurrentLiveControl(context => context.isConnected)
  const { toast } = useToast()
  const { currentAccountId } = useAccounts()

  const startListening = async () => {
    if (isConnected !== 'connected') {
      toast.error('请先连接直播间')
      return
    }

    try {
      setIsListening('waiting')
      const result = await window.ipcRenderer.invoke(
        IPC_CHANNELS.tasks.autoReply.startCommentListener,
        currentAccountId,
        {
          source: config.entry,
          ws: config.ws?.enable ? { port: config.ws.port } : undefined,
        },
      )
      if (!result) throw new Error('监听评论失败')
      toast.success('监听评论成功')
      setIsListening('listening')
    } catch (_error) {
      setIsListening('error')
      toast.error('监听评论失败')
    }
  }

  // 手动停止监听评论
  const stopListening = async () => {
    try {
      await window.ipcRenderer.invoke(
        IPC_CHANNELS.tasks.autoReply.stopCommentListener,
        currentAccountId,
      )
      setIsListening('stopped')
      toast.success('已停止监听评论')
    } catch (_error) {
      toast.error('停止监听评论失败')
    }
  }

  return { startListening, stopListening }
}
