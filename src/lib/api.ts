export type ApiResult<T> = { data: T | null; error: string | null }

export async function tryCall<T>(fn: () => Promise<{ data: T | null; error: any }>): Promise<ApiResult<T>> {
  try {
    const { data, error } = await fn()
    if (error) return { data: null, error: normalizeError(error) }
    return { data: data as T, error: null }
  } catch (e) {
    return { data: null, error: normalizeError(e) }
  }
}

export function normalizeError(e: any): string {
  if (!e) return 'Unknown error'
  if (typeof e === 'string') return e
  if (e.message) return e.message
  try { return JSON.stringify(e) } catch { return 'Unknown error' }
}

export function debug(...args: any[]) {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('[debug]', ...args)
  }
}


