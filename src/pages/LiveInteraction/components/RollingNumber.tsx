import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'

const EASE_OUT = [0.16, 1, 0.3, 1] as const

/**
 * 数字变化时逐位滚动：只有变了的那一位会动，旧数字向上滑出、新数字从下方滑入。
 * 每一位按数位（个位、十位……）作 key，位数变化时不会错位
 */
export function RollingNumber({ value, className }: { value: number; className?: string }) {
  const text = value.toLocaleString()
  // 每一位标上它是个位、十位还是百位……位数变化时同一位仍对应同一个元素
  const digits = text.split('').map((char, index, all) => ({ char, place: all.length - index }))

  return (
    <span className={cn('inline-flex tabular-nums', className)}>
      <span className="sr-only">{text}</span>
      {digits.map(({ char, place }) => (
        <span key={place} aria-hidden className="relative inline-flex overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={char}
              initial={{ opacity: 0, transform: 'translateY(70%)' }}
              animate={{ opacity: 1, transform: 'translateY(0%)' }}
              exit={{ opacity: 0, transform: 'translateY(-70%)' }}
              transition={{ duration: 0.28, ease: EASE_OUT }}
            >
              {char}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  )
}
