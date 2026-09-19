import { readSheet } from 'read-excel-file/universal'
import writeXlsxFile, { type SheetData } from 'write-excel-file/node'
import { describe, expect, it } from 'vitest'
import { interpretarPlanilha } from './interpretarEntrada'
import { normalizarCelulasDoXlsx } from './normalizarCelulasDoXlsx'

const DATA_DO_LOTE = '2026-09-18'

async function gravarELerXlsx(linhas: SheetData): Promise<unknown[][]> {
  const arquivo = await writeXlsxFile(linhas).toBuffer()
  const bytes = arquivo.buffer.slice(arquivo.byteOffset, arquivo.byteOffset + arquivo.byteLength)
  return readSheet(bytes as ArrayBuffer)
}

describe('leitura de .xlsx de verdade', () => {
  it('lê uma planilha no formato do modelo, com data, número e texto', async () => {
    const linhasLidas = await gravarELerXlsx([
      [
        { value: 'Data' },
        { value: 'Descrição' },
        { value: 'Valor' },
        { value: 'Tipo' },
        { value: 'Categoria' }
      ],
      [
        { value: new Date(Date.UTC(2026, 8, 10)), type: Date, format: 'dd/mm/yyyy' },
        { value: 'Cinema' },
        { value: 45.9, type: Number },
        { value: 'despesa' },
        { value: 'Lazer' }
      ],
      [
        { value: '05/09/2026' },
        { value: 'Salário' },
        { value: 5000, type: Number },
        { value: 'receita' },
        { value: 'Renda' }
      ]
    ])

    const itens = interpretarPlanilha(normalizarCelulasDoXlsx(linhasLidas), DATA_DO_LOTE)

    expect(itens.map((item) => item.erros)).toEqual([[], []])
    expect(itens.map((item) => item.lancamento)).toEqual([
      {
        descricao: 'Cinema',
        valorCentavos: 4590,
        data: '2026-09-10',
        tipo: 'despesa',
        categoria: 'Lazer'
      },
      {
        descricao: 'Salário',
        valorCentavos: 500000,
        data: '2026-09-05',
        tipo: 'receita',
        categoria: 'Renda'
      }
    ])
  })

  it('aceita valor escrito como texto no formato brasileiro', async () => {
    const linhasLidas = await gravarELerXlsx([
      [{ value: '10/09/2026' }, { value: 'Notebook' }, { value: '3.499,90' }]
    ])

    const [item] = interpretarPlanilha(normalizarCelulasDoXlsx(linhasLidas), DATA_DO_LOTE)

    expect(item.lancamento).toMatchObject({
      descricao: 'Notebook',
      valorCentavos: 349990,
      data: '2026-09-10'
    })
  })
})
