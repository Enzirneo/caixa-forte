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

export function calcularSaldoDoDestino(movimentacoes: Movimentacao[], destinoId: number): number {
  return calcularGuardadoLiquido(
    movimentacoes.filter((movimentacao) => movimentacao.destinoId === destinoId)
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

export function calcularSaldoDaContaCorrente(
  lancamentos: Lancamento[],
  movimentacoes: Movimentacao[]
): number {
  return calcularResumo(lancamentos).saldoCentavos - calcularTotalGuardado(movimentacoes)
}

export function calcularSaldoDaContaNoMes(resumo: Resumo, guardadoNoMesCentavos: number): number {
  return resumo.saldoCentavos - guardadoNoMesCentavos
}
