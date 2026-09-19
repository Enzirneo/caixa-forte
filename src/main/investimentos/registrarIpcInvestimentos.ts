import type { Database } from 'better-sqlite3'
import { ipcMain } from 'electron'
import { CANAIS_INVESTIMENTOS } from '../../shared/investimentos/canais'
import type { NovaMovimentacao, NovoDestino } from '../../shared/investimentos/tipos'
import {
  validarExclusaoDeMovimentacao,
  validarNovaMovimentacao,
  validarNovoDestino
} from '../../shared/investimentos/validacoes'
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
  const destino = listarDestinos(banco).find((candidato) => candidato.id === movimentacao.destinoId)
  if (!destino) throw new Error('Destino não encontrado.')

  const movimentacoesExistentes = listarMovimentacoes(banco)
  lancarErroSeInvalido(validarNovaMovimentacao(movimentacao, destino, movimentacoesExistentes))
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

  ipcMain.handle(CANAIS_INVESTIMENTOS.excluirMovimentacao, (_evento, id: number) => {
    lancarErroSeInvalido(
      validarExclusaoDeMovimentacao(listarDestinos(banco), listarMovimentacoes(banco), id)
    )
    excluirMovimentacao(banco, id)
  })
}
