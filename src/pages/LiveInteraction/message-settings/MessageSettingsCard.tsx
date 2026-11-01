import { useMemoizedFn } from 'ahooks'
import React, { useId, useState } from 'react'
import { IntervalInput } from '@/components/common/IntervalInput'
import { Divider, Field, Section, SettingRow } from '@/components/common/Layout'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import { useAutoMessageActions, useCurrentAutoMessage } from '@/hooks/useAutoMessage'

const MessageSettingsCard = React.memo(() => {
  const { scheduler, random, extraSpaces, unlimitedLength } = useCurrentAutoMessage(
    context => context.config,
  )
  const { setScheduler, setRandom, setExtraSpaces, setUnlimitedLength } = useAutoMessageActions()
  const randomId = useId()
  const extraSpacesId = useId()
  const unlimitedLengthId = useId()
  const [showWarning, setShowWarning] = useState(false)

  const handleUnlimitedLengthChange = useMemoizedFn((checked: boolean) => {
    if (checked) {
      setShowWarning(true)
    } else {
      setUnlimitedLength(false)
    }
  })

  const handleConfirmUnlimited = useMemoizedFn(() => {
    setUnlimitedLength(true)
    setShowWarning(false)
  })

  const handleIntervalChange = useMemoizedFn((index: 0 | 1, value: string) => {
    const numValue = Number(value) * 1000
    setScheduler({
      interval: index === 0 ? [numValue, scheduler.interval[1]] : [scheduler.interval[0], numValue],
    })
  })

  return (
    <Section title="发送设置">
      <Field label="发送间隔" hint="每条消息在这个区间内随机等待后发送">
        <IntervalInput value={scheduler.interval} onChange={handleIntervalChange} />
      </Field>
      <Divider />
      <SettingRow
        htmlFor={randomId}
        label="随机发送"
        description="每次随机挑一条发送，不会连续发同一条"
      >
        <Switch id={randomId} checked={random} onCheckedChange={setRandom} />
      </SettingRow>
      <SettingRow
        htmlFor={extraSpacesId}
        label="插入随机空格"
        description="在消息中随机插入空格，避免每次内容完全相同"
      >
        <Switch id={extraSpacesId} checked={extraSpaces} onCheckedChange={setExtraSpaces} />
      </SettingRow>
      <SettingRow
        htmlFor={unlimitedLengthId}
        label="解除字数限制"
        description="默认每行最多 50 个字，过长可能发送失败"
      >
        <Switch
          id={unlimitedLengthId}
          checked={unlimitedLength}
          onCheckedChange={handleUnlimitedLengthChange}
        />
      </SettingRow>

      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>警告</AlertDialogTitle>
            <AlertDialogDescription>
              解除字数限制后，将不再对消息内容进行字数限制。请确保您输入的内容能够在目标平台正常发布，过长的内容可能导致发送失败或被截断。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUnlimited}>确认解除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Section>
  )
})

export default MessageSettingsCard
