import { hookXHR } from './xhr'
import { hookFetch } from './fetch'
import type { IOptions } from './type'

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
export * from './type'