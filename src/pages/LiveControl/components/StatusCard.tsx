import { useMemoizedFn } from 'ahooks'
import { CheckIcon, CircleAlert, GlobeIcon, XIcon } from 'lucide-react'
import React, { useState } from 'react'
import { IPC_CHANNELS } from 'shared/ipcChannels'
import { Divider, SettingRow } from '@/components/common/Layout'
import { StatusDot } from '@/components/common/StatusDot'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useAccounts } from '@/hooks/useAccounts'
import { useCurrentChromeConfig, useCurrentChromeConfigActions } from '@/hooks/useChromeConfig'
import { useCurrentLiveControl, useCurrentLiveControlActions } from '@/hooks/useLiveControl'
import { useToast } from '@/hooks/useToast'
import PlatformSelect, { platformNames } from './PlatformSelect'

const StatusAlert = React.memo(() => {
  const platform = useCurrentLiveControl(state => state.platform)
  if (platform === 'wxchannel') {
    return (
      <Alert>
        <CircleAlert className="h-4 w-4" />
        <AlertTitle>你选择了视频号平台，请注意以下事项：</AlertTitle>
        <AlertDescription>
          <ol className="list-decimal list-inside">
            <li>
              请先确认<strong>开播后</strong>再连接中控台
            </li>
            <li>
              视频号助手无法<strong>一号多登</strong>，在别处登录视频号助手会
              <strong>中断连接</strong>!
            </li>
          </ol>
        </AlertDescription>
      </Alert>
    )
  }
  return null
})

const StatusCard = React.memo(() => {
  return (
    <Card>
      <CardContent className="space-y-5 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <ConnectState />
          <div className="flex items-center gap-2">
            <PlatformSelect />
            <ConnectToLiveControl />
          </div>
        </div>
        <StatusAlert />
        <Divider />
        <HeadlessSetting />
      </CardContent>
    </Card>
  )
})

const ConnectToLiveControl = React.memo(() => {
  const { setIsConnected } = useCurrentLiveControlActions()
  const platform = useCurrentLiveControl(context => context.platform)
  const isConnected = useCurrentLiveControl(context => context.isConnected)
  const chromePath = useCurrentChromeConfig(context => context.path)
  const storageState = useCurrentChromeConfig(context => context.storageState)
  const headless = useCurrentChromeConfig(context => context.headless)
  const account = useAccounts(store => store.getCurrentAccount())

  const { toast } = useToast()

  const connectLiveControl = useMemoizedFn(async () => {
    try {
      if (!account) {
        toast.error('找不到对应账号')
        return
      }
      setIsConnected('connecting')
      const result = await window.ipcRenderer.invoke(IPC_CHANNELS.tasks.liveControl.connect, {
        headless,
        chromePath,
        storageState,
        platform,
        account,
      })

      if (result) {
        setIsConnected('connected')
        toast.success('已连接到直播控制台')
      } else {
        throw new Error('连接直播控制台失败')
      }
    } catch (error) {
      setIsConnected('disconnected')
      toast.error(error instanceof Error ? error.message : '连接直播控制台失败')
    }
  })

  const disconnectLiveControl = useMemoizedFn(async () => {
    if (!account) {
      toast.error('找不到对应账号')
      return
    }
    try {
      await window.ipcRenderer.invoke(IPC_CHANNELS.tasks.liveControl.disconnect, account.id)
      toast.success('已断开连接')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '断开连接失败')
    } finally {
      setIsConnected('disconnected')
    }
  })

  const handleButtonClick = useMemoizedFn(() => {
    if (isConnected === 'connected') {
      disconnectLiveControl()
    } else {
      connectLiveControl()
    }
  })

  return isConnected === 'connected' ? (
    <DisconnectButton handleButtonClick={handleButtonClick} />
  ) : (
    <ConnectButton isLoading={isConnected === 'connecting'} handleButtonClick={handleButtonClick} />
  )
})

const ConnectButton = React.memo(
  ({ isLoading, handleButtonClick }: { isLoading: boolean; handleButtonClick: () => void }) => {
    return (
      <Button onClick={handleButtonClick} disabled={isLoading} className="min-w-32">
        <GlobeIcon />
        {isLoading ? '连接中…' : '连接中控台'}
      </Button>
    )
  },
)

const DisconnectButton = React.memo(({ handleButtonClick }: { handleButtonClick: () => void }) => {
  const [isHovered, setIsHovered] = useState(false)
  return (
    <Button
      variant="outline"
      onClick={handleButtonClick}
      className="min-w-32 hover:border-destructive/30 hover:text-destructive"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered ? (
        <>
          <XIcon />
          断开连接
        </>
      ) : (
        <>
          <CheckIcon className="text-success" />
          已连接
        </>
      )}
    </Button>
  )
})

const ConnectState = React.memo(() => {
  const isConnected = useCurrentLiveControl(context => context.isConnected)
  const accountName = useCurrentLiveControl(context => context.accountName)
  const platform = useCurrentLiveControl(context => context.platform)
  const state = {
    connected: { tone: 'success', text: '已连接' },
    connecting: { tone: 'warning', text: '正在连接' },
    disconnected: { tone: 'idle', text: '未连接' },
  } as const
  const { tone, text } = state[isConnected]
  return (
    <div className="flex min-w-0 items-center gap-3">
      <StatusDot
        tone={tone}
        pulse={isConnected === 'connecting'}
        className="size-2.5 [&>span]:size-2.5"
      />
      <div className="min-w-0">
        <p className="text-base font-semibold leading-6">{text}</p>
        <p className="truncate text-[13px] text-muted-foreground">
          {platformNames[platform]}
          {isConnected === 'connected' && accountName ? ` · ${accountName}` : ''}
          {isConnected === 'disconnected' ? ' · 选择平台后点击连接，首次需要登录' : ''}
        </p>
      </div>
    </div>
  )
})

const HeadlessSetting = () => {
  const headless = useCurrentChromeConfig(context => context.headless ?? false)
  const isConnected = useCurrentLiveControl(context => context.isConnected)
  const { setHeadless } = useCurrentChromeConfigActions()
  return (
    <SettingRow
      label="无头模式"
      description="开启后浏览器在后台运行，不在桌面显示窗口。连接后无法修改"
    >
      <Switch
        checked={headless}
        disabled={isConnected !== 'disconnected'}
        onCheckedChange={v => setHeadless(v)}
      />
    </SettingRow>
  )
}

export default StatusCard
