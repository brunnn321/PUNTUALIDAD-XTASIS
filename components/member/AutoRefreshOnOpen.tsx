'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  opensAtList: string[]
}

export default function AutoRefreshOnOpen({ opensAtList }: Props) {
  const router = useRouter()

  useEffect(() => {
    if (opensAtList.length === 0) return

    const now = Date.now()
    const timers = opensAtList
      .map(ts => new Date(ts).getTime() - now)
      .filter(delay => delay > 0)
      .map(delay => setTimeout(() => router.refresh(), delay))

    return () => timers.forEach(clearTimeout)
  }, [opensAtList.join(',')])

  return null
}
