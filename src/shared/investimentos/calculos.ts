import { obterMesDaData } from '../datas/mes'
import { calcularResumo, type Resumo } from '../lancamentos/resumo'
import type { Lancamento } from '../lancamentos/tipos'
import type { Movimentacao } from './tipos'

function calcularGuardadoLiquido(movimentacoes: Movimentacao[]): number {
  return movimentacoes.reduce(
    (total, movimentacao) =>
      movimentacao.tipo === 'aporte'
        ? total + movimentacao.valorCentavos
        : total - movimentacao.valorCentavos,
    0
  )
}

export function calcularTotalGuardado(movimentacoes: Movimentacao[]): number {
  return calcularGuardadoLiquido(movimentacoes)
}

export function calcularGuardadoNoMes(movimentacoes: Movimentacao[], mes: string): number {
  return calcularGuardadoLiquido(
    movimentacoes.filter((movimentacao) => obterMesDaData(movimentacao.data) === mes)
  )
}

// Só conta o que já aconteceu: uma parcela de cartão de daqui a três meses ainda não saiu da conta.
export function calcularSaldoDaContaCorrente(
  lancamentos: Lancamento[],
  movimentacoes: Movimentacao[],
  hojeIso: string
): number {
  const lancamentosJaOcorridos = lancamentos.filter((lancamento) => lancamento.data <= hojeIso)
  const movimentacoesJaOcorridas = movimentacoes.filter(
    (movimentacao) => movimentacao.data <= hojeIso
  )
  return (
    calcularResumo(lancamentosJaOcorridos).saldoCentavos -
    calcularTotalGuardado(movimentacoesJaOcorridas)
  )
}

export function calcularSaldoDaContaNoMes(resumo: Resumo, guardadoNoMesCentavos: number): number {
  return resumo.saldoCentavos - guardadoNoMesCentavos
}
