import { useEffect, useRef, useState } from 'react'

interface AnimatedNumberProps {
  value: number
  format?: (v: number) => string
  duration?: number
  className?: string
}

export function AnimatedNumber({ value, format, duration = 800, className }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value)
  const prevValue = useRef(value)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const from = prevValue.current
    const to = value
    prevValue.current = value

    if (from === to) return

    const start = performance.now()
    const diff = to - from

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(from + diff * eased)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  const formatted = format ? format(display) : Math.round(display).toLocaleString()

  return <span className={className}>{formatted}</span>
}
