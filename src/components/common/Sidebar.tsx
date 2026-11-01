import { motion } from 'motion/react'
import { NavLink } from 'react-router'
import { useCurrentAutoMessage } from '@/hooks/useAutoMessage'
import { useCurrentAutoPopUp } from '@/hooks/useAutoPopUp'
import { useCurrentAutoReply } from '@/hooks/useAutoReply'
import { useCurrentLiveControl } from '@/hooks/useLiveControl'
import { cn } from '@/lib/utils'
import { platformNames } from '@/pages/LiveControl/components/PlatformSelect'
import {
  CarbonBlockStorage,
  CarbonChat,
  CarbonContentDeliveryNetwork,
  CarbonIbmWatsonTextToSpeech,
  CarbonSettings,
} from '../icons/carbon'
import { AccountSwitcher } from './AccountSwitcher'
import { StatusDot } from './StatusDot'

interface SidebarTab {
  id: string
  name: string
  isRunning?: boolean
  icon: React.ReactNode
  platform?: LiveControlPlatform[]
  hidden?: boolean
}

const connectionLabel = {
  connected: { text: '已连接', tone: 'success', pulse: false },
  connecting: { text: '连接中', tone: 'warning', pulse: true },
  disconnected: { text: '未连接', tone: 'idle', pulse: false },
} as const

function NavItem({ tab }: { tab: SidebarTab }) {
  return (
    <NavLink
      to={tab.id}
      className={({ isActive }) =>
        cn(
          'relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-[color,background-color,scale] duration-150 ease-out active:scale-[0.98] [&_svg]:size-4 [&_svg]:shrink-0',
          isActive
            ? 'text-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* 选中背景在导航项之间滑动，而不是原地闪现 */}
          {isActive && (
            <motion.span
              layoutId="sidebar-active"
              className="absolute inset-0 rounded-lg bg-card shadow-[0_1px_2px_oklch(0_0_0/0.06)] ring-1 ring-border"
              transition={{ type: 'spring', bounce: 0, visualDuration: 0.25 }}
            />
          )}
          <span className="relative flex min-w-0 flex-1 items-center gap-2.5">
            {tab.icon}
            <span className="flex-1 truncate">{tab.name}</span>
            {tab.isRunning && <StatusDot tone="live" pulse />}
          </span>
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  const isAutoMessageRunning = useCurrentAutoMessage(context => context.isRunning)
  const isAutoPopupRunning = useCurrentAutoPopUp(context => context.isRunning)
  const isAutoReplyRunning = useCurrentAutoReply(context => context.isRunning)
  const platform = useCurrentLiveControl(context => context.platform)
  const isConnected = useCurrentLiveControl(context => context.isConnected)
  const accountName = useCurrentLiveControl(context => context.accountName)

  const tabs: SidebarTab[] = [
    {
      id: '/',
      name: '中控台',
      icon: <CarbonContentDeliveryNetwork />,
    },
    {
      id: '/auto-popup',
      name: '自动弹窗',
      isRunning: isAutoPopupRunning,
      icon: <CarbonBlockStorage />,
      // 暂时隐藏入口，页面和路由保留
      hidden: true,
    },
    {
      id: '/interaction',
      name: '直播互动',
      isRunning: isAutoReplyRunning || isAutoMessageRunning,
      icon: <CarbonChat />,
    },
    {
      id: '/ai-chat',
      name: 'AI 助手',
      icon: <CarbonIbmWatsonTextToSpeech />,
    },
  ]

  const filteredTabs = tabs.filter(
    tab => !tab.hidden && (!tab.platform || tab.platform.includes(platform)),
  )
  const connection = connectionLabel[isConnected]

  return (
    <aside className="flex w-52 shrink-0 flex-col border-r bg-sidebar">
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <img
          src={`${import.meta.env.BASE_URL}favicon.png`}
          alt=""
          width={20}
          height={20}
          className="size-5"
        />
        <span className="text-[15px] font-semibold tracking-[-0.01em]">直播助手</span>
      </div>

      <div className="space-y-1 px-2">
        <AccountSwitcher />
        <NavLink
          to="/"
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-sidebar-accent"
        >
          <StatusDot tone={connection.tone} pulse={connection.pulse} />
          <span className="min-w-0 leading-tight">
            <span className="block text-[13px] font-medium">{connection.text}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {platformNames[platform]}
              {isConnected === 'connected' && accountName ? ` · ${accountName}` : ''}
            </span>
          </span>
        </NavLink>
      </div>

      <div className="mx-4 my-2 h-px bg-border" />

      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {filteredTabs.map(tab => (
          <NavItem key={tab.id} tab={tab} />
        ))}
      </nav>

      <div className="px-2 pb-3">
        <NavItem tab={{ id: '/settings', name: '设置', icon: <CarbonSettings /> }} />
      </div>
    </aside>
  )
}
