import { useCallback, useEffect, useState } from 'react'
import { type HttpError, toHttpError } from '../utils/http'

interface AsyncState<T> {
  data: T | null
  isLoading: boolean
  error: HttpError | null
}

/**
 * Runs `load` on mount and whenever it changes, so pass a stable function.
 * On reload, the current data stays on screen until the new data arrives.
 */
export function useAsyncData<T>(load: () => Promise<T>) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, isLoading: true, error: null })

  const run = useCallback(
    (isCurrent: () => boolean = () => true): Promise<T | null> =>
      load().then(
        (data) => {
          if (isCurrent()) setState({ data, isLoading: false, error: null })
          return data
        },
        (error: unknown) => {
          if (isCurrent()) setState((previous) => ({ ...previous, isLoading: false, error: toHttpError(error) }))
          return null
        },
      ),
    [load],
  )

  useEffect(() => {
    let isCurrent = true
    void run(() => isCurrent)
    return () => {
      isCurrent = false
    }
  }, [run])

  const reload = useCallback(() => {
    setState((previous) => ({ ...previous, isLoading: true, error: null }))
    return run()
  }, [run])

  /** Replaces the data with a newer copy the caller already has, e.g. from a response. */
  const setData = useCallback((data: T) => setState({ data, isLoading: false, error: null }), [])

  return { ...state, reload, setData }
}
