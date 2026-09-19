import type { Database } from 'better-sqlite3'
import { ipcMain } from 'electron'
import { CANAIS_LANCAMENTOS } from '../../shared/lancamentos/canais'
import type { LancamentoEditado, NovoLancamento } from '../../shared/lancamentos/tipos'
import { validarReembolso } from '../../shared/lancamentos/reembolsos'
import { validarNovoLancamento } from '../../shared/lancamentos/validarNovoLancamento'
import {
  atualizarLancamento,
  excluirLancamento,
  inserirLancamento,
  inserirVariosLancamentos,
  listarLancamentos
} from './repositorioLancamentos'

function lancarErroSeInvalido(lancamento: NovoLancamento, prefixo = ''): void {
  const erros = validarNovoLancamento(lancamento)
  if (erros.length > 0) throw new Error(`${prefixo}${erros.join(' ')}`)
}

function lancarErroSeReembolsoInvalido(
  banco: Database,
  lancamento: NovoLancamento,
  idEmEdicao?: number
): void {
  const erros = validarReembolso(lancamento, listarLancamentos(banco), idEmEdicao)
  if (erros.length > 0) throw new Error(erros.join(' '))
}

export function registrarIpcLancamentos(banco: Database): void {
  ipcMain.handle(CANAIS_LANCAMENTOS.listar, () => listarLancamentos(banco))

  ipcMain.handle(CANAIS_LANCAMENTOS.criar, (_evento, novoLancamento: NovoLancamento) => {
    lancarErroSeInvalido(novoLancamento)
    lancarErroSeReembolsoInvalido(banco, novoLancamento)
    return inserirLancamento(banco, novoLancamento)
  })

  ipcMain.handle(CANAIS_LANCAMENTOS.criarVarios, (_evento, novosLancamentos: NovoLancamento[]) => {
    novosLancamentos.forEach((novoLancamento, indice) =>
      lancarErroSeInvalido(novoLancamento, `Item ${indice + 1}: `)
    )
    return inserirVariosLancamentos(banco, novosLancamentos)
  })

  ipcMain.handle(CANAIS_LANCAMENTOS.atualizar, (_evento, lancamento: LancamentoEditado) => {
    lancarErroSeInvalido(lancamento)
    lancarErroSeReembolsoInvalido(banco, lancamento, lancamento.id)
    atualizarLancamento(banco, lancamento)
  })

  ipcMain.handle(CANAIS_LANCAMENTOS.excluir, (_evento, id: number) => excluirLancamento(banco, id))
}
