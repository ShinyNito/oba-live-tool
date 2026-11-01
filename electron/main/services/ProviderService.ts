import fs from 'node:fs/promises'
import path from 'node:path'
import { app } from 'electron'
import { providers as defaultProviders, MODELS_DEV_API_URL } from 'shared/providers'
import { emitter } from '#/event/eventBus'
import { createLogger } from '#/logger'

/** 只缓存各 provider 的模型列表，名称、baseURL 等始终以内置配置为准 */
const MODELS_CACHE_FILE = 'models.cache.json'
/** 旧版本从 GitHub 拉取的完整 providers 缓存，已不再使用 */
const LEGACY_CACHE_FILE = 'providers.cache.json'

type ModelLists = Record<string, string[]>

interface ModelsDevModel {
  id: string
  status?: 'alpha' | 'beta' | 'deprecated'
  release_date?: string
  modalities?: { output?: string[] }
}

type ModelsDevApi = Record<string, { models: Record<string, ModelsDevModel> }>

function pickModels(api: ModelsDevApi): ModelLists {
  const lists: ModelLists = {}
  for (const [key, provider] of Object.entries(defaultProviders)) {
    if (!provider.modelsDev) continue
    const source = api[provider.modelsDev.id]?.models
    if (!source) continue

    const models = Object.values(source)
      // 排除已弃用和不输出文本的模型（图像、语音、Embedding 等），它们无法用于对话
      .filter(m => m.modalities?.output?.includes('text') && m.status !== 'deprecated')
      .sort(
        (a, b) =>
          (b.release_date ?? '').localeCompare(a.release_date ?? '') || a.id.localeCompare(b.id),
      )
      .map(m => m.id)

    if (models.length > 0) lists[key] = models
  }
  return lists
}

function withModels(lists: ModelLists): Record<string, ProviderInfo> {
  const result: Record<string, ProviderInfo> = {}
  for (const [key, provider] of Object.entries(defaultProviders)) {
    result[key] = { ...provider, models: lists[key] ?? provider.models }
  }
  return result
}

export class ProviderService {
  private logger = createLogger('ProviderService')
  private cachePath: string
  private _providers: Record<string, ProviderInfo> = { ...defaultProviders }

  constructor() {
    this.cachePath = path.join(app.getPath('userData'), MODELS_CACHE_FILE)
  }

  get providers(): Record<string, ProviderInfo> {
    return this._providers
  }

  async initialize(): Promise<void> {
    // 1. 先加载本地缓存，保证离线也有数据
    await this.loadFromCache()
    // 2. 后台从 models.dev 获取最新模型列表，不阻塞窗口创建
    this.fetchRemote().catch(error => {
      this.logger.warn(`从 models.dev 获取模型列表失败，将使用本地数据`, error)
    })
    fs.rm(path.join(app.getPath('userData'), LEGACY_CACHE_FILE), { force: true }).catch(() => {})
  }

  private async loadFromCache(): Promise<void> {
    try {
      const data = await fs.readFile(this.cachePath, 'utf-8')
      this._providers = withModels(JSON.parse(data))
      this.logger.debug('已从本地缓存加载模型列表')
    } catch {
      this.logger.verbose('未找到模型列表缓存，将使用内置默认配置')
    }
  }

  private async fetchRemote(): Promise<void> {
    const response = await fetch(MODELS_DEV_API_URL, { signal: AbortSignal.timeout(15_000) })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`)
    }
    const lists = pickModels(await response.json())
    this._providers = withModels(lists)
    await fs.writeFile(this.cachePath, JSON.stringify(lists, null, 2), 'utf-8')
    emitter.emit('providers-updated', this._providers)
    this.logger.success('已从 models.dev 更新模型列表')
  }
}

export const providerService = new ProviderService()
