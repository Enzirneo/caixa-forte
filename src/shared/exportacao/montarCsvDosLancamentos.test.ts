import { describe, expect, it } from 'vitest'
import { interpretarPlanilha } from '../importacao/interpretarEntrada'
import { lerCsv } from '../importacao/lerCsv'
import type { Lancamento } from '../lancamentos/tipos'
import { montarCsvDosLancamentos } from './montarCsvDosLancamentos'

function criarLancamento(sobrescritas: Partial<Lancamento>): Lancamento {
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

describe('montarCsvDosLancamentos', () => {
  it('escreve o cabeçalho e uma linha por lançamento, do mais antigo ao mais novo', () => {
    const csv = montarCsvDosLancamentos([
      criarLancamento({ id: 2, descricao: 'Mercado', valorCentavos: 15000, data: '2026-09-18' }),
      criarLancamento({
        id: 1,
        descricao: 'Salário',
        valorCentavos: 500000,
        data: '2026-09-05',
        tipo: 'receita',
        categoria: 'Renda'
      })
    ])

    expect(csv).toBe(
      '﻿Data;Descrição;Valor;Tipo;Categoria\r\n' +
        '05/09/2026;Salário;5000,00;receita;Renda\r\n' +
        '18/09/2026;Mercado;150,00;despesa;Geral\r\n'
    )
  })

  it('só o cabeçalho quando não há lançamentos', () => {
    expect(montarCsvDosLancamentos([])).toBe('﻿Data;Descrição;Valor;Tipo;Categoria\r\n')
  })

  it('protege ponto e vírgula, aspas e quebra de linha na descrição', () => {
    const csv = montarCsvDosLancamentos([
      criarLancamento({ descricao: 'Pão; "artesanal"\nfresco' })
    ])

    expect(csv).toContain('"Pão; ""artesanal""\nfresco"')
  })

  it('o arquivo exportado é importado de volta sem perder nada', () => {
    const originais = [
      criarLancamento({
        id: 1,
        descricao: 'Pão; "artesanal"',
        valorCentavos: 1250,
        categoria: 'Comida'
      }),
      criarLancamento({
        id: 2,
        descricao: 'Salário',
        valorCentavos: 123456789,
        data: '2026-01-05',
        tipo: 'receita',
        categoria: 'Renda'
      })
    ]

    const importados = interpretarPlanilha(lerCsv(montarCsvDosLancamentos(originais)), '2026-09-19')

    expect(importados.every((linha) => linha.erros.length === 0)).toBe(true)
    expect(importados.map((linha) => linha.lancamento)).toEqual([
      {
        descricao: 'Salário',
        valorCentavos: 123456789,
        data: '2026-01-05',
        tipo: 'receita',
        categoria: 'Renda'
      },
      {
        descricao: 'Pão; "artesanal"',
        valorCentavos: 1250,
        data: '2026-09-10',
        tipo: 'despesa',
        categoria: 'Comida'
      }
    ])
  })
})
