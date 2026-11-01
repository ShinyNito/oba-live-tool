import { Result } from '@praha/byethrow'
import type { Page } from 'playwright'
import { PageNotFoundError } from '#/errors/PlatformError'
import { createLogger } from '#/logger'
import type { BrowserSession } from '#/managers/BrowserSessionManager'
import { comment, ensurePage, getItemFromVirtualScroller, toggleButton } from '../helper'
import type { ICommentListener, IPerformComment, IPerformPopup, IPlatform } from '../IPlatform'
import { devElementFinder as elementFinder } from './element-finder'

const PLATFORM_NAME = '测试平台' as const

export class DevPlatform implements IPlatform, IPerformComment, IPerformPopup, ICommentListener {
  readonly _isPerformPopup = true
  readonly _isPerformComment = true
  readonly _isCommentListener = true

  private listenerTimer: ReturnType<typeof setInterval> | null = null
  private mainPage: Page | null = null
  private readonly logger = createLogger('DevPlatform')
  private documentWritten = false

  /**
   * 读取测试中控台页面上的弹幕，和真实平台一样以页面为唯一数据来源。
   * 只推送开始监听之后出现的新消息
   */
  async startCommentListener(onComment: (comment: DouyinLiveMessage) => void) {
    const page = this.getCommentListenerPage()
    let lastId = await page.evaluate(readLastId)
    this.listenerTimer = setInterval(() => {
      page
        .evaluate(readItemsAfter, lastId)
        .then(items => {
          for (const item of items) {
            lastId = Math.max(lastId, item.id)
            const message = toLiveMessage(item)
            if (message) onComment(message)
          }
        })
        .catch(err => this.logger.debug('读取测试中控台弹幕失败', err))
    }, 500)
  }

  stopCommentListener(): void {
    if (this.listenerTimer) {
      clearInterval(this.listenerTimer)
      this.listenerTimer = null
    }
  }

  async performPopup(id: number, signal?: AbortSignal) {
    console.log(`-----------------讲解商品ID: ${id}`)
    return Result.pipe(
      ensurePage(this.mainPage),
      Result.andThen(page => getItemFromVirtualScroller(page, elementFinder, id)),
      Result.andThen(item => elementFinder.getPopUpButtonFromGoodsItem(item)),
      Result.andThen(popupBtn => toggleButton(popupBtn, '讲解', '取消讲解', signal)),
    )
  }

  getPopupPage() {
    return this.mainPage
  }

  async performComment(message: string) {
    return Result.pipe(
      ensurePage(this.mainPage),
      Result.andThen(page => comment(page, elementFinder, message, false)),
    )
  }

  getCommentPage() {
    return this.mainPage
  }

  get platformName() {
    return PLATFORM_NAME
  }

  getCommentListenerPage() {
    if (!this.mainPage) {
      throw new PageNotFoundError()
    }
    return this.mainPage
  }

  async connect(browserSession: BrowserSession) {
    // await _browserSession.page.close()
    // await _browserSession.page.waitForSelector('#id', { timeout: 100 })
    if (!this.documentWritten) {
      await browserSession.page.setContent((await import('./dev.html?raw')).default)
      this.documentWritten = true
    }
    const isConnect = await Promise.race([
      browserSession.page.waitForSelector('.top-nav').then(() => true), // 中控台
      browserSession.page.waitForSelector('.login-form__btn-submit').then(() => false), // 登录
    ])
    if (isConnect) {
      this.mainPage = browserSession.page
    }
    return isConnect
  }

  async login(browserSession: BrowserSession) {
    const { page } = browserSession
    await page.waitForSelector('.top-nav')
  }

  async getAccountName(session: BrowserSession) {
    const accountName = await session.page.$('.user-profile span').then(el => el?.textContent())
    return accountName ?? ''
  }

  async disconnect() {
    this.logger.info('disconnect')
  }
}

type ChatItem = {
  id: number
  type: string
  event: string
  user: string
  content: string
  product: string
  status: string
}

function readLastId() {
  const ids = [...document.querySelectorAll<HTMLElement>('.chat-item[data-id]')].map(el =>
    Number(el.dataset.id),
  )
  return ids.length ? Math.max(...ids) : 0
}

function readItemsAfter(lastId: number): ChatItem[] {
  const elements = document.querySelectorAll<HTMLElement>('.chat-item[data-id]')
  // 新消息都在末尾，从后往前找到第一条已读过的就停
  let start = elements.length
  while (start > 0 && Number(elements[start - 1].dataset.id) > lastId) start--
  return [...elements].slice(start).map(el => ({
    id: Number(el.dataset.id),
    type: el.dataset.type ?? '',
    event: el.dataset.event ?? '',
    user: el.dataset.user ?? '',
    content: el.dataset.content ?? '',
    product: el.dataset.product ?? '',
    status: el.dataset.status ?? '',
  }))
}

const EVENT_TYPES = [
  'room_enter',
  'room_like',
  'room_follow',
  'ecom_fansclub_participate',
  'subscribe_merchant_brand_vip',
] as const

function toLiveMessage(item: ChatItem): DouyinLiveMessage | null {
  const base = { msg_id: `dev-${item.id}`, nick_name: item.user, time: Date.now() }
  // 观众评论和主播自己发的评论（用于"隐藏主播"）
  if (item.type === 'user' || item.type === 'host') {
    return { ...base, msg_type: 'comment', content: item.content }
  }
  if (item.type !== 'event') return null
  if (item.event === 'live_order') {
    return {
      ...base,
      msg_type: 'live_order',
      order_status: item.status === '已付款' ? '已付款' : '已下单',
      order_ts: Date.now(),
      product_id: '',
      product_title: item.product,
    }
  }
  const event = EVENT_TYPES.find(t => t === item.event)
  if (!event) return null
  // 部分事件类型带 content 字段，统一填上页面里的文字
  return {
    ...base,
    msg_type: event,
    user_id: item.user,
    content: item.content,
  } as DouyinLiveMessage
}
