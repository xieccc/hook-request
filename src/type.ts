export enum RequestTypeEnum {
  XHR = 'xhr',
  Fetch = 'fetch',
}

export type TXHRRequest = {
  url: string;
  method: string;
  async: boolean;
  auth: {
    username: string | null;
    password: string | null;
  };
  headers: Headers;
  data?: any;
};

export type TFetchRequest = Request;

export type TRequest<T extends RequestTypeEnum> = T extends RequestTypeEnum.XHR ? TXHRRequest : TFetchRequest;

export type TXHRResponse = {
  status: number;
  headers: Headers;
  data: any;
};

export type TFetchResponse = Response;

export type TResponse<T extends RequestTypeEnum> = T extends RequestTypeEnum.XHR ? TXHRResponse : TFetchResponse;

export interface IContext<T extends RequestTypeEnum> {
  type: T;
  request: TRequest<T>;
  response: TResponse<T>;
}

export interface IOptions {
  onRequest?: (context: IContext<RequestTypeEnum>, xhr?: XMLHttpRequest) => Promise<void>;
  onResponse?: (context: IContext<RequestTypeEnum>, xhr?: XMLHttpRequest) => Promise<void>;
  onError?: (err: any, context: IContext<RequestTypeEnum>, xhr?: XMLHttpRequest) => Promise<void>;
}