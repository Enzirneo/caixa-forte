import { describe, expect, it } from 'vitest'
import type { Lancamento, TipoLancamento } from '../lancamentos/tipos'
import {
  CATEGORIA_REEMBOLSO,
  ehCategoriaDeReembolso,
  montarSugestoesDeCategoria
} from './categoriasPadrao'

function criarLancamento(tipo: TipoLancamento, categoria: string): Lancamento {
  return {
    id: 1,
    descricao: 'x',
    valorCentavos: 100,
    data: '2026-09-01',
    tipo,
    categoria,
    alteradoEm: '2026-09-01T00:00:00.000Z'
  }
}

describe('ehCategoriaDeReembolso', () => {
  it('ignora maiúscula, acento e espaços', () => {
    expect(ehCategoriaDeReembolso(' reembolso ')).toBe(true)
    expect(ehCategoriaDeReembolso('Comida')).toBe(false)
  })
})

describe('montarSugestoesDeCategoria', () => {
  it('oferece as categorias prontas de despesa, sem Reembolso', () => {
    const sugestoes = montarSugestoesDeCategoria('despesa', [], true)

    expect(sugestoes).toContain('Comida')
    expect(sugestoes).not.toContain('Salário')
    expect(sugestoes).not.toContain(CATEGORIA_REEMBOLSO)
  })

  it('oferece Reembolso primeiro na receita quando ele está disponível', () => {
    const sugestoes = montarSugestoesDeCategoria('receita', [], true)

    expect(sugestoes[0]).toBe(CATEGORIA_REEMBOLSO)
    expect(sugestoes).toContain('Salário')
  })

  it('não oferece Reembolso quando ele não está disponível', () => {
    expect(montarSugestoesDeCategoria('receita', [], false)).not.toContain(CATEGORIA_REEMBOLSO)
  })

  it('junta as categorias que a pessoa já usou naquele tipo, sem repetir', () => {
    const lancamentos = [
      criarLancamento('despesa', 'Date'),
      criarLancamento('despesa', 'comida'),
      criarLancamento('receita', 'Bônus')
    ]

    const sugestoes = montarSugestoesDeCategoria('despesa', lancamentos, true)

    expect(sugestoes).toContain('Date')
    expect(sugestoes).not.toContain('Bônus')
    expect(sugestoes.filter((nome) => nome.toLowerCase() === 'comida')).toHaveLength(1)
  })

  it('não usa a categoria da despesa devolvida como categoria de receita', () => {
    const lancamentos = [criarLancamento('reembolso', 'Comida')]

    expect(montarSugestoesDeCategoria('receita', lancamentos, true)).not.toContain('Comida')
  })
})
