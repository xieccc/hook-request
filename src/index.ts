interface IRequest {
  url: string | URL
  method: string
  auth: {
    username: string | null,
    password: string | null
  },
  headers: Record<string, string>
  params: Record<string, string | string[]>,
  data?: any,
}

interface IResponse {
  status: number,
  headers: Record<string, string>,
  data: any
}

enum RequestTypeEnum {
  XHR = 'xhr',
  Fetch = 'fetch'
}

interface IContext {
  type: RequestTypeEnum
  request: IRequest,
  response: IResponse
}

interface IOptions {
  onRequest?: (context: IContext, xhr?: XMLHttpRequest) => void
  onResponse?: (context: IContext, xhr?: XMLHttpRequest) => void
  onError?: (err: any, context: IContext, xhr?: XMLHttpRequest) => void
}

const generateContext = (type: RequestTypeEnum): IContext => {
  const context: IContext = {
    type,
    request: {
      url: '',
      method: '',
      headers: {},
      params: {},
      auth: {
        username: null,
        password: null
      }
    },
    response: {
      status: 0,
      headers: {},
      data: null
    }
  }
  if (type === RequestTypeEnum.XHR) {
    context.request.auth = {
      username: null,
      password: null
    }
  }
  return context
}

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

    send = (body?: Document | XMLHttpRequestBodyInit | null) => {
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

const hookRequest = (optons: IOptions, win = window) => {
  const { unHookXHR, reHookXHR } = hookXHR(optons, win)
  const { unHookFetch, reHookFetch } = hookFetch(optons, win)

  return {
    unHook: () => {
      unHookXHR()
      unHookFetch()
    },
    reHook: () => {
      reHookXHR()
      reHookFetch()
    }
  }
}

export { hookRequest, hookXHR, hookFetch }