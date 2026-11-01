import { useId } from 'react'
import { SettingRow, Token } from '@/components/common/Layout'
import ValidatedNumberInput from '@/components/common/ValidateNumberInput'
import { Switch } from '@/components/ui/switch'
import { useAutoReplyConfig } from '@/hooks/useAutoReplyConfig'

export function WebSocketSetting() {
  const { config, updateWSConfig } = useAutoReplyConfig()
  const enableId = useId()
  const portId = useId()
  const port = config.ws?.port ?? 12354
  return (
    <div className="space-y-5">
      <SettingRow
        label="启用 WebSocket 服务"
        htmlFor={enableId}
        description="开始监听评论时，同步启动本地服务，每条新消息以 JSON 推送给已连接的客户端"
      >
        <Switch
          id={enableId}
          checked={!!config.ws?.enable}
          onCheckedChange={checked => updateWSConfig({ enable: checked })}
        />
      </SettingRow>
      {config.ws?.enable && (
        <SettingRow
          label="端口"
          htmlFor={portId}
          description={
            <>
              客户端连接地址 <Token>ws://localhost:{port}</Token>
            </>
          }
        >
          <ValidatedNumberInput
            id={portId}
            className="w-24 tabular-nums"
            type="number"
            placeholder="12354"
            min={2000}
            max={65535}
            value={port}
            onCommit={value => updateWSConfig({ port: value })}
          />
        </SettingRow>
      )}
    </div>
  )
}
