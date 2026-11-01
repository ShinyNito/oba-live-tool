import { useMemoizedFn } from 'ahooks'
import { useState } from 'react'
import { IPC_CHANNELS } from 'shared/ipcChannels'
import { Section, SettingRow } from '@/components/common/Layout'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useAccounts } from '@/hooks/useAccounts'
import { useCurrentLiveControl } from '@/hooks/useLiveControl'
import { useToast } from '@/hooks/useToast'

export function AccountSetting() {
  const { accounts, removeAccount, currentAccountId } = useAccounts()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { toast } = useToast()
  const isConnected = useCurrentLiveControl(context => context.isConnected)
  const currentAccount = accounts.find(acc => acc.id === currentAccountId)
  const handleDeleteAccount = useMemoizedFn(async () => {
    if (currentAccountId === 'default') return
    // 先断开连接
    if (isConnected === 'connected') {
      await window.ipcRenderer.invoke(IPC_CHANNELS.tasks.liveControl.disconnect, currentAccountId)
    }
    removeAccount(currentAccountId)
    setIsDeleteDialogOpen(false)
    toast.success('删除账号成功')
  })

  const isDefault = currentAccountId === 'default'
  const blockedReason = isDefault
    ? '默认账号不能删除'
    : isConnected !== 'disconnected'
      ? '请先断开中控台连接'
      : null

  return (
    <Section title="账号">
      <SettingRow
        label={`删除「${currentAccount?.name ?? ''}」`}
        description={blockedReason ?? '只删除本工具里的账号配置，不影响直播平台上的账号'}
      >
        <Button
          variant="outline"
          size="sm"
          className="hover:border-destructive/30 hover:text-destructive"
          disabled={!!blockedReason}
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          删除账号
        </Button>
      </SettingRow>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除账号「{currentAccount?.name}」？</AlertDialogTitle>
            <AlertDialogDescription>
              该账号的所有配置都会被删除。请先确认该账号的任务都已停止。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Section>
  )
}
