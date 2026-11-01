import React from 'react'
import { autoReplyPlatforms } from '@/abilities'
import { Section } from '@/components/common/Layout'
import { platformNames } from './PlatformSelect'

const instructions = [
  '选择直播平台，点击"连接中控台"，在弹出的浏览器中登录',
  '连接成功后，就可以使用自动发言、自动回复等功能',
  `自动回复目前支持：${autoReplyPlatforms
    .filter(p => p !== 'dev')
    .map(p => platformNames[p])
    .join('、')}`,
]

const InstructionsCard = React.memo(() => (
  <Section title="使用步骤">
    <ol className="space-y-3">
      {instructions.map((instruction, index) => (
        <li className="flex items-baseline gap-3 text-[13px]" key={instruction}>
          <span className="w-4 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="leading-relaxed">{instruction}</span>
        </li>
      ))}
    </ol>
  </Section>
))

export default InstructionsCard
