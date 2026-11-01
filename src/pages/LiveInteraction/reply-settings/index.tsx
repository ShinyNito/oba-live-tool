import { Divider, Section } from '@/components/common/Layout'
import type { SettingsDialogSection } from '@/components/common/SettingsDialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAutoReplyConfig } from '@/hooks/useAutoReplyConfig'
import { useCurrentLiveControl } from '@/hooks/useLiveControl'
import { AIReplySetting } from './AIReplySetting'
import { BlocklistManager } from './BlocklistManager'
import { CompassSetting } from './CompassSetting'
import { HideUsernameSetting } from './HideUsernameSetting'
import { KeywordReplySetting } from './KeywordReplySetting'
import { ListeningSourceSetting } from './ListeningSourceSetting'
import { WebSocketSetting } from './WebSocketSetting'
import { WechatChannelSetting } from './WechatChannelSetting'

/** 回复设置弹窗的分类 */
export function useReplySettingsSections(): SettingsDialogSection[] {
  const { config } = useAutoReplyConfig()
  const platform = useCurrentLiveControl(context => context.platform)
  // 测试平台的模拟消息包含互动事件，不受监听来源限制
  const showEventReply = config.entry === 'compass' || platform === 'dev'

  return [
    {
      id: 'comment',
      label: '评论回复',
      content: (
        <Tabs defaultValue="keyword">
          <Section
            title="评论回复"
            description="两种方式可以同时开启，关键词命中时优先使用关键词回复"
            action={
              <TabsList>
                <TabsTrigger value="keyword">关键词</TabsTrigger>
                <TabsTrigger value="ai">AI</TabsTrigger>
              </TabsList>
            }
          >
            <TabsContent value="keyword" className="mt-0">
              <KeywordReplySetting />
            </TabsContent>
            <TabsContent value="ai" className="mt-0">
              <AIReplySetting />
            </TabsContent>
          </Section>
        </Tabs>
      ),
    },
    ...(showEventReply
      ? [
          {
            id: 'event',
            label: '互动回复',
            content: (
              <Section
                title="互动回复"
                description="观众进房、点赞、关注、下单等行为发生时自动回复"
              >
                <CompassSetting />
              </Section>
            ),
          },
        ]
      : []),
    ...(config.entry === 'wechat-channel'
      ? [
          {
            id: 'wechat',
            label: '视频号',
            content: (
              <Section title="视频号">
                <WechatChannelSetting />
              </Section>
            ),
          },
        ]
      : []),
    {
      id: 'listen',
      label: '监听',
      content: (
        <Section title="监听">
          <ListeningSourceSetting />
          <Divider />
          <HideUsernameSetting />
        </Section>
      ),
    },
    {
      id: 'blocklist',
      label: '屏蔽用户',
      content: (
        <Section title="屏蔽用户" description="这些观众的评论和互动不会触发任何自动回复">
          <BlocklistManager />
        </Section>
      ),
    },
    {
      id: 'websocket',
      label: 'WebSocket 推送',
      content: (
        <Section title="WebSocket 推送" description="把直播间消息实时转发给你自己的程序">
          <WebSocketSetting />
        </Section>
      ),
    },
  ]
}
