import type { IOptions, IContext } from './type'
import { RequestTypeEnum } from './type'

class HookXHRTools {
  context: IContext<RequestTypeEnum.XHR>;
  window: Window;
  constructor(window: Window) {
    this.context = {
      type: RequestTypeEnum.XHR,
      request: {
        url: '',
        method: '',
        headers: new Headers(),
        async: true,
        auth: {
          username: null,
          password: null,
        },
      },
      response: {
        status: 0,
        headers: new Headers(),
        data: null,
      },
    };
    this.window = window;
  }

  reset = () => {
    this.context = {
      type: RequestTypeEnum.XHR,
      request: {
        url: '',
        method: '',
        headers: new Headers(),
        async: true,
        auth: {
          username: null,
          password: null,
        },
      },
      response: {
        status: 0,
        headers: new Headers(),
        data: null,
      },
    };
  };

  open = (method: string, url: URL | string, async = true, username?: string | null, password?: string | null) => {
    this.context.request.url = typeof url === 'string' ? new URL(url, this.window.location.href).href : url.href;
    this.context.request.method = method;
    this.context.request.async = async;
    this.context.request.auth.username = username ?? null;
    this.context.request.auth.password = password ?? null;
  };

  setRequestHeader = (name: string, value: string) => {
    this.context.request.headers.append(name, value);
  };

  send = (body?: Document | XMLHttpRequestBodyInit | null) => {
    this.context.request.data = body;
  };

  parseResponse = (xhr: XMLHttpRequest) => {
    this.context.response.status = xhr.status;

    const headerStr = xhr.getAllResponseHeaders();
    const headerPairs = headerStr.split('\u000d\u000a');
    headerPairs.forEach((headerPair) => {
      const index = headerPair.indexOf('\u003a\u0020');
      if (index > 0) {
        const key = headerPair.substring(0, index);
        const value = headerPair.substring(index + 2);
        this.context.response.headers.append(key, value);
      }
    });

    switch (xhr.responseType) {
      case '':
      case 'text': {
        try {
          this.context.response.data = JSON.parse(xhr.responseText);
        } catch {
          this.context.response.data = xhr.responseText;
        }
        break;
      }

      default:
        this.context.response.data = xhr.response;
    }
  };
}

const hookXHR = (options: IOptions, win = window) => {
  const { onRequest, onResponse, onError } = options;

  const originalXHR = win.XMLHttpRequest;

  class proxyXMLHttpRequest extends XMLHttpRequest {
    constructor() {
      super();

      const hookXHRTools = new HookXHRTools(win);

      const originalOpen = this.open;
      this.open = function (
        method: string,
        url: string | URL,
        async = true,
        username?: string | null,
        password?: string | null
      ): void {
        hookXHRTools.reset();
        hookXHRTools.open(method, url, async, username, password);
        originalOpen.apply(this, [method, url, async, username, password]);
      };

      const originalSetRequestHeader = this.setRequestHeader;
      this.setRequestHeader = function (name: string, value: string): void {
        hookXHRTools.setRequestHeader(name, value);
        originalSetRequestHeader.apply(this, [name, value]);
      };

      const originalSend = this.send;
      this.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
        hookXHRTools.send(body);
        onRequest?.(hookXHRTools.context, this);
        originalSend.apply(this, [body]);
      };

      this.addEventListener('readystatechange', () => {
        if (this.readyState === this.DONE) {
          hookXHRTools.parseResponse(this);
          onResponse?.(hookXHRTools.context, this);
        }
      });
      this.addEventListener('error', (ev: Event) => {
        onError?.(ev, hookXHRTools.context, this);
      });
    }
  }

  win.XMLHttpRequest = proxyXMLHttpRequest;

  return {
    unHookXHR: () => {
      win.XMLHttpRequest = originalXHR;
    },
    reHookXHR: () => {
      win.XMLHttpRequest = proxyXMLHttpRequest;
    },
  };
};


export { hookXHR }