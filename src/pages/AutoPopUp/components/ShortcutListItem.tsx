import { useMemoizedFn } from 'ahooks'
import { ArrowRightIcon, PencilIcon, PlusIcon, Trash2Icon, X } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Toggle } from '@/components/ui/toggle'
import { type ShortcutMapping, useAutoPopUpActions } from '@/hooks/useAutoPopUp'
import { useOSPlatform } from '@/hooks/useOSPlatform'
import { useToast } from '@/hooks/useToast'

interface ShortcutListItemProps {
  shortcut: ShortcutMapping
  isNew?: boolean
  checkDuplicateKey: (key: string) => boolean
  onSaved?: () => void
  onCancelled?: () => void
}

const PLATFORM_KEY_MAP = {
  win: {
    ctrl: '⌘ Ctrl',
    shift: '⇧ Shift',
    alt: '⌥ Alt',
  },
  mac: {
    ctrl: '⌘ Command',
    shift: '⇧ Shift',
    alt: '⌥ Option',
  },
}

const ShortcutListItem: React.FC<ShortcutListItemProps> = ({
  shortcut,
  isNew,
  checkDuplicateKey,
  onSaved,
  onCancelled,
}) => {
  const { addShortcut, removeShortcut, updateShortcut } = useAutoPopUpActions()
  const [isEditing, setIsEditing] = useState(isNew) // 如果是新建，直接进入编辑模式
  const [isRecordingKey, setIsRecordingKey] = useState(false)
  const [newKey, setNewKey] = useState(shortcut.key)
  const [newGoodsIds, setNewGoodsIds] = useState<number[]>(shortcut.goodsIds)
  const [newGoodsIdInput, setNewGoodsIdInput] = useState('')
  const [ctrlKey, setCtrlKey] = useState(shortcut.ctrl ?? false)
  const [altKey, setAltKey] = useState(shortcut.alt ?? false)
  const [shiftKey, setShiftKey] = useState(shortcut.shift ?? false)
  const { toast } = useToast()
  const osPlatform = useOSPlatform()

  const keyMap = osPlatform === 'MacOS' ? PLATFORM_KEY_MAP.mac : PLATFORM_KEY_MAP.win

  // 开始编辑
  const startEditing = useMemoizedFn(() => {
    setIsEditing(true)
    setNewKey(shortcut.key)
    setNewGoodsIds([...shortcut.goodsIds])
  })

  // 取消编辑
  const cancelEditing = useMemoizedFn(() => {
    setIsEditing(false)
    setIsRecordingKey(false)
    onCancelled?.()
  })

  // 保存编辑
  const saveEditing = useMemoizedFn(() => {
    // 验证快捷键
    if (!newKey) {
      toast.error('快捷键不能为空')
      return
    }

    // 检查快捷键是否重复
    if (checkDuplicateKey(newKey)) {
      toast.error(`快捷键 "${newKey}" 已被使用`)
      return
    }

    if (isNew) {
      addShortcut({
        ...shortcut,
        key: newKey,
        ctrl: ctrlKey,
        alt: altKey,
        shift: shiftKey,
        goodsIds: newGoodsIds,
      })
    } else {
      updateShortcut({
        ...shortcut,
        key: newKey,
        ctrl: ctrlKey,
        alt: altKey,
        shift: shiftKey,
        goodsIds: newGoodsIds,
      })
    }

    setIsEditing(false)
    setIsRecordingKey(false)
    onSaved?.()
  })

  // 删除快捷键
  const deleteShortcut = useMemoizedFn(() => {
    removeShortcut(shortcut.id)
  })

  // 记录快捷键
  const startRecordingKey = useMemoizedFn(() => {
    setIsRecordingKey(true)
  })

  // 处理键盘按下事件
  const handleKeyDown = useMemoizedFn((e: React.KeyboardEvent) => {
    if (!isRecordingKey) return
    e.preventDefault()
    // 禁用 Alt、Shift、Ctrl、Command(Win)
    switch (e.key) {
      case 'Control':
      case 'Alt':
      case 'Shift':
      case 'Meta':
        return
    }
    // 小写转大写
    if ('a' <= e.key && e.key <= 'z') {
      setNewKey(e.key.toUpperCase())
    } else {
      setNewKey(e.key)
    }
    setIsRecordingKey(false)
  })

  // 添加商品ID
  const addGoodsId = useMemoizedFn(() => {
    const goodsId = Number(newGoodsIdInput)
    if (!newGoodsIdInput || Number.isNaN(goodsId) || goodsId < 1) {
      toast.error('请输入有效的商品序号')
      return
    }

    if (newGoodsIds.includes(goodsId)) {
      toast.error('商品序号不能重复')
      return
    }

    setNewGoodsIds([...newGoodsIds, goodsId])
    setNewGoodsIdInput('')
  })

  // 删除商品ID
  const removeGoodsId = useMemoizedFn((goodsIdToRemove: number) => {
    setNewGoodsIds(newGoodsIds.filter(id => id !== goodsIdToRemove))
  })

  // 渲染查看模式
  if (!isEditing) {
    return (
      <div className="group flex items-center gap-4 px-3 py-2.5">
        <KeyCombo
          keys={[
            shortcut.ctrl && keyMap.ctrl,
            shortcut.shift && keyMap.shift,
            shortcut.alt && keyMap.alt,
            shortcut.key,
          ]}
        />
        <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {shortcut.goodsIds.map((id, index) => (
            <GoodsChip
              // oxlint-disable-next-line react/no-array-index-key -- 使用下标不影响
              key={`display-${index}`}
            >
              {id}
            </GoodsChip>
          ))}
          {shortcut.goodsIds.length === 0 && (
            <span className="text-[13px] text-muted-foreground">未设置商品</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={startEditing}
            aria-label="编辑快捷键"
          >
            <PencilIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 hover:text-destructive"
            onClick={deleteShortcut}
            aria-label="删除快捷键"
          >
            <Trash2Icon />
          </Button>
        </div>
      </div>
    )
  }

  // 渲染编辑模式
  return (
    <div className="space-y-4 bg-muted/40 p-4">
      <div className="space-y-2">
        <p className="text-[13px] font-medium">按键</p>
        <div className="flex flex-wrap items-center gap-2">
          <Toggle variant="outline" size="sm" pressed={ctrlKey} onPressedChange={setCtrlKey}>
            {keyMap.ctrl}
          </Toggle>
          <Toggle variant="outline" size="sm" pressed={shiftKey} onPressedChange={setShiftKey}>
            {keyMap.shift}
          </Toggle>
          <Toggle variant="outline" size="sm" pressed={altKey} onPressedChange={setAltKey}>
            {keyMap.alt}
          </Toggle>
          <span className="text-muted-foreground">+</span>
          {isRecordingKey ? (
            <Input
              className="h-8 w-28 border-primary/40"
              placeholder="请按下按键…"
              value={newKey}
              onKeyDown={handleKeyDown}
              onBlur={() => setIsRecordingKey(false)}
              readOnly
              autoFocus
            />
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="min-w-28 font-mono"
              onClick={startRecordingKey}
            >
              {newKey || <span className="font-sans text-muted-foreground">点击录制按键</span>}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[13px] font-medium">切换到的商品</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {newGoodsIds.map(goodsId => (
            <GoodsChip key={`edit-${goodsId}`}>
              {goodsId}
              <button
                type="button"
                className="-mr-1 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-destructive"
                onClick={() => removeGoodsId(goodsId)}
                aria-label={`移除商品 ${goodsId}`}
              >
                <X className="size-3" />
              </button>
            </GoodsChip>
          ))}
          <Input
            type="number"
            placeholder="商品序号"
            className="h-7 w-24 text-[13px]"
            min="1"
            value={newGoodsIdInput}
            onChange={e => setNewGoodsIdInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addGoodsId()
              }
            }}
          />
          <Button type="button" variant="ghost" size="sm" className="h-7" onClick={addGoodsId}>
            <PlusIcon />
            添加
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={cancelEditing}>
          取消
        </Button>
        <Button size="sm" onClick={saveEditing}>
          保存
        </Button>
      </div>
    </div>
  )
}

function KeyCombo({ keys }: { keys: (string | false | undefined)[] }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      {keys.filter(Boolean).map(k => (
        <kbd
          key={k as string}
          className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-b-2 bg-card px-1.5 font-mono text-xs text-foreground"
        >
          {k}
        </kbd>
      ))}
    </div>
  )
}

function GoodsChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-7 items-center gap-1 rounded-md bg-muted px-2 font-mono text-xs tabular-nums">
      {children}
    </span>
  )
}

export default ShortcutListItem
