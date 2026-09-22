import { describe, expect, it } from 'vitest'
import type { Lancamento } from '../lancamentos/tipos'
import { filtrarLancamentosDaContaCorrente, pertenceAContaCorrente } from './contaCorrente'
import type { Cartao, VinculoDeCompra } from './tipos'

function lancar(sobrescritas: Partial<Lancamento>): Lancamento {
  return {
    id: 1,
    descricao: 'Item',
    valorCentavos: 1000,
    data: '2026-09-10',
    tipo: 'despesa',
    categoria: 'Geral',
    alteradoEm: '2026-09-10 00:00:00.000',
    ...sobrescritas
  }
}

function cartao(sobrescritas: Partial<Cartao>): Cartao {
  return {
    id: 1,
    nome: 'Itaú',
    diaDeFechamento: 24,
    diaDeVencimento: 1,
    diasAntesDoVencimento: 6,
    limiteCentavos: null,
    pagaPelaContaCorrente: true,
    ...sobrescritas
  }
}

function vincular(sobrescritas: Partial<VinculoDeCompra>): VinculoDeCompra {
  return {
    lancamentoId: 1,
    cartaoId: 1,
    grupoId: 1,
    dataDaCompra: '2026-09-10',
    parcelaNumero: 1,
    parcelasTotal: 1,
    ...sobrescritas
  }
}

describe('pertenceAContaCorrente', () => {
  it('lançamento sem vínculo (comum) sempre conta', () => {
    expect(pertenceAContaCorrente(1, [], [])).toBe(true)
  })

  it('compra de cartão pago pela conta corrente conta', () => {
    expect(pertenceAContaCorrente(1, [vincular({})], [cartao({})])).toBe(true)
  })

  it('compra de cartão que não é pago pela conta corrente não conta', () => {
    const itauPai = cartao({ id: 2, pagaPelaContaCorrente: false })
    expect(pertenceAContaCorrente(1, [vincular({ cartaoId: 2 })], [itauPai])).toBe(false)
  })
})

describe('filtrarLancamentosDaContaCorrente', () => {
  it('tira só as despesas do cartão marcado como fora da conta corrente', () => {
    const daConta = lancar({ id: 1, descricao: 'Mercado' })
    const doOutroCartao = lancar({ id: 2, descricao: 'Presente do pai' })
    const semVinculo = lancar({ id: 3, descricao: 'Salário', tipo: 'receita' })

    const cartoes = [cartao({ id: 1 }), cartao({ id: 2, pagaPelaContaCorrente: false })]
    const vinculos = [
      vincular({ lancamentoId: 1, cartaoId: 1 }),
      vincular({ lancamentoId: 2, cartaoId: 2 })
    ]

    const resultado = filtrarLancamentosDaContaCorrente(
      [daConta, doOutroCartao, semVinculo],
      vinculos,
      cartoes
    )

    expect(resultado.map((lancamento) => lancamento.id)).toEqual([1, 3])
  })
})
