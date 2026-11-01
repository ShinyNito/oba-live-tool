import pick from 'lodash-es/pick'
import { FilterIcon, FunnelPlusIcon, PlusIcon, Trash2Icon, X } from 'lucide-react'
import { useState } from 'react'
import { Hint, SettingRow, Token } from '@/components/common/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { EventMessageType, MessageOf } from '@/hooks/useAutoReply'
import { type SimpleEventReplyMessage, useAutoReplyConfig } from '@/hooks/useAutoReplyConfig'
import { useCurrentLiveControl } from '@/hooks/useLiveControl'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import type { StringFilter, StringFilterConfig } from '@/utils/filter'

// 自动回复类型
const autoReplyTypes = [
  {
    id: 'room_enter',
    name: '进入直播间',
    default: '@{用户名} 欢迎来到直播间，感谢支持！',
  },
  {
    id: 'room_like',
    name: '点赞直播间',
    default: '谢谢{用户名}的点赞，爱你哟~',
  },
  {
    id: 'room_follow',
    name: '关注直播间',
    default: '感谢{用户名}的关注，我们会带来更多精彩内容！',
  },
  {
    id: 'subscribe_merchant_brand_vip',
    name: '加入品牌会员',
    default: '感谢{用户名}成为我们的品牌会员，您将享受专属特权！',
  },
  {
    id: 'live_order',
    name: '购买商品',
    default: '感谢{用户名}购买，宝贝很快就发货啦~',
  },
  {
    id: 'ecom_fansclub_participate',
    name: '加入粉丝团',
    default: '欢迎{用户名}加入粉丝团大家庭！',
  },
] as const

export function CompassSetting() {
  const { config, updateEventReplyEnabled, updateEventReplyContents, updateEventReplyOptions } =
    useAutoReplyConfig()
  const { entry: listeningSource } = config
  const platform = useCurrentLiveControl(context => context.platform)
  const editable = listeningSource === 'compass' || platform === 'dev'
  const typeReplies = pick(config, [
    'room_enter',
    'room_like',
    'room_follow',
    'subscribe_merchant_brand_vip',
    'live_order',
    'ecom_fansclub_participate',
  ])

  // 自动回复消息的开关
  const handleReplyChange = (type: EventMessageType, checked: boolean) => {
    updateEventReplyEnabled(type, checked)
  }

  // 处理其余消息的回复内容
  const handleMessageAdd = (type: EventMessageType, message: SimpleEventReplyMessage) => {
    updateEventReplyContents(type, [...typeReplies[type].messages, message])
  }

  const hanldeOptionsChange = (type: EventMessageType, options: Record<string, boolean>) => {
    updateEventReplyOptions(type, options)
  }

  const handleMessageRemove = (type: EventMessageType, index: number) => {
    const newMessages = typeReplies[type].messages.filter((_, i) => i !== index)
    updateEventReplyContents(type, newMessages)
  }
  return (
    <div className="divide-y">
      {autoReplyTypes.map(type => {
        const enabled = typeReplies[type.id]?.enable || false
        return (
          <div key={type.id} className="space-y-4 py-4 first:pt-0 last:pb-0">
            <SettingRow label={type.name} description={`观众${type.name}时自动发送一条回复`}>
              <Switch
                checked={enabled}
                onCheckedChange={checked => handleReplyChange(type.id, checked)}
                disabled={!editable}
              />
            </SettingRow>

            {enabled && (
              <div className="space-y-4 rounded-lg bg-muted/40 p-3">
                <ReplyMessageManager
                  messages={typeReplies[type.id]?.messages ?? []}
                  onAdd={message => handleMessageAdd(type.id, message)}
                  onRemove={index => handleMessageRemove(type.id, index)}
                  placeholder={`例如：${type.default}`}
                  msgType={type.id}
                />
                {type.id === 'live_order' && (
                  <SettingRow
                    label="仅在已付款时回复"
                    description="订单有已下单、已付款两种状态，开启后只回复已付款的订单"
                  >
                    <Switch
                      checked={config[type.id]?.options?.onlyReplyPaid}
                      onCheckedChange={e => hanldeOptionsChange(type.id, { onlyReplyPaid: e })}
                    />
                  </SettingRow>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// 用于管理回复消息的组件
function ReplyMessageManager({
  messages,
  onAdd,
  onRemove,
  placeholder,
  msgType,
}: {
  messages: SimpleEventReplyMessage[]
  onAdd: (message: SimpleEventReplyMessage) => void
  onRemove: (index: number) => void
  placeholder?: string
  msgType: EventMessageType
}) {
  const defaultFilterForm = () => ({
    type: 'eq' as const,
    field: 'nick_name' as const,
    content: [],
  })
  const [newMessage, setNewMessage] = useState('')
  const [filterForm, setFilterForm] =
    useState<MessageFilterForm<typeof msgType>>(defaultFilterForm())
  const { toast } = useToast()

  const handleAdd = () => {
    const trimedMessage = newMessage.trim()
    if (!trimedMessage) {
      toast.error('消息内容不能为空')
      return
    }
    const filterContent = filterForm.content
    if (!filterContent.filter(Boolean).length) {
      // 未设置过滤器
      onAdd(trimedMessage)
    } else {
      onAdd({
        content: trimedMessage,
        filter: {
          [filterForm.field]: {
            [filterForm.type]: filterForm.content,
          },
        },
      })
    }
    setNewMessage('')
    setFilterForm(defaultFilterForm())
    toast.success('添加成功')
  }

  const handleFilterFormChange = (newForm: MessageFilterForm<typeof msgType>) => {
    setFilterForm(newForm)
  }

  return (
    <div className="space-y-2">
      <Hint>
        从以下回复中随机挑一条发送，可用 <Token>{'{用户名}'}</Token>
        。带漏斗图标的回复只在满足条件时使用
      </Hint>
      {messages.length === 0 && (
        <p className="rounded-md bg-warning-soft px-2.5 py-1.5 text-xs text-warning-ink">
          还没有回复内容，添加至少一条后才会自动回复
        </p>
      )}
      {messages.length > 0 && (
        <ul className="space-y-1">
          {messages.map((message, index) => (
            <li
              // oxlint-disable-next-line react/no-array-index-key -- 下标无妨
              key={index}
              className="group flex items-center gap-2 rounded-md border bg-card py-1.5 pr-1 pl-2.5 text-[13px]"
            >
              <span className="flex-1 leading-relaxed break-words">
                {typeof message === 'string' ? message : message.content}
              </span>
              {typeof message !== 'string' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger aria-label="查看过滤条件">
                      <FilterIcon className="size-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <FilterText filterConfig={message.filter} />
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <button
                type="button"
                className="rounded-sm p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100"
                onClick={() => onRemove(index)}
                aria-label="删除这条回复"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-2">
        <MessageFilter
          filterForm={filterForm}
          onChange={handleFilterFormChange}
          msgType={msgType}
        />
        <Input
          placeholder={placeholder || '输入回复消息...'}
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAdd()
          }}
          className="flex-1 text-[13px]"
        />
        <Button variant="outline" onClick={handleAdd}>
          添加
        </Button>
      </div>
    </div>
  )
}

const conditionTextMap = {
  eq: '等于',
  includes: '包含',
  startsWith: '开头为',
  endsWith: '结尾为',
} as const

const fieldNameMap = {
  nick_name: '昵称',
  content: '内容',
  order_status: '订单状态',
  product_title: '商品名称',
} as const

const getFilterFieldMapping = (msgType: EventMessageType) => {
  switch (msgType) {
    case 'live_order':
      return ['nick_name', 'product_title', 'order_status'] as const
    default:
      return ['nick_name'] as const
  }
}

function FilterText({ filterConfig }: { filterConfig: StringFilterConfig }) {
  const renderCondition = (field: keyof typeof fieldNameMap, condition: StringFilter) => {
    const label = fieldNameMap[field] || field
    const lines: {
      prefix: string
      suffix: string
      label: string
      conditionText: string
      value: string
    }[] = []

    for (const [key, values] of Object.entries(condition)) {
      if (!values || values.length === 0) return

      const conditionText = conditionTextMap[key as keyof StringFilter] || key

      values.forEach((value, index) => {
        const prefix = index === 0 ? '当' : '或'
        const suffix = index === values.length - 1 ? ' 时' : ''
        lines.push({
          prefix,
          suffix,
          label,
          conditionText,
          value,
        })
      })
    }

    return lines.map(({ prefix, suffix, conditionText, value, label }, i) => (
      // oxlint-disable-next-line react/no-array-index-key -- 用下标问题不大
      <div key={i}>
        <span>{prefix}</span>
        <span className="px-1 font-medium">{label}</span>
        <span className="opacity-70">{conditionText}</span>
        <span className="px-1 font-medium">「{value}」</span>
        <span>{suffix}</span>
      </div>
    ))
  }

  return (
    <div>
      {Object.entries(filterConfig).map(([field, condition]) =>
        renderCondition(field as keyof typeof fieldNameMap, condition),
      )}
    </div>
  )
}

type MessageFilterForm<T extends EventMessageType> = {
  type: keyof StringFilter
  field: keyof MessageOf<T>
  content: string[]
}

function MessageFilter<T extends EventMessageType>({
  filterForm,
  onChange,
  msgType,
}: {
  filterForm: MessageFilterForm<T>
  onChange: (newFilterForm: MessageFilterForm<T>) => void
  msgType: T
}) {
  const [open, setOpen] = useState(false)

  const currentFieldMapping = getFilterFieldMapping(msgType).map(value => {
    return [value, fieldNameMap[value]]
  })

  const handleFilterContentChange = (newValue: string, index: number) => {
    const updated = [...filterForm.content]
    updated[index] = newValue
    onChange({
      ...filterForm,
      content: updated,
    })
  }

  const handleFilterContentAdd = () => {
    onChange({
      ...filterForm,
      content: [...filterForm.content, ''],
    })
  }

  const handleFilterContentRemove = (index: number) => {
    onChange({
      ...filterForm,
      content: filterForm.content.filter((_, i) => i !== index),
    })
  }

  const handleFilterFieldChange = (newFiled: string) => {
    onChange({
      ...filterForm,
      field: newFiled as typeof filterForm.field,
    })
  }

  const handleFilterTypeChange = (newType: string) => {
    onChange({
      ...filterForm,
      type: newType as typeof filterForm.type,
    })
  }

  const activeCount = filterForm.content.filter(Boolean).length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn('relative', activeCount > 0 && 'border-foreground/40')}
          aria-label="设置过滤条件"
        >
          <FunnelPlusIcon />
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground tabular-nums">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 space-y-3">
        <div className="space-y-0.5">
          <p className="text-[13px] font-medium">过滤条件</p>
          <Hint>只在满足任一条件时使用这条回复，不填则总是可用</Hint>
        </div>
        <div className="flex gap-2">
          <Select value={filterForm.field as string} onValueChange={handleFilterFieldChange}>
            <SelectTrigger size="sm" className="flex-1">
              <SelectValue placeholder="选择字段" />
            </SelectTrigger>
            <SelectContent>
              {currentFieldMapping.map(([value, text]) => (
                <SelectItem value={value} key={value}>
                  {text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterForm.type as string} onValueChange={handleFilterTypeChange}>
            <SelectTrigger size="sm" className="flex-1">
              <SelectValue placeholder="选择条件" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(conditionTextMap).map(([value, text]) => (
                <SelectItem value={value} key={value}>
                  {text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {filterForm.content.map((v, i) => (
          <div
            className="flex gap-1"
            // oxlint-disable-next-line react/no-array-index-key -- 数量少，key 用 index 不要紧的
            key={i}
          >
            <Input
              placeholder="填写匹配内容"
              value={v}
              className="h-8 text-[13px]"
              onChange={e => handleFilterContentChange(e.target.value, i)}
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={() => handleFilterContentRemove(i)}
              aria-label="删除条件"
            >
              <Trash2Icon />
            </Button>
          </div>
        ))}
        <Button variant="ghost" size="sm" className="w-full" onClick={handleFilterContentAdd}>
          <PlusIcon />
          添加匹配内容
        </Button>
      </PopoverContent>
    </Popover>
  )
}
