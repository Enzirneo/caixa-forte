import { describe, expect, it } from 'vitest'
import { calcularPatrimonio, calcularPosicaoDoDestino, existeResgateSemSaldo } from './rendimento'
import type { Destino, Movimentacao } from './tipos'

const semTaxa: Destino = {
  id: 1,
  nome: 'Caixinha',
  tipo: 'caixinha',
  taxaRendimentoCentesimos: null,
  periodicidadeDaTaxa: null
}

const umPorCentoAoMes: Destino = {
  ...semTaxa,
  id: 2,
  nome: 'CDB',
  tipo: 'investimento',
  taxaRendimentoCentesimos: 100,
  periodicidadeDaTaxa: 'mensal'
}

const dozePorCentoAoAno: Destino = {
  ...umPorCentoAoMes,
  id: 3,
  taxaRendimentoCentesimos: 1200,
  periodicidadeDaTaxa: 'anual'
}

function movimentar(sobrescritas: Partial<Movimentacao>): Movimentacao {
  return {
    id: 1,
    destinoId: 2,
    tipo: 'aporte',
    valorCentavos: 100000,
    data: '2026-01-01',
    ...sobrescritas
  }
}

describe('calcularPosicaoDoDestino', () => {
  it('sem taxa, o saldo é só o que foi aplicado e não há rendimento', () => {
    const posicao = calcularPosicaoDoDestino(semTaxa, [movimentar({ destinoId: 1 })], '2027-01-01')

    expect(posicao).toEqual({
      aplicadoCentavos: 100000,
      saldoEstimadoCentavos: 100000,
      rendimentoEstimadoCentavos: 0
    })
  })

  it('rende 1% ao mês em 30 dias', () => {
    const posicao = calcularPosicaoDoDestino(umPorCentoAoMes, [movimentar({})], '2026-01-31')

    expect(posicao.saldoEstimadoCentavos).toBe(101000)
    expect(posicao.rendimentoEstimadoCentavos).toBe(1000)
  })

  it('capitaliza juros sobre juros', () => {
    const posicao = calcularPosicaoDoDestino(umPorCentoAoMes, [movimentar({})], '2026-03-02')

    expect(posicao.saldoEstimadoCentavos).toBe(102010)
  })

  it('rende 12% ao ano em 365 dias', () => {
    const posicao = calcularPosicaoDoDestino(
      dozePorCentoAoAno,
      [movimentar({ destinoId: 3 })],
      '2027-01-01'
    )

    expect(posicao.saldoEstimadoCentavos).toBe(112000)
  })

  it('não rende antes da data do primeiro aporte', () => {
    const posicao = calcularPosicaoDoDestino(
      umPorCentoAoMes,
      [movimentar({ data: '2026-06-01' })],
      '2026-03-01'
    )

    expect(posicao).toEqual({
      aplicadoCentavos: 0,
      saldoEstimadoCentavos: 0,
      rendimentoEstimadoCentavos: 0
    })
  })

  it('um novo aporte passa a render só a partir da sua data', () => {
    const posicao = calcularPosicaoDoDestino(
      umPorCentoAoMes,
      [movimentar({}), movimentar({ id: 2, data: '2026-01-31' })],
      '2026-01-31'
    )

    expect(posicao.saldoEstimadoCentavos).toBe(201000)
  })

  it('considera o resgate, inclusive de parte do que rendeu', () => {
    const posicao = calcularPosicaoDoDestino(
      umPorCentoAoMes,
      [
        movimentar({}),
        movimentar({ id: 2, tipo: 'resgate', valorCentavos: 101000, data: '2026-01-31' })
      ],
      '2026-01-31'
    )

    expect(posicao.saldoEstimadoCentavos).toBe(0)
    expect(posicao.aplicadoCentavos).toBe(-1000)
    expect(posicao.rendimentoEstimadoCentavos).toBe(1000)
  })

  it('ignora movimentações de outros destinos e posteriores à data', () => {
    const posicao = calcularPosicaoDoDestino(
      umPorCentoAoMes,
      [
        movimentar({}),
        movimentar({ id: 2, destinoId: 9, valorCentavos: 999999 }),
        movimentar({ id: 3, valorCentavos: 50000, data: '2026-12-01' })
      ],
      '2026-01-31'
    )

    expect(posicao.aplicadoCentavos).toBe(100000)
  })
})

describe('calcularPatrimonio', () => {
  it('soma o saldo e o rendimento de todos os destinos', () => {
    const movimentacoes = [movimentar({ id: 1, destinoId: 1 }), movimentar({ id: 2, destinoId: 2 })]

    expect(calcularPatrimonio([semTaxa, umPorCentoAoMes], movimentacoes, '2026-01-31')).toEqual({
      saldoEstimadoCentavos: 201000,
      rendimentoEstimadoCentavos: 1000
    })
  })
})

describe('existeResgateSemSaldo', () => {
  it('aceita retirar o que rendeu', () => {
    const movimentacoes = [
      movimentar({}),
      movimentar({ id: 2, tipo: 'resgate', valorCentavos: 101000, data: '2026-01-31' })
    ]

    expect(existeResgateSemSaldo(umPorCentoAoMes, movimentacoes)).toBe(false)
  })

  it('recusa resgate maior que o saldo estimado na data', () => {
    const movimentacoes = [
      movimentar({}),
      movimentar({ id: 2, tipo: 'resgate', valorCentavos: 101001, data: '2026-01-31' })
    ]

    expect(existeResgateSemSaldo(umPorCentoAoMes, movimentacoes)).toBe(true)
  })

  it('recusa resgate feito antes do aporte que o cobriria', () => {
    const movimentacoes = [
      movimentar({ data: '2026-02-01' }),
      movimentar({ id: 2, tipo: 'resgate', valorCentavos: 50000, data: '2026-01-15' })
    ]

    expect(existeResgateSemSaldo(umPorCentoAoMes, movimentacoes)).toBe(true)
  })

  it('aceita aporte e resgate no mesmo dia', () => {
    const movimentacoes = [
      movimentar({ tipo: 'resgate', id: 2, valorCentavos: 100000 }),
      movimentar({ id: 1 })
    ]

    expect(existeResgateSemSaldo(umPorCentoAoMes, movimentacoes)).toBe(false)
  })

  it('não há problema quando o destino não tem movimentações', () => {
    expect(existeResgateSemSaldo(umPorCentoAoMes, [])).toBe(false)
  })
})
