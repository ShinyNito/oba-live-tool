import { useVirtualizer } from '@tanstack/react-virtual'
import { ArrowDownIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type * as React from 'react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'

/** 距底部多少像素以内视为"在看最新" */
const FOLLOW_THRESHOLD = 24
const LIST_PADDING = 6
const EASE_OUT = [0.16, 1, 0.3, 1] as const

/**
 * 新消息追加在底部的虚拟列表，只渲染可见区域附近的行。
 * 停在底部时自动跟随最新；往上翻看旧消息时保持位置不动，并提示有多少条新消息
 */
export function LiveList<T>({
  items,
  getKey,
  estimateSize,
  renderItem,
  empty,
}: {
  /** 按时间正序，最新的在最后 */
  items: T[]
  getKey: (item: T) => string
  /** 行高估算值，实际高度渲染后测量 */
  estimateSize: (item: T) => number
  renderItem: (item: T) => React.ReactNode
  empty: React.ReactNode
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const latestKey = items.length ? getKey(items[items.length - 1]) : undefined
  const oldestKey = items.length ? getKey(items[0]) : undefined
  /** 离开底部时最新的那条消息；为 null 表示正在跟随最新 */
  const [leftAtKey, setLeftAtKey] = useState<string | null>(null)
  const following = leftAtKey === null
  // 新消息条数 = 离开时那条消息之后又来了几条（被挤出列表上限时按全部算）
  const leftAtIndex = leftAtKey ? items.findIndex(item => getKey(item) === leftAtKey) : -1
  const unseen = leftAtIndex === -1 ? items.length : items.length - 1 - leftAtIndex
  const prevOldestKey = useRef(oldestKey)
  /** 翻看旧消息时，记住视口顶部是哪一条、偏移多少；列表达到上限、顶部旧消息被移除后据此还原 */
  const anchor = useRef<{ key: string; delta: number } | null>(null)
  /**
   * 已经出现过的行。只有真正新到的消息才播放进入动画；
   * 虚拟列表滚动时旧行会重新挂载，它们已在集合里，不会再动
   */
  const [knownKeys] = useState(() => new Set(items.map(getKey)))
  useEffect(() => {
    knownKeys.clear()
    for (const item of items) knownKeys.add(getKey(item))
  }, [items, getKey, knownKeys])

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => viewportRef.current,
    estimateSize: index => estimateSize(items[index]),
    getItemKey: index => getKey(items[index]),
    paddingStart: LIST_PADDING,
    paddingEnd: LIST_PADDING,
    overscan: 8,
  })
  const totalSize = virtualizer.getTotalSize()

  useLayoutEffect(() => {
    const el = viewportRef.current
    const trimmed = oldestKey !== prevOldestKey.current
    prevOldestKey.current = oldestKey
    if (!el) return
    if (following) {
      // 新消息或行高变化（比如评论下挂上回复）都保持贴底
      el.scrollTop = el.scrollHeight
      return
    }
    const saved = anchor.current
    if (!trimmed || !saved) return
    const index = items.findIndex(item => getKey(item) === saved.key)
    const offset = index >= 0 ? virtualizer.getOffsetForIndex(index, 'start')?.[0] : undefined
    if (offset !== undefined) el.scrollTop = offset + saved.delta
  }, [latestKey, oldestKey, totalSize, following, items, getKey, virtualizer])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const atBottom = scrollHeight - scrollTop - clientHeight <= FOLLOW_THRESHOLD
    setLeftAtKey(atBottom ? null : current => current ?? latestKey ?? null)
    const top = virtualizer.getVirtualItemForOffset(scrollTop)
    anchor.current = top ? { key: String(top.key), delta: scrollTop - top.start } : null
  }

  const jumpToLatest = () => {
    // 直接跳到底部：平滑滚动途中的 scroll 事件会把状态又改回"离开底部"
    const el = viewportRef.current
    if (el) el.scrollTop = el.scrollHeight
    setLeftAtKey(null)
  }

  return (
    <div className="relative h-full">
      <ScrollArea
        className="h-full [&>[data-radix-scroll-area-viewport]]:[overflow-anchor:none]"
        viewportRef={viewportRef}
        onViewportScroll={handleScroll}
      >
        {items.length === 0 ? (
          empty
        ) : (
          <div className="relative w-full" style={{ height: totalSize }}>
            {virtualizer.getVirtualItems().map(row => (
              <div
                key={row.key}
                data-index={row.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full"
                style={{ transform: `translateY(${row.start}px)` }}
              >
                {/* initial 只在挂载时生效，之后 knownKeys 变化不会让行重新挂载 */}
                <motion.div
                  initial={
                    knownKeys.has(String(row.key))
                      ? false
                      : { opacity: 0, transform: 'translateY(6px)' }
                  }
                  animate={{ opacity: 1, transform: 'translateY(0px)' }}
                  transition={{ duration: 0.22, ease: EASE_OUT }}
                >
                  {renderItem(items[row.index])}
                </motion.div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      <AnimatePresence>
        {!following && unseen > 0 && (
          <motion.button
            type="button"
            onClick={jumpToLatest}
            initial={{ opacity: 0, transform: 'translateY(8px) scale(0.96)' }}
            animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
            exit={{ opacity: 0, transform: 'translateY(8px) scale(0.96)' }}
            whileTap={{ transform: 'translateY(0px) scale(0.95)' }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-sm"
          >
            <ArrowDownIcon className="size-3.5" />
            {unseen} 条新消息
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
