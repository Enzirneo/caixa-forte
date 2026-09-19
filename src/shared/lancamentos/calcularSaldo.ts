import type { Lancamento } from './tipos'

export function calcularSaldoEmCentavos(lancamentos: Lancamento[]): number {
  return lancamentos.reduce(
    (saldo, lancamento) =>
      lancamento.tipo === 'receita'
        ? saldo + lancamento.valorCentavos
        : saldo - lancamento.valorCentavos,
    0
  )
}
