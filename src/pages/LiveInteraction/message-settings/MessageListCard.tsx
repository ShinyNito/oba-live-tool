import React from 'react'
import { Section, Token } from '@/components/common/Layout'
import { useAutoMessageActions, useCurrentAutoMessage } from '@/hooks/useAutoMessage'
import MessageEditor from './MessageEditor'

const MessageListCard = React.memo(() => {
  const { messages, unlimitedLength } = useCurrentAutoMessage(context => context.config)
  const { setMessages } = useAutoMessageActions()

  return (
    <Section
      title="消息列表"
      description={
        <>
          一行一条，点亮行号旁的图钉，发送后会把该评论置顶。支持随机变量{' '}
          <Token>{'{宝宝/家人/老铁}'}</Token>
          ，发送时随机替换为其中一项
        </>
      }
    >
      <MessageEditor
        messages={messages}
        unlimitedLength={unlimitedLength}
        onChange={messages => setMessages(messages)}
      />
    </Section>
  )
})

export default MessageListCard
