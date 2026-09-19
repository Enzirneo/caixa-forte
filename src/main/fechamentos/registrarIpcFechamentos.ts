import type { Database } from 'better-sqlite3'
import { ipcMain } from 'electron'
import { obterDataIsoDeHoje } from '../../shared/datas/dataIso'
import { obterMesDaData } from '../../shared/datas/mes'
import { CANAIS_FECHAMENTOS } from '../../shared/fechamentos/canais'
import { fecharMesesEncerrados, refazerFechamento } from './fecharMes'
import { listarFechamentos } from './repositorioFechamentos'

export function registrarIpcFechamentos(banco: Database): void {
  ipcMain.handle(CANAIS_FECHAMENTOS.listar, () => listarFechamentos(banco))

  ipcMain.handle(CANAIS_FECHAMENTOS.fecharMesesEncerrados, () =>
    fecharMesesEncerrados(banco, obterMesDaData(obterDataIsoDeHoje()))
  )

  ipcMain.handle(CANAIS_FECHAMENTOS.refazer, (_evento, mes: string) =>
    refazerFechamento(banco, mes)
  )
}
