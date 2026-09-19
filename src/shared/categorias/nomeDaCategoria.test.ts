import { describe, expect, it } from 'vitest'
import type { Lancamento } from '../lancamentos/tipos'
import {
  canonizarNomeDaCategoria,
  gerarChaveDaCategoria,
  listarCategoriasEmUso,
  normalizarEspacos
} from './nomeDaCategoria'

function lancarEm(categoria: string): Lancamento {
  return {
    id: 1,
    descricao: 'Item',
    valorCentavos: 100,
    data: '2026-09-01',
    tipo: 'despesa',
    categoria,
    alteradoEm: '2026-09-01 00:00:00.000'
  }
}

describe('gerarChaveDaCategoria', () => {
  it('ignora maiúsculas, acentos e espaços a mais', () => {
    expect(gerarChaveDaCategoria('  Saúde  Bem-estar ')).toBe('saude bem-estar')
    expect(gerarChaveDaCategoria('ALIMENTAÇÃO')).toBe(gerarChaveDaCategoria('alimentacao'))
  })
})

describe('normalizarEspacos', () => {
  it('apara as pontas e reduz espaços repetidos', () => {
    expect(normalizarEspacos('  Casa   e   Jardim ')).toBe('Casa e Jardim')
  })
})

describe('canonizarNomeDaCategoria', () => {
  it('usa a grafia que já existe quando o nome é equivalente', () => {
    expect(canonizarNomeDaCategoria('comida', ['Comida', 'Transporte'])).toBe('Comida')
    expect(canonizarNomeDaCategoria('  saude ', ['Saúde'])).toBe('Saúde')
  })

  it('mantém o nome, já sem espaços a mais, quando a categoria é nova', () => {
    expect(canonizarNomeDaCategoria('  Pet  Shop ', ['Comida'])).toBe('Pet Shop')
  })
})

describe('listarCategoriasEmUso', () => {
  it('lista cada categoria uma vez, na primeira grafia vista, em ordem alfabética', () => {
    const lancamentos = [
      lancarEm('Transporte'),
      lancarEm('Comida'),
      lancarEm('comida'),
      lancarEm('Saúde'),
      lancarEm('saude')
    ]

    expect(listarCategoriasEmUso(lancamentos)).toEqual(['Comida', 'Saúde', 'Transporte'])
  })

  it('devolve lista vazia sem lançamentos', () => {
    expect(listarCategoriasEmUso([])).toEqual([])
  })
})
