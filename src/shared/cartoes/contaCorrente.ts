import type { Lancamento } from '../lancamentos/tipos'
import type { Cartao, VinculoDeCompra } from './tipos'

// Um lançamento sem vínculo é um lançamento comum: sempre conta. Um lançamento de cartão só conta
// se o cartão for pago pela conta corrente (cartão de outra pessoa não mexe no saldo dela).
export function pertenceAContaCorrente(
  lancamentoId: number,
  vinculos: VinculoDeCompra[],
  cartoes: Cartao[]
): boolean {
  const vinculo = vinculos.find((candidato) => candidato.lancamentoId === lancamentoId)
  if (!vinculo) return true

  const cartao = cartoes.find((candidato) => candidato.id === vinculo.cartaoId)
  return cartao?.pagaPelaContaCorrente ?? true
}

// Para os totais e gráficos que representam a conta corrente: tira as despesas de cartões que não
// são pagos por ela. Elas continuam aparecendo na lista de lançamentos e na aba Cartões.
export function filtrarLancamentosDaContaCorrente(
  lancamentos: Lancamento[],
  vinculos: VinculoDeCompra[],
  cartoes: Cartao[]
): Lancamento[] {
  return lancamentos.filter((lancamento) =>
    pertenceAContaCorrente(lancamento.id, vinculos, cartoes)
  )
}
