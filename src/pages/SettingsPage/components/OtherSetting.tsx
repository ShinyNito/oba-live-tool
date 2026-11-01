import { ExternalLinkIcon } from 'lucide-react'
import { IPC_CHANNELS } from 'shared/ipcChannels'
import { Divider, Section, SettingRow } from '@/components/common/Layout'
import { SimpleIconsGithub } from '@/components/icons/simpleIcons'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { performFullCleanup } from '@/utils/storage'
import { DevSetting } from './DevSetting'

export function OtherSetting() {
  const { toast } = useToast()

  const handleOpenLogFolder = async () => {
    await window.ipcRenderer.invoke(IPC_CHANNELS.app.openLogFolder)
  }

  const handleOpenGitHub = async () => {
    await window.ipcRenderer.invoke(
      IPC_CHANNELS.app.openExternal,
      'https://github.com/qiutongxue/oba-live-tool',
    )
  }

  const handleOpenIssues = async () => {
    await window.ipcRenderer.invoke(
      IPC_CHANNELS.app.openExternal,
      'https://github.com/qiutongxue/oba-live-tool/issues',
    )
  }

  const handleCleanupStorage = () => {
    try {
      const cleanedCount = performFullCleanup()
      if (cleanedCount === 0) {
        toast.success('没有发现无效数据')
      } else {
        toast.success(`清理完成，共清理了 ${cleanedCount} 条无效数据`)
      }
    } catch (error) {
      console.error('Storage cleanup failed:', error)
      toast.error(`清理失败:${error}`)
    }
  }

  return (
    <Section title="其他">
      <SettingRow label="运行日志" description="日志文件 main.log 所在的文件夹">
        <Button variant="outline" size="sm" onClick={handleOpenLogFolder}>
          打开文件夹
        </Button>
      </SettingRow>
      <Divider />
      <SettingRow label="清理无效数据" description="删除废弃的存储数据，以及已删除账号遗留的配置">
        <Button variant="outline" size="sm" onClick={handleCleanupStorage}>
          清理
        </Button>
      </SettingRow>
      <Divider />
      <DevSetting />
      <Divider />
      <SettingRow label="关于" description="开源项目，欢迎反馈问题">
        <Button variant="ghost" size="sm" onClick={handleOpenGitHub}>
          <SimpleIconsGithub />
          GitHub
        </Button>
        <Button variant="ghost" size="sm" onClick={handleOpenIssues}>
          反馈问题
          <ExternalLinkIcon className="text-muted-foreground" />
        </Button>
      </SettingRow>
    </Section>
  )
}
