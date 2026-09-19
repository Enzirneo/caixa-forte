import type { Database } from 'better-sqlite3'
import { ipcMain } from 'electron'
import { obterDataIsoDeHoje } from '../../shared/datas/dataIso'
import { obterMesDaData } from '../../shared/datas/mes'
import { CANAIS_FECHAMENTOS } from '../../shared/fechamentos/canais'
import { fecharMes } from './fecharMes'
import { listarFechamentos, removerFechamento } from './repositorioFechamentos'

export function registrarIpcFechamentos(banco: Database): void {
  ipcMain.handle(CANAIS_FECHAMENTOS.listar, () => listarFechamentos(banco))

  ipcMain.handle(CANAIS_FECHAMENTOS.fechar, (_evento, mes: string) =>
    fecharMes(banco, mes, obterMesDaData(obterDataIsoDeHoje()))
  )

  ipcMain.handle(CANAIS_FECHAMENTOS.reabrir, (_evento, mes: string) =>
    removerFechamento(banco, mes)
  )
}
