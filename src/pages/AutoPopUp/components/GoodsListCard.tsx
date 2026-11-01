import { useMemoizedFn } from 'ahooks'
import { PlusIcon } from 'lucide-react'
import React from 'react'
import { Hint } from '@/components/common/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAutoPopUpActions, useCurrentAutoPopUp } from '@/hooks/useAutoPopUp'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import GoodsListItem, { GOODS_GRID } from './GoodsListItem'
import ShortcutConfigTab from './ShortcutConfigTab'

const CommonList = () => {
  const goodsIds = useCurrentAutoPopUp(context => context.config.goodsIds)
  const goodsItems = useCurrentAutoPopUp(context => context.config.goodsItems)
  const { setGoodsIds, setGoodsItems } = useAutoPopUpActions()
  const { toast } = useToast()

  // 合并 goodsItems 和 goodsIds：以 goodsItems 为主，goodsIds 作为兼容
  const items = React.useMemo(() => {
    if (goodsItems && goodsItems.length > 0) return goodsItems
    return goodsIds.map(id => ({ id, repeatCount: 1, itemInterval: undefined }))
  }, [goodsItems, goodsIds])

  // 同步更新 goodsIds 和 goodsItems
  const syncUpdate = useMemoizedFn((newItems: typeof items) => {
    setGoodsItems(newItems)
    setGoodsIds(newItems.map(item => item.id))
  })

  const handleGoodsIdChange = useMemoizedFn((index: number, value: string) => {
    const numValue = Number(value)
    if (Number.isNaN(numValue) || numValue < 1) {
      toast.error('请输入有效的商品序号')
      return
    }
    if (items.some((item, i) => item.id === numValue && i !== index)) {
      toast.error('商品序号不能重复！')
      return
    }
    const newItems = items.map((item, i) => (i === index ? { ...item, id: numValue } : item))
    syncUpdate(newItems)
  })

  const handleRepeatCountChange = useMemoizedFn((index: number, value: number) => {
    const count = Math.max(1, Math.min(Math.floor(value), 10000))
    const newItems = items.map((item, i) => (i === index ? { ...item, repeatCount: count } : item))
    syncUpdate(newItems)
  })

  const handleItemIntervalChange = useMemoizedFn((index: number, min: number, max: number) => {
    const minMs = Math.max(0, Math.floor(min)) * 1000
    const maxMs = Math.max(0, Math.floor(max)) * 1000
    const newItems = items.map((item, i) =>
      i === index
        ? {
            ...item,
            itemInterval:
              minMs === 0 && maxMs === 0 ? undefined : ([minMs, maxMs] as [number, number]),
          }
        : item,
    )
    syncUpdate(newItems)
  })

  const addGoodsId = useMemoizedFn(() => {
    let id = 1
    while (items.some(item => item.id === id)) id += 1
    syncUpdate([...items, { id, repeatCount: 1, itemInterval: undefined }])
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <Hint>按顺序循环弹出商品。单品间隔填 0 表示使用下方的全局弹窗间隔</Hint>
        <Button variant="outline" size="sm" onClick={addGoodsId} className="shrink-0">
          <PlusIcon />
          添加商品
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div className={cn(GOODS_GRID, 'h-8 bg-muted/60 text-xs text-muted-foreground')}>
          <span>商品序号</span>
          <span>循环次数</span>
          <span>单品间隔</span>
          <span />
        </div>
        <div className="divide-y">
          {items.length === 0 && (
            <p className="px-3 py-6 text-center text-[13px] text-muted-foreground">
              还没有商品，点击"添加商品"开始配置
            </p>
          )}
          {items.map((item, index) => (
            <GoodsListItem
              // oxlint-disable-next-line react/no-array-index-key -- 下标不影响
              key={index}
              item={item}
              index={index}
              onChangeId={handleGoodsIdChange}
              onChangeRepeatCount={handleRepeatCountChange}
              onChangeItemInterval={handleItemIntervalChange}
              onDelete={() => {
                syncUpdate(items.filter((_, i) => i !== index))
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// 商品列表卡片组件
const GoodsListCard = React.memo(() => {
  return (
    <Card>
      <Tabs defaultValue="goods-list">
        <CardHeader className="pb-4">
          <TabsList>
            <TabsTrigger value="goods-list" className="px-4">
              商品列表
            </TabsTrigger>
            <TabsTrigger value="shortcuts" className="px-4">
              快捷键
            </TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent>
          <TabsContent value="goods-list" className="mt-0">
            <CommonList />
          </TabsContent>
          <TabsContent value="shortcuts" className="mt-0">
            <ShortcutConfigTab />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  )
})

export default GoodsListCard
