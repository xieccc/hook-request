import type { IOptions, IContext } from './type'
import { RequestTypeEnum } from './type'

class HookFetchTools {
  context: IContext<RequestTypeEnum.Fetch> = {
    type: RequestTypeEnum.Fetch,
    request: new Request(''),
    response: new Response(),
  };

  parseRequest = (input: RequestInfo | string, init?: RequestInit) => {
    const request = new Request(input instanceof Request ? input.clone() : input, init);
    this.context.request = request;
  };

  parseResponse = (response: Response) => {
    this.context.response = response.clone();
  };
}

const hookFetch = (options: IOptions, win: Window = window) => {
  const { onRequest, onResponse, onError } = options;

  const originalFetch = win.fetch;

  const customFetch = async (input: RequestInfo | string, init?: RequestInit): Promise<Response> => {
    const hookFetchTools = new HookFetchTools();
    let error: unknown;
    try {
      try {
        hookFetchTools.parseRequest(input, init);
        await onRequest?.(hookFetchTools.context);
      } catch (err) {
        error = err;
      }
      let response: Response;
      try {
        response = await originalFetch(input, init);
      } catch (err) {
        error = err;
        throw err;
      }
      try {
        hookFetchTools.parseResponse(response);
        await onResponse?.(hookFetchTools.context);
      } catch (err) {
        error = err;
      }
      return response;
    } catch (err) {
      throw err;
    } finally {
      if (error) {
        onError?.(error, hookFetchTools.context);
      }
    }
  };

  win.fetch = customFetch;

  return {
    unHookFetch: () => {
      win.fetch = originalFetch;
    },
    reHookFetch: () => {
      win.fetch = customFetch;
    },
  };
};

export { hookFetch }