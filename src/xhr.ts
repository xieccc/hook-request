import type { IOptions, IContext } from './type'
import { RequestTypeEnum } from './type'
import { generateContext } from './helper'

const hookXHR = (options: IOptions, win = window) => {
  const { onRequest, onResponse, onError } = options

  const originalXHR = win.XMLHttpRequest

  class proxyXMLHttpRequest extends XMLHttpRequest {
    context: IContext = generateContext(RequestTypeEnum.XHR)

    constructor() {
      super();
      this.addEventListener('readystatechange', this.handleReadyStateChange);
      this.addEventListener('error', this.handleError);
    }

    open = (method: string, url: string | URL, async = true, username?: string | null, password?: string | null) => {
      this.context.request.method = method;
      this.parseURL(url)
      this.context.request.auth.username = username ?? null
      this.context.request.auth.password = password ?? null
      super.open(method, url, async, username, password)
    }

    setRequestHeader = (name: string, value: string) => {
      this.context.request.headers[name] = value
      super.setRequestHeader(name, value)
    }

    send = async (body?: Document | XMLHttpRequestBodyInit | null) => {
      this.context.request.data = body
      onRequest?.(this.context, this)
      super.send(body);
    }

    parseURL = (u: string | URL) => {
      const url = typeof u === 'string' ? new URL(u, new URL(win.location.href)) : u
      this.context.request.url = `${url.origin}${url.pathname}`
      const keys = Array.from(new Set(url.searchParams.keys()))
      keys.forEach(k => {
        const v = url.searchParams.getAll(k)
        this.context.request.params[k] = v.length === 1 ? v[0] : v
      })
    }

    parseResponse = () => {
      const response = this.context.response
      response.status = this.status

      const headerStr = this.getAllResponseHeaders()
      const headerPairs = headerStr.split('\u000d\u000a');
      headerPairs.forEach(headerPair => {
        const index = headerPair.indexOf('\u003a\u0020')
        if (index > 0) {
          const key = headerPair.substring(0, index);
          const value = headerPair.substring(index + 2);
          response.headers[key] = value
        }
      })

      try {
        response.data = JSON.parse(this.responseText)
      } catch (err) {
        response.data = this.responseText
      }
    }

    handleReadyStateChange = () => {
      if (this.readyState === this.DONE) {
        if (this.responseText && typeof this.responseText === 'string') {
          this.parseResponse()
          onResponse?.(this.context, this)
        }
      }
    }

    handleError: EventListener = (ev: Event) => {
      onError?.(ev, this.context, this);
    };
  }

  win.XMLHttpRequest = proxyXMLHttpRequest

  return {
    unHookXHR: () => {
      win.XMLHttpRequest = originalXHR
    },
    reHookXHR: () => {
      win.XMLHttpRequest = proxyXMLHttpRequest
    }
  }
}

export { hookXHR }