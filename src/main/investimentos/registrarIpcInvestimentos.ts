import type { Database } from 'better-sqlite3'
import { ipcMain } from 'electron'
import { calcularSaldoDoDestino } from '../../shared/investimentos/calculos'
import { CANAIS_INVESTIMENTOS } from '../../shared/investimentos/canais'
import type { NovaMovimentacao, NovoDestino } from '../../shared/investimentos/tipos'
import { validarNovaMovimentacao, validarNovoDestino } from '../../shared/investimentos/validacoes'
import {
  excluirMovimentacao,
  inserirDestino,
  inserirMovimentacao,
  listarDestinos,
  listarMovimentacoes
} from './repositorioInvestimentos'

function lancarErroSeInvalido(erros: string[]): void {
  if (erros.length > 0) throw new Error(erros.join(' '))
}

function validarMovimentacaoContraOBanco(banco: Database, movimentacao: NovaMovimentacao): void {
  const destinoExiste = listarDestinos(banco).some(
    (destino) => destino.id === movimentacao.destinoId
  )
  if (!destinoExiste) throw new Error('Destino não encontrado.')

  const saldoAtual = calcularSaldoDoDestino(listarMovimentacoes(banco), movimentacao.destinoId)
  lancarErroSeInvalido(validarNovaMovimentacao(movimentacao, saldoAtual))
}

export function registrarIpcInvestimentos(banco: Database): void {
  ipcMain.handle(CANAIS_INVESTIMENTOS.listarDestinos, () => listarDestinos(banco))

  ipcMain.handle(CANAIS_INVESTIMENTOS.criarDestino, (_evento, novoDestino: NovoDestino) => {
    lancarErroSeInvalido(validarNovoDestino(novoDestino))
    return inserirDestino(banco, novoDestino)
  })

  ipcMain.handle(CANAIS_INVESTIMENTOS.listarMovimentacoes, () => listarMovimentacoes(banco))

  ipcMain.handle(
    CANAIS_INVESTIMENTOS.criarMovimentacao,
    (_evento, movimentacao: NovaMovimentacao) => {
      validarMovimentacaoContraOBanco(banco, movimentacao)
      return inserirMovimentacao(banco, movimentacao)
    }
  )

  ipcMain.handle(CANAIS_INVESTIMENTOS.excluirMovimentacao, (_evento, id: number) =>
    excluirMovimentacao(banco, id)
  )
}
