import { describe, expect, it } from 'vitest'
import type { Destino, Movimentacao } from '../investimentos/tipos'
import type { Lancamento } from '../lancamentos/tipos'
import {
  ROTULO_DE_OUTRAS_CATEGORIAS,
  agruparDespesasPorCategoria,
  calcularPercentualQueSobrou,
  calcularVariacaoPercentual,
  listarUltimosMeses,
  montarSerieDoPatrimonio,
  montarSerieMensal
} from './dadosDosGraficos'

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

describe('listarUltimosMeses', () => {
  it('lista os meses em ordem, terminando no mês final, atravessando o ano', () => {
    expect(listarUltimosMeses('2026-02', 4)).toEqual(['2025-11', '2025-12', '2026-01', '2026-02'])
  })
})

describe('montarSerieMensal', () => {
  it('soma receitas e despesas de cada mês, com zeros nos meses sem lançamento', () => {
    const lancamentos = [
      lancar({ tipo: 'receita', valorCentavos: 500000, data: '2026-09-05' }),
      lancar({ valorCentavos: 15000, data: '2026-09-18' }),
      lancar({ valorCentavos: 8000, data: '2026-07-02' })
    ]

    expect(montarSerieMensal(lancamentos, '2026-09', 3)).toEqual([
      { mes: '2026-07', receitasCentavos: 0, despesasCentavos: 8000 },
      { mes: '2026-08', receitasCentavos: 0, despesasCentavos: 0 },
      { mes: '2026-09', receitasCentavos: 500000, despesasCentavos: 15000 }
    ])
  })
})

describe('montarSerieDoPatrimonio', () => {
  const destino: Destino = {
    id: 1,
    nome: 'CDB',
    tipo: 'investimento',
    taxaRendimentoCentesimos: null,
    periodicidadeDaTaxa: null
  }
  const aporte: Movimentacao = {
    id: 1,
    destinoId: 1,
    tipo: 'aporte',
    valorCentavos: 100000,
    data: '2026-08-15'
  }

  it('mostra o valor guardado ao fim de cada mês', () => {
    const serie = montarSerieDoPatrimonio([destino], [aporte], '2026-09', 3, '2026-09-19')

    expect(serie.map((ponto) => ponto.saldoEstimadoCentavos)).toEqual([0, 100000, 100000])
  })

  it('no mês atual usa a data de hoje, não o fim do mês', () => {
    const futuro: Movimentacao = { ...aporte, id: 2, data: '2026-09-25' }

    const serie = montarSerieDoPatrimonio([destino], [aporte, futuro], '2026-09', 1, '2026-09-19')

    expect(serie[0].saldoEstimadoCentavos).toBe(100000)
  })
})

describe('calcularVariacaoPercentual e calcularPercentualQueSobrou', () => {
  it('calcula a variação em relação ao mês anterior', () => {
    expect(calcularVariacaoPercentual(120, 100)).toBe(20)
    expect(calcularVariacaoPercentual(80, 100)).toBe(-20)
  })

  it('não calcula variação sobre zero', () => {
    expect(calcularVariacaoPercentual(50, 0)).toBeNull()
  })

  it('calcula quanto da renda sobrou', () => {
    expect(calcularPercentualQueSobrou(500000, 350000)).toBe(30)
    expect(calcularPercentualQueSobrou(500000, 600000)).toBe(-20)
  })

  it('sem receita não há percentual', () => {
    expect(calcularPercentualQueSobrou(0, 1000)).toBeNull()
  })
})

describe('agruparDespesasPorCategoria', () => {
  it('soma por categoria, do maior para o menor, e ignora receitas e outros meses', () => {
    const lancamentos = [
      lancar({ categoria: 'Comida', valorCentavos: 30000 }),
      lancar({ categoria: 'comida', valorCentavos: 20000 }),
      lancar({ categoria: 'Lazer', valorCentavos: 50000 }),
      lancar({ categoria: 'Renda', tipo: 'receita', valorCentavos: 999999 }),
      lancar({ categoria: 'Comida', valorCentavos: 77777, data: '2026-08-10' })
    ]

    expect(agruparDespesasPorCategoria(lancamentos, '2026-09')).toEqual([
      { categoria: 'Comida', valorCentavos: 50000, permilagem: 500 },
      { categoria: 'Lazer', valorCentavos: 50000, permilagem: 500 }
    ])
  })

  it('junta o que passa do limite em "Outras"', () => {
    const lancamentos = ['A', 'B', 'C', 'D'].map((categoria, indice) =>
      lancar({ categoria, valorCentavos: (4 - indice) * 1000 })
    )

    const fatias = agruparDespesasPorCategoria(lancamentos, '2026-09', 2)

    expect(fatias.map((fatia) => [fatia.categoria, fatia.valorCentavos])).toEqual([
      ['A', 4000],
      ['B', 3000],
      [ROTULO_DE_OUTRAS_CATEGORIAS, 3000]
    ])
  })

  it('não cria "Outras" quando cabe tudo no limite', () => {
    const fatias = agruparDespesasPorCategoria(
      [lancar({}), lancar({ categoria: 'X' })],
      '2026-09',
      2
    )

    expect(fatias.map((fatia) => fatia.categoria)).not.toContain(ROTULO_DE_OUTRAS_CATEGORIAS)
  })

  it('devolve vazio sem despesas no mês', () => {
    expect(agruparDespesasPorCategoria([], '2026-09')).toEqual([])
  })
})

describe('reembolso nas despesas por categoria', () => {
  it('abate a categoria e some do gráfico quando devolvido por inteiro', () => {
    const lancamentos = [
      lancar({ id: 1, categoria: 'Almoço', valorCentavos: 8000 }),
      lancar({ id: 2, categoria: 'Almoço', valorCentavos: 3000, tipo: 'reembolso' }),
      lancar({ id: 3, categoria: 'Presente', valorCentavos: 5000 }),
      lancar({ id: 4, categoria: 'Presente', valorCentavos: 5000, tipo: 'reembolso' })
    ]

    expect(agruparDespesasPorCategoria(lancamentos, '2026-09')).toEqual([
      { categoria: 'Almoço', valorCentavos: 5000, permilagem: 1000 }
    ])
  })
})
