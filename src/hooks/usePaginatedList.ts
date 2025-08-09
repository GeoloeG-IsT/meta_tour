import { useCallback, useState } from 'react'

export function usePaginatedList<T>(fetchPage: (from: number, to: number) => Promise<T[]>, pageSize: number) {
  const [items, setItems] = useState<T[]>([])
  const [offset, setOffset] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (reset: boolean) => {
    try {
      setIsLoading(true)
      setError(null)
      const from = reset ? 0 : offset
      const to = from + pageSize - 1
      const data = await fetchPage(from, to)
      setItems(prev => reset ? data : [...prev, ...data])
      setOffset(from + data.length)
      setHasMore(data.length === pageSize)
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setIsLoading(false)
    }
  }, [fetchPage, offset, pageSize])

  return { items, isLoading, error, hasMore, offset, load, setItems, setOffset }
}


