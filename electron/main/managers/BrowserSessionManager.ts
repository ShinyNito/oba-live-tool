import type playwright from 'playwright'
import { chromium } from 'playwright-extra'
import stealth from 'puppeteer-extra-plugin-stealth'
import { findChromium } from '#/utils/checkChrome'

export interface BrowserSession {
  browser: playwright.Browser
  context: playwright.BrowserContext
  page: playwright.Page
}

export interface BrowserConfig {
  headless?: boolean
  storageState?: string
}

export type StorageState = playwright.BrowserContextOptions['storageState']

chromium.use(stealth())

class BrowserSessionManager {
  /** 设置里手动填的路径，优先使用 */
  private manualPath: string | null = null
  private edgeFirst = false
  /** 自动查找的结果，按查找顺序分别缓存，避免每次连接都重新扫描 */
  private detectedPaths = new Map<boolean, string>()

  public setBrowserPreference({ path, edgeFirst }: { path?: string; edgeFirst?: boolean }) {
    this.manualPath = path || null
    this.edgeFirst = edgeFirst ?? false
  }

  private async resolveChromePath() {
    if (this.manualPath) return this.manualPath
    let path = this.detectedPaths.get(this.edgeFirst)
    if (!path) {
      path = await findChromium(this.edgeFirst)
      this.detectedPaths.set(this.edgeFirst, path)
    }
    return path
  }

  private async createBrowser(headless = true) {
    const path = await this.resolveChromePath()
    return chromium.launch({
      headless,
      executablePath: path,
    })
  }

  public async createSession(
    headless = true,
    storageState?: StorageState,
  ): Promise<BrowserSession> {
    const browser = await this.createBrowser(headless)
    const context = await browser.newContext({
      viewport: null, // 显式设置 null，关闭固定视口
      storageState,
    })
    const page = await context.newPage()
    return { browser, context, page }
  }
}

export const browserManager = new BrowserSessionManager()
