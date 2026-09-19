import type { Database } from 'better-sqlite3'
import { ipcMain } from 'electron'
import { CANAIS_LANCAMENTOS } from '../../shared/lancamentos/canais'
import type { LancamentoEditado, NovoLancamento } from '../../shared/lancamentos/tipos'
import { validarNovoLancamento } from '../../shared/lancamentos/validarNovoLancamento'
import {
  atualizarLancamento,
  excluirLancamento,
  inserirLancamento,
  listarLancamentos
} from './repositorioLancamentos'

export function registrarIpcLancamentos(banco: Database): void {
  ipcMain.handle(CANAIS_LANCAMENTOS.listar, () => listarLancamentos(banco))

  ipcMain.handle(CANAIS_LANCAMENTOS.criar, (_evento, novoLancamento: NovoLancamento) => {
    const erros = validarNovoLancamento(novoLancamento)
    if (erros.length > 0) throw new Error(erros.join(' '))
    return inserirLancamento(banco, novoLancamento)
  })

  ipcMain.handle(CANAIS_LANCAMENTOS.atualizar, (_evento, lancamento: LancamentoEditado) => {
    const erros = validarNovoLancamento(lancamento)
    if (erros.length > 0) throw new Error(erros.join(' '))
    atualizarLancamento(banco, lancamento)
  })

  ipcMain.handle(CANAIS_LANCAMENTOS.excluir, (_evento, id: number) => excluirLancamento(banco, id))
}
