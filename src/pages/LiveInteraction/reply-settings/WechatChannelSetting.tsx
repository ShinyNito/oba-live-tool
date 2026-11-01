import { useId } from 'react'
import { Field, SettingRow } from '@/components/common/Layout'
import { TagInput } from '@/components/common/TagInput'
import { Switch } from '@/components/ui/switch'
import { useAutoReplyConfig } from '@/hooks/useAutoReplyConfig'

export function WechatChannelSetting() {
  const { config, updatePinCommentConfig } = useAutoReplyConfig()
  const { pinComment } = config
  const enableId = useId()
  const hostId = useId()

  return (
    <div className="space-y-5">
      <SettingRow
        label="评论上墙"
        htmlFor={enableId}
        description="匹配到关键词的最新一条评论会被上墙，每 10 秒检查一次"
      >
        <Switch
          id={enableId}
          checked={pinComment.enable}
          onCheckedChange={checked => updatePinCommentConfig({ enable: checked })}
        />
      </SettingRow>
      {pinComment.enable && (
        <>
          <Field label="上墙关键词">
            <TagInput
              value={pinComment.matchStr}
              onChange={matchStr => updatePinCommentConfig({ matchStr })}
              placeholder="输入关键词，回车添加"
            />
          </Field>
          <SettingRow label="包含主播的评论" htmlFor={hostId}>
            <Switch
              id={hostId}
              checked={pinComment.includeHost}
              onCheckedChange={checked => updatePinCommentConfig({ includeHost: checked })}
            />
          </SettingRow>
        </>
      )}
    </div>
  )
}
