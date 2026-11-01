import { useMemoizedFn } from 'ahooks'
import React, { useId } from 'react'
import { IntervalInput } from '@/components/common/IntervalInput'
import { Divider, Field, Section, SettingRow } from '@/components/common/Layout'
import { Switch } from '@/components/ui/switch'
import { useAutoPopUpActions, useCurrentAutoPopUp } from '@/hooks/useAutoPopUp'

// 弹窗设置卡片组件
const PopUpSettingsCard = React.memo(() => {
  const { scheduler, random } = useCurrentAutoPopUp(context => context.config)
  const { setScheduler, setRandom } = useAutoPopUpActions()

  const handleIntervalChange = useMemoizedFn((index: 0 | 1, value: string) => {
    const numValue = Number(value) * 1000
    setScheduler({
      interval: index === 0 ? [numValue, scheduler.interval[1]] : [scheduler.interval[0], numValue],
    })
  })

  const randomPopUpId = useId()

  return (
    <Section title="弹窗设置">
      <Field label="弹窗间隔" hint="每次弹窗在这个区间内随机等待；商品单独设置了间隔时以商品为准">
        <IntervalInput value={scheduler.interval} onChange={handleIntervalChange} />
      </Field>
      <Divider />
      <SettingRow
        htmlFor={randomPopUpId}
        label="随机弹窗"
        description="每次随机挑一个商品弹出，而不是按列表顺序"
      >
        <Switch id={randomPopUpId} checked={random} onCheckedChange={setRandom} />
      </SettingRow>
    </Section>
  )
})

export default PopUpSettingsCard
