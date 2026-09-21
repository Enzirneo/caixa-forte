import { calcularProximaOcorrencia } from '../recorrencias/regras'
import type { Recorrencia } from '../recorrencias/tipos'

// O que as recorrências ativas do cartão ainda vão cobrar: a próxima cobrança de cada uma. Ela
// ainda não virou compra (senão já estaria em Comprometido), mas já é certa e ocupa o limite.
export function calcularPrevistoDasRecorrencias(
  recorrencias: Recorrencia[],
  cartaoId: number,
  hojeIso: string
): number {
  return recorrencias
    .filter((recorrencia) => recorrencia.cartaoId === cartaoId && recorrencia.ativa)
    .filter((recorrencia) => calcularProximaOcorrencia(recorrencia, hojeIso) !== null)
    .reduce((total, recorrencia) => total + recorrencia.valorCentavos, 0)
}
