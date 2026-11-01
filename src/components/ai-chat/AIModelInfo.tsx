import type { AIConfigType } from '@/hooks/useAIProvider'
import { useAIProvider } from '@/hooks/useAIProvider'
import { useProviders } from '@/hooks/useProviders'
import { ProviderIcon } from '../icons/providerLogos'

interface AIModelInfoProps {
  type?: AIConfigType
}

export default function AIModelInfo({ type = 'chat' }: AIModelInfoProps) {
  const { config: aiConfig } = useAIProvider(type)
  const providers = useProviders()
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
      <ProviderIcon provider={aiConfig.provider} className="size-3.5 shrink-0 text-foreground" />
      <span className="shrink-0 font-medium text-foreground">
        {providers[aiConfig.provider]?.name ?? aiConfig.provider}
      </span>
      <span aria-hidden>·</span>
      <span className="truncate font-mono">{aiConfig.model || '未选择模型'}</span>
    </div>
  )
}
