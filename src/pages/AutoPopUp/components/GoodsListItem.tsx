import { TrashIcon } from 'lucide-react'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/** 商品列表的列宽，表头和每一行共用 */
export const GOODS_GRID = 'grid grid-cols-[5.5rem_8rem_1fr_2rem] items-center gap-3 px-3'

interface GoodsItemData {
  id: number
  repeatCount?: number
  itemInterval?: [number, number]
}

// 商品列表项组件
const GoodsListItem = React.memo(function GoodsListItem({
  item,
  index,
  onChangeId,
  onChangeRepeatCount,
  onChangeItemInterval,
  onDelete,
}: {
  item: GoodsItemData
  index: number
  onChangeId: (index: number, value: string) => void
  onChangeRepeatCount: (index: number, value: number) => void
  onChangeItemInterval: (index: number, min: number, max: number) => void
  onDelete: () => void
}) {
  const repeatCount = item.repeatCount ?? 1
  const intervalMin = item.itemInterval ? item.itemInterval[0] / 1000 : 0
  const intervalMax = item.itemInterval ? item.itemInterval[1] / 1000 : 0

  return (
    <div className={cn(GOODS_GRID, 'group py-2')}>
      <Input
        type="number"
        value={item.id}
        onChange={e => onChangeId(index, e.target.value)}
        className="h-8 tabular-nums"
        min="1"
        aria-label="商品序号"
      />
      <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <Input
          type="number"
          value={repeatCount}
          onChange={e => onChangeRepeatCount(index, Number(e.target.value) || 1)}
          className="h-8 tabular-nums text-foreground"
          min="1"
          max="10000"
          aria-label="循环弹窗次数"
        />
        <span>次</span>
      </div>
      <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <Input
          type="number"
          value={intervalMin}
          onChange={e => onChangeItemInterval(index, Number(e.target.value) || 0, intervalMax)}
          className="h-8 w-20 tabular-nums text-foreground"
          min="0"
          max="20000"
          aria-label="单品弹窗间隔最小值（秒）"
        />
        <span>至</span>
        <Input
          type="number"
          value={intervalMax}
          onChange={e => onChangeItemInterval(index, intervalMin, Number(e.target.value) || 0)}
          className="h-8 w-20 tabular-nums text-foreground"
          min="0"
          max="20000"
          aria-label="单品弹窗间隔最大值（秒）"
        />
        <span>秒</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        aria-label="删除商品"
        className="size-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
      >
        <TrashIcon />
      </Button>
    </div>
  )
})

export default GoodsListItem
