import { useMemoizedFn } from 'ahooks'
import { PlusIcon } from 'lucide-react'
import React, { useCallback, useState } from 'react'
import { Divider, Hint, SettingRow } from '@/components/common/Layout'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useAutoPopUpActions, useCurrentAutoPopUp } from '@/hooks/useAutoPopUp'
import ShortcutListItem from './ShortcutListItem'

const ShortcutConfigTab = React.memo(() => {
  const shortcuts = useCurrentAutoPopUp(context => context.shortcuts ?? [])
  const isGlobalShortcut = useCurrentAutoPopUp(ctx => ctx.isGlobalShortcut)
  const { setGlobalShortcut } = useAutoPopUpActions()
  const [isAddingNew, setIsAddingNew] = useState(false)

  // 检查快捷键是否重复
  const checkDuplicateKey = useCallback(
    (key: string, currentId: string): boolean => {
      return shortcuts.some(s => s.key === key && s.id !== currentId)
    },
    [shortcuts],
  )

  // 添加新的快捷键配置
  const addNewShortcut = useMemoizedFn(() => {
    setIsAddingNew(true)
  })

  // 当新快捷键创建完成
  const handleNewShortcutCreated = useMemoizedFn(() => {
    setIsAddingNew(false)
  })

  return (
    <div className="space-y-5">
      <SettingRow
        label="全局快捷键"
        description="开启后，程序在后台时也能触发。建议使用组合键，避免和其他软件冲突"
      >
        <Switch checked={isGlobalShortcut} onCheckedChange={setGlobalShortcut} />
      </SettingRow>
      <Divider />
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <Hint>按下快捷键，弹窗商品列表会切换为对应的商品</Hint>
          <Button variant="outline" size="sm" onClick={addNewShortcut} disabled={isAddingNew}>
            <PlusIcon />
            添加快捷键
          </Button>
        </div>

        <div className="divide-y overflow-hidden rounded-lg border">
          {isAddingNew && (
            <ShortcutListItem
              shortcut={{ id: crypto.randomUUID(), key: '', goodsIds: [] }}
              isNew
              checkDuplicateKey={key => checkDuplicateKey(key, '')}
              onSaved={handleNewShortcutCreated}
              onCancelled={handleNewShortcutCreated}
            />
          )}
          {shortcuts.map(shortcut => (
            <ShortcutListItem
              key={`shortcut-${shortcut.id}`}
              shortcut={shortcut}
              checkDuplicateKey={key => checkDuplicateKey(key, shortcut.id)}
            />
          ))}
          {shortcuts.length === 0 && !isAddingNew && (
            <p className="px-3 py-8 text-center text-[13px] text-muted-foreground">
              还没有快捷键，点击右上角添加
            </p>
          )}
        </div>
      </div>
    </div>
  )
})

export default ShortcutConfigTab
