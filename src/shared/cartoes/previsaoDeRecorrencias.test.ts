import { describe, expect, it } from 'vitest'
import type { Recorrencia } from '../recorrencias/tipos'
import type { Cartao } from './tipos'
import { montarQuadroDeFaturas } from './faturas'
import { projetarFaturasDasRecorrencias } from './previsaoDeRecorrencias'

function assinar(sobrescritas: Partial<Recorrencia>): Recorrencia {
  return {
    id: 1,
    descricao: 'Disney',
    valorCentavos: 6990,
    tipo: 'despesa',
    categoria: 'Streaming',
    diaDoMes: 26,
    mesDeInicio: '2026-09',
    mesDeFim: null,
    ativa: true,
    cartaoId: 1,
    ...sobrescritas
  }
}

const HOJE = '2026-09-20'

// Vence dia 1 e fecha 6 dias antes: a cobrança do dia 26 já cai na fatura seguinte.
const itau: Cartao = {
  id: 1,
  nome: 'Itaú',
  diaDeFechamento: 24,
  diaDeVencimento: 1,
  diasAntesDoVencimento: 6,
  limiteCentavos: null
}

describe('projetarFaturasDasRecorrencias', () => {
  it('a cobrança do dia 26 cai na fatura de novembro, e não na de outubro', () => {
    const previsoes = projetarFaturasDasRecorrencias([assinar({})], itau, [], HOJE)

    expect(previsoes[0]).toEqual({ mesDoVencimento: '2026-11', totalCentavos: 6990 })
  })

  it('projeta uma cobrança por mês, cada uma na sua fatura', () => {
    const previsoes = projetarFaturasDasRecorrencias([assinar({})], itau, [], HOJE)

    expect(previsoes.map((p) => p.mesDoVencimento)).toEqual([
      '2026-11',
      '2026-12',
      '2027-01',
      '2027-02',
      '2027-03'
    ])
  })

  it('soma as cobranças que caem na mesma fatura', () => {
    const recorrencias = [
      assinar({ id: 1, valorCentavos: 1000, diaDoMes: 26 }),
      assinar({ id: 2, valorCentavos: 500, diaDoMes: 28 })
    ]

    expect(projetarFaturasDasRecorrencias(recorrencias, itau, [], HOJE)[0].totalCentavos).toBe(1500)
  })

  it('respeita o mês de término e ignora pausadas e de outros cartões', () => {
    const recorrencias = [
      assinar({ id: 1, mesDeFim: '2026-10', valorCentavos: 100 }),
      assinar({ id: 2, ativa: false }),
      assinar({ id: 3, cartaoId: 2 })
    ]

    const previsoes = projetarFaturasDasRecorrencias(recorrencias, itau, [], HOJE)

    expect(previsoes).toEqual([
      { mesDoVencimento: '2026-11', totalCentavos: 100 },
      { mesDoVencimento: '2026-12', totalCentavos: 100 }
    ])
  })

  it('usa o ajuste de fechamento do mês', () => {
    const ajustes = [{ cartaoId: 1, mesDoVencimento: '2026-10', melhorDataDeCompra: '2026-09-27' }]

    expect(projetarFaturasDasRecorrencias([assinar({})], itau, ajustes, HOJE)[0]).toEqual({
      mesDoVencimento: '2026-10',
      totalCentavos: 6990
    })
  })
})

describe('montarQuadroDeFaturas', () => {
  const calcularVencimento = (mes: string): string => `${mes}-01`
  const faturaAberta = { mes: '2026-10', totalCentavos: 25647, quantidadeDeItens: 5 }

  it('a fatura aberta soma o já lançado com o que as recorrências ainda vão cobrar nela', () => {
    const quadro = montarQuadroDeFaturas({
      faturas: [faturaAberta],
      previsoes: [{ mesDoVencimento: '2026-10', totalCentavos: 500 }],
      mesDaFaturaAberta: '2026-10',
      calcularVencimento,
      hojeIso: '2026-09-20'
    })

    expect(quadro).toEqual([
      {
        mes: '2026-10',
        vencimento: '2026-10-01',
        situacao: 'aberta',
        lancadoCentavos: 25647,
        previstoCentavos: 500,
        totalCentavos: 26147
      }
    ])
  })

  it('a fatura aberta aparece mesmo sem nada', () => {
    const quadro = montarQuadroDeFaturas({
      faturas: [],
      previsoes: [],
      mesDaFaturaAberta: '2026-10',
      calcularVencimento,
      hojeIso: '2026-09-20'
    })

    expect(quadro.map((linha) => [linha.mes, linha.situacao, linha.totalCentavos])).toEqual([
      ['2026-10', 'aberta', 0]
    ])
  })

  it('fatura que ainda não abriu não aparece só por causa da previsão de recorrência', () => {
    const quadro = montarQuadroDeFaturas({
      faturas: [faturaAberta],
      previsoes: [{ mesDoVencimento: '2026-11', totalCentavos: 25647 }],
      mesDaFaturaAberta: '2026-10',
      calcularVencimento,
      hojeIso: '2026-09-20'
    })

    expect(quadro.map((linha) => linha.mes)).toEqual(['2026-10'])
  })

  it('fatura futura com parcela de verdade aparece, sem somar previsão', () => {
    const quadro = montarQuadroDeFaturas({
      faturas: [faturaAberta, { mes: '2026-11', totalCentavos: 3333, quantidadeDeItens: 1 }],
      previsoes: [{ mesDoVencimento: '2026-11', totalCentavos: 25647 }],
      mesDaFaturaAberta: '2026-10',
      calcularVencimento,
      hojeIso: '2026-09-20'
    })

    expect(quadro[1]).toMatchObject({
      mes: '2026-11',
      situacao: 'futura',
      lancadoCentavos: 3333,
      previstoCentavos: 0,
      totalCentavos: 3333
    })
  })

  it('a fatura já fechada e ainda não vencida continua aparecendo; a já vencida some', () => {
    const quadro = montarQuadroDeFaturas({
      faturas: [
        { mes: '2026-09', totalCentavos: 1000, quantidadeDeItens: 1 },
        { mes: '2026-10', totalCentavos: 6690, quantidadeDeItens: 1 }
      ],
      previsoes: [],
      mesDaFaturaAberta: '2026-11',
      calcularVencimento,
      hojeIso: '2026-09-27'
    })

    expect(quadro.map((linha) => [linha.mes, linha.situacao])).toEqual([
      ['2026-10', 'fechada'],
      ['2026-11', 'aberta']
    ])
  })
})
