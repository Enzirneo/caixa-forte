import { describe, expect, it } from 'vitest'
import type { Lancamento } from '../lancamentos/tipos'
import { interpretarPlanilha, interpretarTextoColado } from './interpretarEntrada'
import { lerCsv } from './lerCsv'
import { marcarDuplicadas } from './marcarDuplicadas'
import { montarCsvDoModelo } from './modeloDaPlanilha'

const DATA_DO_LOTE = '2026-09-18'

describe('lerCsv', () => {
  it('lê CSV com ponto e vírgula, como o Excel em português salva', () => {
    expect(lerCsv('Data;Descrição;Valor\r\n05/09/2026;Salário;5000,00\r\n')).toEqual([
      ['Data', 'Descrição', 'Valor'],
      ['05/09/2026', 'Salário', '5000,00']
    ])
  })

  it('lê CSV com vírgula e valores entre aspas', () => {
    expect(lerCsv('Descrição,Valor\n"Mercado, feira","1.234,56"')).toEqual([
      ['Descrição', 'Valor'],
      ['Mercado, feira', '1.234,56']
    ])
  })

  it('entende aspas duplas escapadas e ignora a marca de ordem de bytes', () => {
    expect(lerCsv('﻿A;B\n"diz ""oi""";x')).toEqual([
      ['A', 'B'],
      ['diz "oi"', 'x']
    ])
  })

  it('mantém células vazias e aceita arquivo sem quebra de linha no fim', () => {
    expect(lerCsv('a;;c')).toEqual([['a', '', 'c']])
  })
})

describe('modelo da planilha', () => {
  it('o modelo gerado é lido de volta sem nenhum erro', () => {
    const linhas = interpretarPlanilha(lerCsv(montarCsvDoModelo()), DATA_DO_LOTE)

    expect(linhas).toHaveLength(2)
    expect(linhas.every((linha) => linha.erros.length === 0)).toBe(true)
    expect(linhas[0].lancamento).toMatchObject({ descricao: 'Salário', tipo: 'receita' })
  })
})

describe('marcarDuplicadas', () => {
  const existente: Lancamento = {
    id: 1,
    descricao: 'Mercado',
    valorCentavos: 15000,
    data: '2026-09-18',
    tipo: 'despesa',
    categoria: 'Alimentação',
    alteradoEm: '2026-09-18 10:00:00.000'
  }

  it('marca como duplicada a linha igual a um lançamento existente, sem ligar para acento e caixa', () => {
    const linhas = interpretarTextoColado('MERCADO 150,00\nFarmácia 45,90', DATA_DO_LOTE)

    expect(marcarDuplicadas(linhas, [existente]).map((item) => item.duplicada)).toEqual([
      true,
      false
    ])
  })

  it('não marca quando o valor, a data ou o tipo mudam', () => {
    const linhas = interpretarTextoColado(
      'Mercado 150,01\n17/09 Mercado 150,00\n+ Mercado 150,00',
      DATA_DO_LOTE
    )

    expect(marcarDuplicadas(linhas, [existente]).some((item) => item.duplicada)).toBe(false)
  })

  it('linha com erro nunca é duplicada', () => {
    const linhas = interpretarTextoColado('sem valor', DATA_DO_LOTE)

    expect(marcarDuplicadas(linhas, [existente])[0].duplicada).toBe(false)
  })
})
