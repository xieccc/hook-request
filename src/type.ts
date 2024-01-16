export interface IRequest {
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

export interface IResponse {
  status: number,
  headers: Record<string, string>,
  data: any
}

export enum RequestTypeEnum {
  XHR = 'xhr',
  Fetch = 'fetch'
}

export interface IContext {
  type: RequestTypeEnum
  request: IRequest,
  response: IResponse
}

export interface IOptions {
  onRequest?: (context: IContext, xhr?: XMLHttpRequest) => void
  onResponse?: (context: IContext, xhr?: XMLHttpRequest) => void
  onError?: (err: any, context: IContext, xhr?: XMLHttpRequest) => void
}