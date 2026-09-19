import type { Database } from 'better-sqlite3'
import { ipcMain } from 'electron'
import { CANAIS_LANCAMENTOS } from '../../shared/lancamentos/canais'
import type { NovoLancamento } from '../../shared/lancamentos/tipos'
import { validarNovoLancamento } from '../../shared/lancamentos/validarNovoLancamento'
import { excluirLancamento, inserirLancamento, listarLancamentos } from './repositorioLancamentos'

export function registrarIpcLancamentos(banco: Database): void {
  ipcMain.handle(CANAIS_LANCAMENTOS.listar, () => listarLancamentos(banco))

  ipcMain.handle(CANAIS_LANCAMENTOS.criar, (_evento, novoLancamento: NovoLancamento) => {
    const erros = validarNovoLancamento(novoLancamento)
    if (erros.length > 0) throw new Error(erros.join(' '))
    return inserirLancamento(banco, novoLancamento)
  })

  ipcMain.handle(CANAIS_LANCAMENTOS.excluir, (_evento, id: number) => excluirLancamento(banco, id))
}
