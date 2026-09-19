import { describe, expect, it } from 'vitest'
import type { Lancamento } from '../lancamentos/tipos'
import {
  agruparComprasPorGrupo,
  calcularComprometidoNoCartao,
  montarFaturas,
  montarRotulosDeCompra
} from './faturas'
import {
  calcularMesDoVencimentoDaPrimeiraParcela,
  calcularVencimentosDasParcelas,
  dividirEmParcelas,
  montarParcelasDaCompra,
  validarNovaCompra,
  validarNovoCartao
} from './regras'
import type { Cartao, NovaCompraNoCartao, VinculoDeCompra } from './tipos'

// Fecha dia 25 e vence dia 5 do mês seguinte, como muitos cartões.
const fechaDia25VenceDia5 = { diaDeFechamento: 25, diaDeVencimento: 5 }
// Fecha dia 10 e vence dia 20 do mesmo mês.
const fechaDia10VenceDia20 = { diaDeFechamento: 10, diaDeVencimento: 20 }

const cartao: Cartao = { id: 1, nome: 'Nubank', ...fechaDia25VenceDia5, limiteCentavos: null }

describe('dividirEmParcelas', () => {
  it('divide igualmente quando dá certo', () => {
    expect(dividirEmParcelas(30000, 3)).toEqual([10000, 10000, 10000])
  })

  it('não perde centavo: as primeiras parcelas levam a sobra', () => {
    expect(dividirEmParcelas(10000, 3)).toEqual([3334, 3333, 3333])
  })

  it.each([
    [99999, 7],
    [1, 1],
    [100, 12],
    [123457, 10]
  ])('a soma de %i em %i parcelas volta ao total', (total, quantidade) => {
    const parcelas = dividirEmParcelas(total, quantidade)

    expect(parcelas.reduce((soma, valor) => soma + valor, 0)).toBe(total)
    expect(Math.max(...parcelas) - Math.min(...parcelas)).toBeLessThanOrEqual(1)
  })
})

describe('calcularMesDoVencimentoDaPrimeiraParcela', () => {
  it('compra antes do fechamento cai na fatura do mês, que vence no mês seguinte', () => {
    expect(calcularMesDoVencimentoDaPrimeiraParcela('2026-09-10', fechaDia25VenceDia5)).toBe(
      '2026-10'
    )
  })

  it('no próprio dia do fechamento ainda entra na fatura que fecha', () => {
    expect(calcularMesDoVencimentoDaPrimeiraParcela('2026-09-25', fechaDia25VenceDia5)).toBe(
      '2026-10'
    )
  })

  it('compra depois do fechamento vai para a fatura seguinte', () => {
    expect(calcularMesDoVencimentoDaPrimeiraParcela('2026-09-26', fechaDia25VenceDia5)).toBe(
      '2026-11'
    )
  })

  it('quando o vencimento é depois do fechamento, vence no mesmo mês', () => {
    expect(calcularMesDoVencimentoDaPrimeiraParcela('2026-09-05', fechaDia10VenceDia20)).toBe(
      '2026-09'
    )
    expect(calcularMesDoVencimentoDaPrimeiraParcela('2026-09-11', fechaDia10VenceDia20)).toBe(
      '2026-10'
    )
  })

  it('atravessa a virada do ano', () => {
    expect(calcularMesDoVencimentoDaPrimeiraParcela('2026-12-28', fechaDia25VenceDia5)).toBe(
      '2027-02'
    )
  })

  it('num mês curto, o fechamento do dia 31 vale até o último dia', () => {
    const fechaDia31 = { diaDeFechamento: 31, diaDeVencimento: 10 }

    expect(calcularMesDoVencimentoDaPrimeiraParcela('2026-02-28', fechaDia31)).toBe('2026-03')
  })
})

describe('calcularVencimentosDasParcelas', () => {
  it('uma parcela por mês, no dia do vencimento', () => {
    expect(calcularVencimentosDasParcelas('2026-09-10', fechaDia25VenceDia5, 3)).toEqual([
      '2026-10-05',
      '2026-11-05',
      '2026-12-05'
    ])
  })

  it('vencimento no dia 31 cai no último dia dos meses curtos', () => {
    const vence31 = { diaDeFechamento: 20, diaDeVencimento: 31 }

    expect(calcularVencimentosDasParcelas('2026-01-05', vence31, 3)).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31'
    ])
  })
})

describe('montarParcelasDaCompra', () => {
  const compra: NovaCompraNoCartao = {
    cartaoId: 1,
    descricao: '  Notebook ',
    valorTotalCentavos: 10000,
    parcelas: 3,
    dataDaCompra: '2026-09-10',
    categoria: 'Tecnologia'
  }

  it('gera uma despesa por parcela, com número na descrição e data no vencimento', () => {
    const parcelas = montarParcelasDaCompra(compra, cartao)

    expect(parcelas.map((parcela) => parcela.lancamento)).toEqual([
      {
        descricao: 'Notebook (1/3)',
        valorCentavos: 3334,
        data: '2026-10-05',
        tipo: 'despesa',
        categoria: 'Tecnologia'
      },
      {
        descricao: 'Notebook (2/3)',
        valorCentavos: 3333,
        data: '2026-11-05',
        tipo: 'despesa',
        categoria: 'Tecnologia'
      },
      {
        descricao: 'Notebook (3/3)',
        valorCentavos: 3333,
        data: '2026-12-05',
        tipo: 'despesa',
        categoria: 'Tecnologia'
      }
    ])
    expect(parcelas.map((parcela) => parcela.parcelaNumero)).toEqual([1, 2, 3])
  })

  it('compra à vista no cartão não leva número na descrição', () => {
    const [unica] = montarParcelasDaCompra({ ...compra, parcelas: 1 }, cartao)

    expect(unica.lancamento.descricao).toBe('Notebook')
    expect(unica.lancamento.valorCentavos).toBe(10000)
  })
})

describe('validações', () => {
  it('valida o cartão', () => {
    expect(
      validarNovoCartao({ nome: 'Nubank', ...fechaDia25VenceDia5, limiteCentavos: null })
    ).toEqual([])
    expect(
      validarNovoCartao({ nome: ' ', diaDeFechamento: 0, diaDeVencimento: 32, limiteCentavos: -1 })
    ).toHaveLength(4)
  })

  const compra: NovaCompraNoCartao = {
    cartaoId: 1,
    descricao: 'Item',
    valorTotalCentavos: 10000,
    parcelas: 2,
    dataDaCompra: '2026-09-10',
    categoria: 'Geral'
  }

  it('valida a compra', () => {
    expect(validarNovaCompra(compra)).toEqual([])
    expect(validarNovaCompra({ ...compra, parcelas: 0 })).toHaveLength(1)
    expect(validarNovaCompra({ ...compra, parcelas: 61 })).toHaveLength(1)
    expect(validarNovaCompra({ ...compra, valorTotalCentavos: 1, parcelas: 2 })).toHaveLength(1)
    expect(validarNovaCompra({ ...compra, dataDaCompra: '2026-02-30' })).toHaveLength(1)
    expect(validarNovaCompra({ ...compra, descricao: ' ', categoria: '' })).toHaveLength(2)
    expect(validarNovaCompra({ ...compra, valorTotalCentavos: 0 })).toHaveLength(1)
  })
})

describe('faturas e compras', () => {
  function lancar(id: number, data: string, valorCentavos: number, descricao = 'Item'): Lancamento {
    return {
      id,
      descricao,
      valorCentavos,
      data,
      tipo: 'despesa',
      categoria: 'Geral',
      alteradoEm: '2026-09-01 00:00:00.000'
    }
  }
  function vincular(
    lancamentoId: number,
    grupoId: number,
    parcelaNumero: number,
    cartaoId = 1
  ): VinculoDeCompra {
    return {
      lancamentoId,
      cartaoId,
      grupoId,
      dataDaCompra: '2026-09-10',
      parcelaNumero,
      parcelasTotal: 2
    }
  }

  const lancamentos = [
    lancar(1, '2026-10-05', 5000, 'Tênis (1/2)'),
    lancar(2, '2026-11-05', 5000, 'Tênis (2/2)'),
    lancar(3, '2026-10-05', 2000, 'Livro'),
    lancar(4, '2026-10-05', 999999, 'Sem cartão')
  ]
  const vinculos = [
    vincular(1, 1, 1),
    vincular(2, 1, 2),
    { ...vincular(3, 3, 1), parcelasTotal: 1 }
  ]

  it('soma cada fatura pelo mês do vencimento, só do cartão pedido', () => {
    expect(montarFaturas(lancamentos, vinculos, 1)).toEqual([
      { mes: '2026-10', totalCentavos: 7000, quantidadeDeItens: 2 },
      { mes: '2026-11', totalCentavos: 5000, quantidadeDeItens: 1 }
    ])
    expect(montarFaturas(lancamentos, vinculos, 2)).toEqual([])
  })

  it('o comprometido é o que ainda vai vencer depois de hoje', () => {
    expect(calcularComprometidoNoCartao(lancamentos, vinculos, 1, '2026-10-05')).toBe(5000)
    expect(calcularComprometidoNoCartao(lancamentos, vinculos, 1, '2026-09-19')).toBe(12000)
  })

  it('agrupa as parcelas de uma compra e tira o "(n/N)" do nome', () => {
    const compras = agruparComprasPorGrupo(lancamentos, vinculos)
    const tenis = compras.find((compra) => compra.grupoId === 1)

    expect(compras).toHaveLength(2)
    expect(tenis).toMatchObject({
      descricao: 'Tênis',
      totalCentavos: 10000,
      parcelasTotal: 2,
      primeiroVencimento: '2026-10-05',
      ultimoVencimento: '2026-11-05'
    })
  })

  it('monta o rótulo que aparece na lista de lançamentos', () => {
    const rotulos = montarRotulosDeCompra(vinculos, [cartao])

    expect(rotulos.get(1)).toBe('Nubank · 1/2 · compra em 10/09/2026')
    expect(rotulos.get(3)).toBe('Nubank · compra em 10/09/2026')
    expect(rotulos.get(4)).toBeUndefined()
  })
})
