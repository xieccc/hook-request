interface IRequest {
    url: string | URL;
    method: string;
    auth?: {
        username: string | null;
        password: string | null;
    };
    headers: Record<string, string>;
    params: Record<string, string | string[]>;
    data?: any;
}
interface IResponse {
    status: number;
    headers: Record<string, string>;
    data: any;
}
declare enum RequestTypeEnum {
    XHR = "xhr",
    Fetch = "fetch"
}
interface IContext {
    type: RequestTypeEnum;
    request: IRequest;
    response: IResponse;
}
interface IOptions {
    onOpen?: (context: IContext, xhr?: XMLHttpRequest) => void;
    onRequest?: (context: IContext, xhr?: XMLHttpRequest) => void;
    onResponse?: (context: IContext, xhr?: XMLHttpRequest) => void;
    onError?: (err: any, context: IContext, xhr?: XMLHttpRequest) => void;
}
declare const hookAjax: (options: IOptions, win?: Window & typeof globalThis) => {
    unHookAjax: () => void;
    reHookAjax: () => void;
};
declare const hookFetch: (options: IOptions, win?: Window) => {
    unHookFetch: () => void;
    reHookFetch: () => void;
};
declare const hookRequest: (optons: IOptions, win?: Window & typeof globalThis) => {
    unHook: () => void;
    reHook: () => void;
};
export { hookRequest, hookAjax, hookFetch };
