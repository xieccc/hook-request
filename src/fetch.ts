import type { IOptions, IContext } from './type'
import { RequestTypeEnum } from './type'
import { generateContext } from './helper'

const hookFetch = (options: IOptions, win: Window = window) => {
  const { onRequest, onResponse, onError } = options

  const originalFetch = win.fetch

  class ProxyFetchTools {
    context: IContext = generateContext(RequestTypeEnum.Fetch)

    parseURL = (u: string | URL) => {
      const url = typeof u === 'string' ? new URL(u, new URL(win.location.href)) : u
      this.context.request.url = `${url.origin}${url.pathname}`
      const keys = Array.from(new Set(url.searchParams.keys()))
      keys.forEach(k => {
        const v = url.searchParams.getAll(k)
        this.context.request.params[k] = v.length === 1 ? v[0] : v
      })
    }

    parseHeaders = (headers: Headers) => {
      const parsedHeaders: Record<string, string> = {}
      headers.forEach((v, k) => {
        parsedHeaders[k] = v
      })
      return parsedHeaders
    }

    parseRequest = (input: RequestInfo | string, init?: RequestInit) => {
      const request: Request = new Request(input, init)
      this.parseURL(request.url)
      this.context.request.method = request.method 
      this.context.request.headers = this.parseHeaders(request.headers)      
      this.context.request.data = request.body
    }

    parseResponse = (response: Response) => {
      this.context.response.status = response.status
      this.context.response.headers = this.parseHeaders(response.headers)   
      this.context.response.data = response.body
    }
  }

  const customFetch = async (input: RequestInfo | string, init?: RequestInit): Promise<Response> => {
    const fetchTools = new ProxyFetchTools()
    try {
      fetchTools.parseRequest(input, init)
      onRequest?.(fetchTools.context)
      const response = await originalFetch(input, init);
      fetchTools.parseResponse(response)
      onResponse?.(fetchTools.context)
      return response;
    } catch (err) {
      // 捕获并处理错误
      onError?.(err, fetchTools.context)
      throw err;
    }
  };

  win.fetch = customFetch

  return {
    unHookFetch: () => {
      win.fetch = originalFetch
    },
    reHookFetch: () => {
      win.fetch = customFetch
    }
  }
}

export { hookFetch }
