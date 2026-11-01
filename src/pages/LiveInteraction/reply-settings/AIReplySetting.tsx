import { TriangleAlertIcon } from 'lucide-react'
import { useId } from 'react'
import AIModelInfo from '@/components/ai-chat/AIModelInfo'
import { APIKeyDialog } from '@/components/ai-chat/APIKeyDialog'
import { Field, SettingRow } from '@/components/common/Layout'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useAutoReplyConfig } from '@/hooks/useAutoReplyConfig'

export function AIReplySetting() {
  const { config, updateAIReplySettings } = useAutoReplyConfig()
  const { enable, autoSend, prompt } = config.comment.aiReply
  const aiReplyId = useId()
  const autoSendId = useId()
  const promptId = useId()

  return (
    <div className="space-y-5">
      <SettingRow
        label="启用 AI 回复"
        htmlFor={aiReplyId}
        description="用大模型为每条评论生成回复，生成结果显示在回复列表中"
      >
        <Switch
          id={aiReplyId}
          checked={enable}
          onCheckedChange={checked => updateAIReplySettings({ enable: checked })}
        />
      </SettingRow>

      {enable && (
        <>
          <SettingRow
            label="自动发送"
            htmlFor={autoSendId}
            description="关闭时只生成不发送，可在回复列表里悬停后手动发送"
          >
            <Switch
              id={autoSendId}
              checked={autoSend}
              onCheckedChange={checked => updateAIReplySettings({ autoSend: checked })}
            />
          </SettingRow>
          {autoSend && (
            <div className="flex gap-2.5 rounded-lg bg-warning-soft px-3 py-2.5 text-xs leading-relaxed text-warning-ink">
              <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
              <p>
                AI
                生成的回复会直接发到直播间，可能出现答非所问或违反平台规则的内容。建议先关闭自动发送，观察一段时间回复质量再开启。
              </p>
            </div>
          )}

          <Field
            label="提示词"
            htmlFor={promptId}
            hint="告诉 AI 你的商品、语气和回复要求，越具体回复越贴合"
          >
            <Textarea
              id={promptId}
              placeholder="例如：你是一名热情的带货主播助理，回复简短，不超过 30 字……"
              value={prompt}
              onChange={e => updateAIReplySettings({ prompt: e.target.value })}
              className="min-h-28 text-[13px]"
            />
          </Field>

          <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2">
            <AIModelInfo type="autoReply" />
            <APIKeyDialog type="autoReply" />
          </div>
        </>
      )}
    </div>
  )
}
