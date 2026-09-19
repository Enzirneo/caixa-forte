import { ElectronAPI } from '@electron-toolkit/preload'
import type { ApiArquivos } from '../shared/arquivos/tipos'
import type { ApiBackup } from '../shared/backup/tipos'
import type { ApiFechamentos } from '../shared/fechamentos/tipos'
import type { ApiInvestimentos } from '../shared/investimentos/tipos'
import type { ApiLancamentos } from '../shared/lancamentos/tipos'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      lancamentos: ApiLancamentos
      fechamentos: ApiFechamentos
      investimentos: ApiInvestimentos
      backup: ApiBackup
      arquivos: ApiArquivos
    }
  }
}
