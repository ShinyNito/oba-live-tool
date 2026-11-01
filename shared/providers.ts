/** 模型列表的数据源，启动时由主进程按各 provider 的 `modelsDev.id` 拉取 */
export const MODELS_DEV_API_URL = 'https://models.dev/api.json'

/**
 * 内置 providers。名称、baseURL、API Key 页面以此为准；
 * `models` 是首次启动或离线时的降级数据，运行时会被 models.dev 的最新列表替换。
 */
export const providers: Record<string, ProviderInfo> = {
  deepseek: {
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com',
    apiUrl: 'https://platform.deepseek.com/api_keys',
    modelsDev: { id: 'deepseek' },
    models: ['deepseek-flash', 'deepseek-v4-pro'],
  },
  openrouter: {
    name: 'OpenRouter',
    baseURL: 'https://openrouter.ai/api/v1',
    apiUrl: 'https://openrouter.ai/keys',
    modelsDev: { id: 'openrouter' },
    models: [
      'deepseek/deepseek-v4.1-flash-1017',
      '~deepseek/deepseek-flash-latest',
      '~deepseek/deepseek-pro-latest',
      'deepseek/deepseek-v4.1-flash',
      'deepseek/deepseek-v4-flash-vision-exp',
      'deepseek/deepseek-v4-pro-0813',
      '~deepseek/deepseek-v4-flash-latest',
      'deepseek/deepseek-v4-flash-0731',
      'deepseek/deepseek-v4-flash',
      'deepseek/deepseek-v4-pro',
      'deepseek/deepseek-chat',
      'deepseek/deepseek-v3.2',
      'deepseek/deepseek-v3.2-exp',
      'deepseek/deepseek-v3.1-terminus',
      'deepseek/deepseek-chat-v3.1',
      'deepseek/deepseek-r1-0528',
      'deepseek/deepseek-chat-v3-0324',
    ],
  },
  siliconflow: {
    name: '硅基流动',
    baseURL: 'https://api.siliconflow.cn/v1',
    apiUrl: 'https://cloud.siliconflow.cn/account/ak',
    modelsDev: { id: 'siliconflow-cn' },
    models: [
      'deepseek-ai/DeepSeek-V4-Flash',
      'deepseek-ai/DeepSeek-V4-Pro',
      'deepseek-ai/DeepSeek-V3.2',
      'Pro/deepseek-ai/DeepSeek-V3.2',
      'deepseek-ai/DeepSeek-OCR',
      'deepseek-ai/DeepSeek-V3.1-Terminus',
      'Pro/deepseek-ai/DeepSeek-V3.1-Terminus',
      'deepseek-ai/DeepSeek-R1',
      'Pro/deepseek-ai/DeepSeek-R1',
      'deepseek-ai/DeepSeek-V3',
      'Pro/deepseek-ai/DeepSeek-V3',
    ],
  },
  volcengine: {
    name: '火山引擎',
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3/',
    apiUrl: 'https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey',
    modelsDev: { id: 'volcengine' },
    models: [
      'glm-5-3-flash-260828',
      'deepseek-v4-pro-ga-260813',
      'deepseek-v4-flash-ga-260731',
      'doubao-seed-2-1-pro-260628',
      'doubao-seed-2-1-turbo-260628',
      'doubao-seed-character-260628',
      'doubao-seed-evolving',
      'glm-5-2-260617',
      'doubao-seed-2-0-lite-260428',
      'doubao-seed-2-0-mini-260428',
    ],
  },
  custom: { name: '自定义', baseURL: '', apiUrl: '', models: [] },
}
