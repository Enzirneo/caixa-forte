import { describe, expect, it } from 'vitest'
import type { Lancamento } from '../lancamentos/tipos'
import {
  canonizarNomeDaCategoria,
  capitalizarPrimeiraLetra,
  filtrarSugestoesDeCategoria,
  formatarNomeDaCategoria,
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

describe('primeira letra sempre maiúscula', () => {
  it('capitaliza só a primeira letra, inclusive com acento', () => {
    expect(capitalizarPrimeiraLetra('concurso')).toBe('Concurso')
    expect(capitalizarPrimeiraLetra('émulo')).toBe('Émulo')
    expect(capitalizarPrimeiraLetra('pet SHOP')).toBe('Pet SHOP')
    expect(capitalizarPrimeiraLetra('')).toBe('')
  })

  it('formata o nome: apara os espaços e capitaliza', () => {
    expect(formatarNomeDaCategoria('  contas   da casa ')).toBe('Contas da casa')
  })

  it('categoria nova digitada em minúscula vira maiúscula ao ser reconhecida', () => {
    expect(canonizarNomeDaCategoria('lazer', ['Comida'])).toBe('Lazer')
  })

  it('a grafia de uma categoria que já existe continua valendo', () => {
    expect(canonizarNomeDaCategoria('concurso', ['Concurso'])).toBe('Concurso')
  })
})

describe('filtrarSugestoesDeCategoria', () => {
  const sugestoes = ['Alimentação', 'Comida', 'Saúde', 'Transporte']

  it('mostra tudo quando nada foi digitado', () => {
    expect(filtrarSugestoesDeCategoria(sugestoes, '  ')).toEqual(sugestoes)
  })

  it('filtra por trecho, sem ligar para maiúscula nem acento', () => {
    expect(filtrarSugestoesDeCategoria(sugestoes, 'ALIM')).toEqual(['Alimentação'])
    expect(filtrarSugestoesDeCategoria(sugestoes, 'saude')).toEqual(['Saúde'])
    expect(filtrarSugestoesDeCategoria(sugestoes, 'o')).toEqual([
      'Alimentação',
      'Comida',
      'Transporte'
    ])
  })

  it('sem correspondência, lista vazia', () => {
    expect(filtrarSugestoesDeCategoria(sugestoes, 'xyz')).toEqual([])
  })
})
