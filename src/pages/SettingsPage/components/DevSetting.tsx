import { SettingRow } from '@/components/common/Layout'
import { Switch } from '@/components/ui/switch'
import { useDevMode } from '@/hooks/useDevMode'
import { useToast } from '@/hooks/useToast'

export function DevSetting() {
  const { toast } = useToast()
  const { enabled: devMode, setEnabled: setDevMode } = useDevMode()
  const handleToggleDevMode = async (checked: boolean) => {
    try {
      setDevMode(checked)
      toast.success(checked ? '已开启开发者模式' : '已关闭开发者模式')
    } catch {
      toast.error('切换开发者模式失败')
    }
  }
  return (
    <SettingRow label="开发者模式" description="开启后可以右键打开开发者工具">
      <Switch checked={devMode} onCheckedChange={handleToggleDevMode} />
    </SettingRow>
  )
}
