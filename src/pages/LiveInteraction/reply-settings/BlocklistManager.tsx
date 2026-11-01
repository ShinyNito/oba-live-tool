import { TagInput } from '@/components/common/TagInput'
import { useAutoReplyConfig } from '@/hooks/useAutoReplyConfig'

export function BlocklistManager() {
  const { updateBlockList, config } = useAutoReplyConfig()
  return (
    <TagInput
      value={config.blockList}
      onChange={updateBlockList}
      placeholder="输入观众昵称，回车添加"
    />
  )
}
