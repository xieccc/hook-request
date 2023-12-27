'use strict';

var RequestTypeEnum;
(function (RequestTypeEnum) {
    RequestTypeEnum["XHR"] = "xhr";
    RequestTypeEnum["Fetch"] = "fetch";
})(RequestTypeEnum || (RequestTypeEnum = {}));
const generateContext = (type) => {
    const context = {
        type,
        request: {
            url: '',
            method: '',
            headers: {},
            params: {}
        },
        response: {
            status: 0,
            headers: {},
            data: null
        }
    };
    if (type === RequestTypeEnum.XHR) {
        context.request.auth = {
            username: null,
            password: null
        };
    }
    return context;
};
const hookAjax = (options, win = window) => {
    const { onOpen, onRequest, onResponse, onError } = options;
    const originalXHR = win.XMLHttpRequest;
    class proxyXMLHttpRequest extends XMLHttpRequest {
        context = generateContext(RequestTypeEnum.XHR);
        constructor() {
            super();
            this.addEventListener('readystatechange', this.handleReadyStateChange);
            this.addEventListener('error', this.handleError);
        }
        open = (method, url, async = true, username, password) => {
            this.context.request.method = method;
            this.parseURL(url);
            this.context.request.auth.username = username ?? null;
            this.context.request.auth.password = password ?? null;
            onOpen?.(this.context, this);
            super.open(method, url, async, username, password);
        };
        setRequestHeader = (name, value) => {
            this.context.request.headers[name] = value;
            super.setRequestHeader(name, value);
        };
        send = (body) => {
            this.context.request.data = body;
            onRequest?.(this.context, this);
            super.send(body);
        };
        parseURL = (u) => {
            const url = typeof u === 'string' ? new URL(u, new URL(win.location.href)) : u;
            this.context.request.url = `${url.origin}${url.pathname}`;
            const keys = Array.from(new Set(url.searchParams.keys()));
            keys.forEach(k => {
                const v = url.searchParams.getAll(k);
                this.context.request.params[k] = v.length === 1 ? v[0] : v;
            });
        };
        parseResponse = () => {
            const response = this.context.response;
            response.status = this.status;
            const headerStr = this.getAllResponseHeaders();
            const headerPairs = headerStr.split('\u000d\u000a');
            headerPairs.forEach(headerPair => {
                const index = headerPair.indexOf('\u003a\u0020');
                if (index > 0) {
                    const key = headerPair.substring(0, index);
                    const value = headerPair.substring(index + 2);
                    response.headers[key] = value;
                }
            });
            try {
                response.data = JSON.parse(this.responseText);
            }
            catch (err) {
                response.data = this.responseText;
            }
        };
        handleReadyStateChange = () => {
            if (this.readyState === this.DONE) {
                if (this.responseText && typeof this.responseText === 'string') {
                    this.parseResponse();
                    onResponse?.(this.context, this);
                }
            }
        };
        handleError = (ev) => {
            onError?.(ev, this.context, this);
        };
    }
    win.XMLHttpRequest = proxyXMLHttpRequest;
    return {
        unHookAjax: () => {
            win.XMLHttpRequest = originalXHR;
        },
        reHookAjax: () => {
            win.XMLHttpRequest = proxyXMLHttpRequest;
        }
    };
};
const hookFetch = (options, win = window) => {
    const { onRequest, onResponse, onError } = options;
    const originalFetch = win.fetch;
    class ProxyFetchTools {
        context = generateContext(RequestTypeEnum.Fetch);
        parseURL = (u) => {
            const url = typeof u === 'string' ? new URL(u, new URL(win.location.href)) : u;
            this.context.request.url = `${url.origin}${url.pathname}`;
            const keys = Array.from(new Set(url.searchParams.keys()));
            keys.forEach(k => {
                const v = url.searchParams.getAll(k);
                this.context.request.params[k] = v.length === 1 ? v[0] : v;
            });
        };
        parseHeaders = (headers) => {
            const parsedHeaders = {};
            headers.forEach((v, k) => {
                parsedHeaders[k] = v;
            });
            return parsedHeaders;
        };
        parseRequest = (input, init) => {
            const request = new Request(input, init);
            this.parseURL(request.url);
            this.context.request.headers = this.parseHeaders(request.headers);
            this.context.request.data = request.body;
        };
        parseResponse = (response) => {
            this.context.response.status = response.status;
            this.context.response.headers = this.parseHeaders(response.headers);
            this.context.response.data = response.body;
        };
    }
    const customFetch = async (input, init) => {
        const fetchTools = new ProxyFetchTools();
        try {
            fetchTools.parseRequest(input, init);
            onRequest?.(fetchTools.context);
            const response = await originalFetch(input, init);
            fetchTools.parseResponse(response);
            onResponse?.(fetchTools.context);
            return response;
        }
        catch (err) {
            onError?.(err, fetchTools.context);
            throw err;
        }
    };
    win.fetch = customFetch;
    return {
        unHookFetch: () => {
            win.fetch = originalFetch;
        },
        reHookFetch: () => {
            win.fetch = customFetch;
        }
    };
};
const hookRequest = (optons, win = window) => {
    const { unHookAjax, reHookAjax } = hookAjax(optons, win);
    const { unHookFetch, reHookFetch } = hookFetch(optons, win);
    return {
        unHook: () => {
            unHookAjax();
            unHookFetch();
        },
        reHook: () => {
            reHookAjax();
            reHookFetch();
        }
    };
};
hookRequest({
    onRequest: (context, xhr) => {
        console.log('onRequest', context, xhr);
    },
    onResponse: (context, xhr) => {
        console.log('onResponse', context, xhr);
    },
    onError: (err, context) => {
        console.log(err, context);
    }
});

exports.hookAjax = hookAjax;
exports.hookFetch = hookFetch;
exports.hookRequest = hookRequest;
//# sourceMappingURL=index.js.map
