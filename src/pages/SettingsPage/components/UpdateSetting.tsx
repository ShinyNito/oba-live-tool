import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Divider, Section, SettingRow } from '@/components/common/Layout'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useUpdateConfigStore, useUpdateStore } from '@/hooks/useUpdate'
import { version } from '../../../../package.json'

export function UpdateSetting() {
  const { enableAutoCheckUpdate, setEnableAutoCheckUpdate } = useUpdateConfigStore()
  const updateStatus = useUpdateStore.use.status()
  const checkUpdateManually = useUpdateStore.use.checkUpdateManually()
  const [isUpToDate, setIsUpToDate] = useState(false)

  const checkUpdate = async () => {
    const result = await checkUpdateManually()
    if (result) {
      setIsUpToDate(result.upToDate)
    }
  }

  return (
    <Section id="update-section" title="更新">
      <SettingRow
        label="当前版本"
        description={<span className="font-mono tabular-nums">v{version}</span>}
      >
        <Button
          variant="outline"
          size="sm"
          disabled={updateStatus === 'checking'}
          onClick={checkUpdate}
        >
          <RefreshCw className={updateStatus === 'checking' ? 'animate-spin' : undefined} />
          {updateStatus === 'checking' ? '检查中…' : isUpToDate ? '已是最新版本' : '检查更新'}
        </Button>
      </SettingRow>
      <Divider />
      <SettingRow label="有新版本时提醒" description="启动时检查更新，弹窗显示新版本的更新内容">
        <Switch checked={enableAutoCheckUpdate} onCheckedChange={setEnableAutoCheckUpdate} />
      </SettingRow>
    </Section>
  )
}
