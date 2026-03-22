import { useEffect, useRef, useState } from 'react'

export default function AnimatedNumber({ value, decimals = 0, suffix = '', className = '' }) {
  const [display, setDisplay] = useState(value)
  const frameRef = useRef(null)
  const startRef = useRef(null)
  const fromRef = useRef(value)

  useEffect(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    const from = fromRef.current
    const to = value
    const duration = 400

    const animate = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(from + (to - from) * eased)
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      } else {
        fromRef.current = to
        startRef.current = null
      }
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [value])

  return (
    <span className={className}>
      {display.toFixed(decimals)}{suffix}
    </span>
  )
}
