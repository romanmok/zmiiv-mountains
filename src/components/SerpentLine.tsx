'use client'

import { useEffect, useRef } from 'react'

/** The page's one ambient motion: a winding line drawn as you scroll. Static when reduced motion is on. */
export function SerpentLine() {
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    const svg = svgRef.current
    const path = pathRef.current
    const page = svg?.parentElement
    if (!svg || !path || !page) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    let len = 0

    const draw = () => {
      if (reduce) {
        path.style.strokeDashoffset = '0'
        return
      }
      const p = (scrollY + innerHeight * 0.8) / page.offsetHeight
      path.style.strokeDashoffset = String(len * (1 - Math.min(1, Math.max(0, p))))
    }

    const build = () => {
      const w = page.offsetWidth
      const h = page.offsetHeight
      const step = 520
      let d = `M${w * 0.08} 0`
      let y = 0
      let left = true
      while (y < h) {
        const ny = Math.min(y + step, h)
        const x = left ? w * 0.92 : w * 0.08
        d += ` C${left ? w * 0.08 : w * 0.92} ${y + step * 0.5} ${x} ${y + step * 0.5} ${x} ${ny}`
        y = ny
        left = !left
      }
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
      path.setAttribute('d', d)
      len = path.getTotalLength()
      path.style.strokeDasharray = String(len)
      draw()
    }

    const ro = new ResizeObserver(build)
    ro.observe(page)
    addEventListener('scroll', draw, { passive: true })
    return () => {
      ro.disconnect()
      removeEventListener('scroll', draw)
    }
  }, [])

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
    >
      <path ref={pathRef} className="fill-none stroke-serpent opacity-[.18]" strokeWidth={10} strokeLinecap="round" />
    </svg>
  )
}
