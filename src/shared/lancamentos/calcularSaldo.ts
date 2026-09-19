import { calcularResumo } from './resumo'
import type { Lancamento } from './tipos'

export function calcularSaldoEmCentavos(lancamentos: Lancamento[]): number {
  return calcularResumo(lancamentos).saldoCentavos
}
