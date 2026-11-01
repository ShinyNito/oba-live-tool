import { FolderOpenIcon, ScanSearchIcon } from 'lucide-react'
import { useId, useState } from 'react'
import { IPC_CHANNELS } from 'shared/ipcChannels'
import { Divider, Field, Section, SettingRow, Token } from '@/components/common/Layout'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useCurrentChromeConfig, useCurrentChromeConfigActions } from '@/hooks/useChromeConfig'
import { useToast } from '@/hooks/useToast'

export function BrowserSetting() {
  const path = useCurrentChromeConfig(context => context.path)
  const { setPath, setStorageState } = useCurrentChromeConfigActions()
  const [isDetecting, setIsDetecting] = useState(false)
  const [edgeFirst, setEdgeFirst] = useState(false)
  const { toast } = useToast()

  const handleCookiesReset = () => {
    setStorageState('')
    toast.success('登录状态已重置')
  }

  const handleSelectChrome = async () => {
    try {
      const path = await window.ipcRenderer.invoke(IPC_CHANNELS.chrome.selectPath)
      if (path) {
        setPath(path)

        toast.success('Chrome 路径设置成功')
      }
    } catch {
      toast.error('选择 Chrome 路径失败')
    }
  }

  const handleAutoDetect = async () => {
    try {
      setIsDetecting(true)
      const result = await window.ipcRenderer.invoke(IPC_CHANNELS.chrome.getPath, edgeFirst)
      if (result) {
        setPath(result)

        toast.success('已自动检测到路径')
      } else {
        toast.error('未检测到 Chrome，请确保 Chrome 已打开')
      }
    } catch {
      toast.error('检测 Chrome 路径失败')
    } finally {
      setIsDetecting(false)
    }
  }

  const edgeFirstId = useId()

  return (
    <Section title="浏览器" description="连接中控台时使用的 Chrome 或 Edge">
      <Field
        label="浏览器路径"
        hint={
          <>
            选择 <Token>chrome.exe</Token> 或 <Token>msedge.exe</Token>
            。也可以先打开浏览器，再点"自动检测"
          </>
        }
      >
        <div className="flex gap-2">
          <Input
            value={path}
            onChange={e => setPath(e.target.value)}
            placeholder="未设置"
            className="font-mono text-[13px]"
          />
          <Button variant="outline" onClick={handleSelectChrome}>
            <FolderOpenIcon />
            浏览
          </Button>
          <Button variant="outline" onClick={handleAutoDetect} disabled={isDetecting}>
            <ScanSearchIcon />
            {isDetecting ? '检测中…' : '自动检测'}
          </Button>
        </div>
      </Field>
      <SettingRow label="自动检测时优先 Edge" htmlFor={edgeFirstId}>
        <Switch id={edgeFirstId} checked={edgeFirst} onCheckedChange={setEdgeFirst} />
      </SettingRow>
      <Divider />
      <SettingRow
        label="重置登录状态"
        description="清除当前账号保存的登录信息，下次连接需要重新登录"
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="hover:border-destructive/30 hover:text-destructive"
            >
              重置
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>重置登录状态？</AlertDialogTitle>
              <AlertDialogDescription>
                将清除已保存的登录信息，下次连接中控台时需要重新登录。此操作无法撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCookiesReset}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                确认重置
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SettingRow>
    </Section>
  )
}
