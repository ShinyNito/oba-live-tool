import type { SettingsDialogSection } from '@/components/common/SettingsDialog'
import MessageListCard from './MessageListCard'
import MessageSettingsCard from './MessageSettingsCard'
import { MessageOneKey } from './MessagesOneKey'

/** 发言设置弹窗的分类 */
export function useMessageSettingsSections(): SettingsDialogSection[] {
  return [
    { id: 'messages', label: '消息列表', content: <MessageListCard /> },
    { id: 'schedule', label: '发送设置', content: <MessageSettingsCard /> },
    { id: 'batch', label: '一键刷屏', content: <MessageOneKey /> },
  ]
}
