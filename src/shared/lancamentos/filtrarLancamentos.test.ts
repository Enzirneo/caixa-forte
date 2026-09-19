import { describe, expect, it } from 'vitest'
import {
  FILTRO_PADRAO_DE_LANCAMENTOS,
  aplicarFiltroDeLancamentos,
  filtroEstaAtivo,
  type FiltroDeLancamentos
} from './filtrarLancamentos'
import type { Lancamento } from './tipos'

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

const lancamentos = [
  lancar({
    id: 1,
    descricao: 'Mercado',
    valorCentavos: 15000,
    data: '2026-09-05',
    categoria: 'Alimentação'
  }),
  lancar({
    id: 2,
    descricao: 'Salário',
    valorCentavos: 500000,
    data: '2026-09-05',
    tipo: 'receita',
    categoria: 'Renda'
  }),
  lancar({
    id: 3,
    descricao: 'Uber',
    valorCentavos: 2390,
    data: '2026-09-20',
    categoria: 'Transporte'
  }),
  lancar({
    id: 4,
    descricao: 'Padaria',
    valorCentavos: 1250,
    data: '2026-09-12',
    categoria: 'Alimentação'
  })
]

function filtrar(parte: Partial<FiltroDeLancamentos>): number[] {
  return aplicarFiltroDeLancamentos(lancamentos, { ...FILTRO_PADRAO_DE_LANCAMENTOS, ...parte }).map(
    (lancamento) => lancamento.id
  )
}

describe('ordenação', () => {
  it('por padrão, do mais novo para o mais antigo, desempatando pelo mais recente lançado', () => {
    expect(filtrar({})).toEqual([3, 4, 2, 1])
  })

  it('do mais antigo para o mais novo', () => {
    expect(filtrar({ ordenacao: 'data-asc' })).toEqual([1, 2, 4, 3])
  })

  it('do maior para o menor valor, e do menor para o maior', () => {
    expect(filtrar({ ordenacao: 'valor-desc' })).toEqual([2, 1, 3, 4])
    expect(filtrar({ ordenacao: 'valor-asc' })).toEqual([4, 3, 1, 2])
  })

  it('por categoria em ordem alfabética, desempatando pelo mais novo', () => {
    expect(filtrar({ ordenacao: 'categoria-asc' })).toEqual([4, 1, 2, 3])
    expect(filtrar({ ordenacao: 'categoria-desc' })).toEqual([3, 2, 4, 1])
  })

  it('não altera a lista original', () => {
    const copia = [...lancamentos]

    aplicarFiltroDeLancamentos(lancamentos, {
      ...FILTRO_PADRAO_DE_LANCAMENTOS,
      ordenacao: 'valor-asc'
    })

    expect(lancamentos).toEqual(copia)
  })
})

describe('filtros', () => {
  it('por tipo', () => {
    expect(filtrar({ tipo: 'receita' })).toEqual([2])
    expect(filtrar({ tipo: 'despesa' })).toEqual([3, 4, 1])
  })

  it('por categoria, sem ligar para maiúscula nem acento', () => {
    expect(filtrar({ categoria: 'alimentacao' })).toEqual([4, 1])
  })

  it('por faixa de valor, com os limites incluídos', () => {
    expect(filtrar({ valorMinimoCentavos: 2390, valorMaximoCentavos: 15000 })).toEqual([3, 1])
    expect(filtrar({ valorMinimoCentavos: 20000 })).toEqual([2])
    expect(filtrar({ valorMaximoCentavos: 1250 })).toEqual([4])
  })

  it('por texto, na descrição ou na categoria', () => {
    expect(filtrar({ texto: 'PADAR' })).toEqual([4])
    expect(filtrar({ texto: 'transp' })).toEqual([3])
    expect(filtrar({ texto: 'alimentacao' })).toEqual([4, 1])
  })

  it('os filtros se combinam', () => {
    expect(filtrar({ categoria: 'Alimentação', valorMinimoCentavos: 5000 })).toEqual([1])
    expect(filtrar({ tipo: 'receita', categoria: 'Alimentação' })).toEqual([])
  })
})

describe('filtroEstaAtivo', () => {
  it('o padrão não é filtro, e mudar só a ordem também não', () => {
    expect(filtroEstaAtivo(FILTRO_PADRAO_DE_LANCAMENTOS)).toBe(false)
    expect(filtroEstaAtivo({ ...FILTRO_PADRAO_DE_LANCAMENTOS, ordenacao: 'valor-desc' })).toBe(
      false
    )
  })

  it('qualquer critério liga o filtro', () => {
    expect(filtroEstaAtivo({ ...FILTRO_PADRAO_DE_LANCAMENTOS, texto: 'a' })).toBe(true)
    expect(filtroEstaAtivo({ ...FILTRO_PADRAO_DE_LANCAMENTOS, tipo: 'receita' })).toBe(true)
    expect(filtroEstaAtivo({ ...FILTRO_PADRAO_DE_LANCAMENTOS, valorMaximoCentavos: 0 })).toBe(true)
  })

  it('espaços sozinhos no texto não contam', () => {
    expect(filtroEstaAtivo({ ...FILTRO_PADRAO_DE_LANCAMENTOS, texto: '   ' })).toBe(false)
  })
})
