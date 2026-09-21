import { describe, expect, it } from 'vitest'
import type { Recorrencia } from '../recorrencias/tipos'
import type { Cartao } from './tipos'
import { montarQuadroDeFaturas } from './faturas'
import {
  calcularPrevistoDasRecorrencias,
  projetarFaturasDasRecorrencias
} from './previsaoDeRecorrencias'

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

describe('calcularPrevistoDasRecorrencias', () => {
  it('soma a próxima cobrança de cada recorrência ativa do cartão', () => {
    const recorrencias = [
      assinar({ id: 1, valorCentavos: 11636, diaDoMes: 26 }),
      assinar({ id: 2, valorCentavos: 2399, diaDoMes: 28 })
    ]

    expect(calcularPrevistoDasRecorrencias(recorrencias, 1, HOJE)).toBe(14035)
  })

  it('ignora recorrência de outro cartão, sem cartão ou pausada', () => {
    const recorrencias = [
      assinar({ id: 1, cartaoId: 2 }),
      assinar({ id: 2, cartaoId: null }),
      assinar({ id: 3, ativa: false }),
      assinar({ id: 4, valorCentavos: 1000 })
    ]

    expect(calcularPrevistoDasRecorrencias(recorrencias, 1, HOJE)).toBe(1000)
  })

  it('ignora recorrência que já terminou', () => {
    const encerrada = assinar({ mesDeFim: '2026-08', mesDeInicio: '2026-01' })

    expect(calcularPrevistoDasRecorrencias([encerrada], 1, HOJE)).toBe(0)
  })
})

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
  const faturas = [{ mes: '2026-10', totalCentavos: 6690, quantidadeDeItens: 1 }]
  const previsoes = [{ mesDoVencimento: '2026-11', totalCentavos: 17870 }]

  it('mostra a fatura aberta e as próximas, com o lançado, o previsto e o total', () => {
    const quadro = montarQuadroDeFaturas({
      faturas,
      previsoes,
      mesDaFaturaAberta: '2026-10',
      calcularVencimento,
      hojeIso: '2026-09-20'
    })

    expect(quadro).toEqual([
      {
        mes: '2026-10',
        vencimento: '2026-10-01',
        situacao: 'aberta',
        lancadoCentavos: 6690,
        previstoCentavos: 0,
        totalCentavos: 6690
      },
      {
        mes: '2026-11',
        vencimento: '2026-11-01',
        situacao: 'futura',
        lancadoCentavos: 0,
        previstoCentavos: 17870,
        totalCentavos: 17870
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

  it('a fatura já fechada e ainda não vencida continua aparecendo; a já vencida some', () => {
    const quadro = montarQuadroDeFaturas({
      faturas: [
        { mes: '2026-09', totalCentavos: 1000, quantidadeDeItens: 1 },
        { mes: '2026-10', totalCentavos: 6690, quantidadeDeItens: 1 }
      ],
      previsoes,
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
