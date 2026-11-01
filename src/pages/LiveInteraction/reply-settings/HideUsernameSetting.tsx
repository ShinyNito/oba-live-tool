import { useId } from 'react'
import { SettingRow, Token } from '@/components/common/Layout'
import { Switch } from '@/components/ui/switch'
import { useAutoReplyConfig } from '@/hooks/useAutoReplyConfig'

export function HideUsernameSetting() {
  const { config, updateGeneralSettings } = useAutoReplyConfig()
  const id = useId()

  return (
    <SettingRow
      label="隐藏用户名"
      htmlFor={id}
      description={
        <>
          回复里的 <Token>{'{用户名}'}</Token> 会替换为观众昵称。开启后只保留第一个字，如{' '}
          <Token>张三</Token> → <Token>张***</Token>
        </>
      }
    >
      <Switch
        id={id}
        checked={config.hideUsername}
        onCheckedChange={checked => updateGeneralSettings({ hideUsername: checked })}
      />
    </SettingRow>
  )
}
