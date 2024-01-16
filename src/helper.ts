import type { IContext } from './type'
import { RequestTypeEnum } from './type'

export const generateContext = (type: RequestTypeEnum): IContext => {
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