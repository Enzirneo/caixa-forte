import { ElectronAPI } from '@electron-toolkit/preload'
import type { ApiFechamentos } from '../shared/fechamentos/tipos'
import type { ApiLancamentos } from '../shared/lancamentos/tipos'

declare global {
  interface Window {
    electron: ElectronAPI
    api: { lancamentos: ApiLancamentos; fechamentos: ApiFechamentos }
  }
}
