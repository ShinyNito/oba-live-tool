import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { Title } from '@/components/common/Title'
import { AccountSetting } from '@/pages/SettingsPage/components/AccountSetting'
import { BrowserSetting } from '@/pages/SettingsPage/components/BrowserSetting'
import { OtherSetting } from '@/pages/SettingsPage/components/OtherSetting'
import { UpdateSetting } from '@/pages/SettingsPage/components/UpdateSetting'

export default function Settings() {
  const location = useLocation()

  // 处理锚点定位（因为是路由是 Hash 模式，无法自动处理锚点定位）
  useEffect(() => {
    const hash = location.hash
    if (hash) {
      const el = document.querySelector(hash)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      }
    }
  })
  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <Title title="设置" description="浏览器、账号和软件更新" />
      <BrowserSetting />
      <AccountSetting />
      <UpdateSetting />
      <OtherSetting />
    </div>
  )
}
