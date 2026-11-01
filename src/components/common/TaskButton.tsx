import { useDebounceFn } from 'ahooks'
import { useCurrentLiveControl } from '@/hooks/useLiveControl'
import { cn } from '@/lib/utils'
import { CarbonPlayFilledAlt } from '../icons/carbon'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { StatusDot } from './StatusDot'

export function TaskButton({
  isTaskRunning,
  onStartStop,
  forbidden = false,
}: {
  isTaskRunning: boolean
  onStartStop: () => void
  forbidden?: boolean
}) {
  const isConnected = useCurrentLiveControl(context => context.isConnected)
  const debouncedFn = useDebounceFn(onStartStop, {
    wait: 500,
    leading: true,
    trailing: false,
  })
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              variant={isTaskRunning ? 'outline' : 'default'}
              onClick={() => debouncedFn.run()}
              disabled={forbidden || isConnected !== 'connected'}
              className={cn(
                'min-w-28',
                isTaskRunning &&
                  'border-live/30 bg-live-soft text-destructive hover:bg-live-soft/70 hover:text-destructive',
              )}
            >
              {isTaskRunning ? (
                <>
                  <StatusDot tone="live" pulse className="mx-1" />
                  停止任务
                </>
              ) : (
                <>
                  <CarbonPlayFilledAlt />
                  开始任务
                </>
              )}
            </Button>
          </span>
        </TooltipTrigger>
        {isConnected !== 'connected' && (
          <TooltipContent>
            <p>请先连接直播控制台</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}
