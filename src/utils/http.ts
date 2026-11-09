import type { ApiErrorBody, ApiErrorCode } from '../types/api'

const API_BASE_URL = `${import.meta.env.BASE_URL}api`
const DEFAULT_TIMEOUT_MS = 10_000

/** network: no response. timeout: no response in time. response: the server answered with an error. */
type HttpErrorKind = 'network' | 'timeout' | 'response'

export class HttpError extends Error {
  readonly kind: HttpErrorKind
  readonly status: number | null
  readonly code: ApiErrorCode | null

  constructor(kind: HttpErrorKind, message: string, status: number | null = null, code: ApiErrorCode | null = null) {
    super(message)
    this.name = 'HttpError'
    this.kind = kind
    this.status = status
    this.code = code
  }
}

export function toHttpError(error: unknown): HttpError {
  if (error instanceof HttpError) return error
  return new HttpError('network', error instanceof Error ? error.message : 'Something went wrong.')
}

interface RequestOptions {
  headers?: Record<string, string>
  timeoutMs?: number
}

function isApiErrorBody(data: unknown): data is ApiErrorBody {
  return typeof data === 'object' && data !== null && 'error' in data
}

async function request<T>(method: 'GET' | 'POST', path: string, body: unknown, options: RequestOptions): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...options.headers },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new HttpError('timeout', 'The request timed out.')
    }
    throw new HttpError('network', 'Could not reach the server.')
  }

  const data: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const apiError = isApiErrorBody(data) ? data.error : null
    throw new HttpError(
      'response',
      apiError?.message ?? `Request failed with status ${response.status}.`,
      response.status,
      apiError?.code ?? null,
    )
  }
  return data as T
}

export function get<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return request<T>('GET', path, undefined, options)
}

export function post<T>(path: string, body: unknown, options: RequestOptions = {}): Promise<T> {
  return request<T>('POST', path, body, options)
}
