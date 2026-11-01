import { BuyinPlatform } from './buyin'
import { DevPlatform } from './dev'
import { DouyinPlatform } from './douyin'
import { DouyinEosPlatform } from './douyin-eos'
import type { IPlatform } from './IPlatform'
import { WechatChannelPlatform } from './wechat-channels'

export const platformFactory: Record<LiveControlPlatform, { new (): IPlatform }> = {
  buyin: BuyinPlatform,
  douyin: DouyinPlatform,
  wxchannel: WechatChannelPlatform,
  eos: DouyinEosPlatform,
  dev: DevPlatform,
}
