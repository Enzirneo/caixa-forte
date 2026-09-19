import { ElectronAPI } from '@electron-toolkit/preload'
import type { ApiLancamentos } from '../shared/lancamentos/tipos'

declare global {
  interface Window {
    electron: ElectronAPI
    api: { lancamentos: ApiLancamentos }
  }
}
