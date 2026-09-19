import { describe, expect, it } from 'vitest'
import { converterTextoEmDataIso } from './converterTextoEmDataIso'
import { interpretarPlanilha, interpretarTextoColado } from './interpretarEntrada'

const DATA_DO_LOTE = '2026-09-18'

function lancamentosDe(texto: string): unknown[] {
  return interpretarTextoColado(texto, DATA_DO_LOTE).map((linha) => linha.lancamento)
}

describe('converterTextoEmDataIso', () => {
  it.each([
    ['18/09/2026', '2026-09-18'],
    ['18/09/26', '2026-09-18'],
    ['5/3', '2026-03-05'],
    ['2026-09-18', '2026-09-18']
  ])('converte "%s" para %s', (texto, esperado) => {
    expect(converterTextoEmDataIso(texto, 2026)).toBe(esperado)
  })

  it.each(['31/02/2026', 'ontem', '', '13/13'])('rejeita "%s"', (texto) => {
    expect(converterTextoEmDataIso(texto, 2026)).toBeNull()
  })
})

describe('interpretarTextoColado — linhas livres', () => {
  it('lê descrição e valor no fim, como despesa', () => {
    expect(lancamentosDe('Mercado 150,00')).toEqual([
      {
        descricao: 'Mercado',
        valorCentavos: 15000,
        data: DATA_DO_LOTE,
        tipo: 'despesa',
        categoria: 'Importado'
      }
    ])
  })

  it('o sinal + marca receita e o - marca despesa', () => {
    const [receita, despesa] = interpretarTextoColado(
      '+ Salário 5000,00\n- Uber 23,90',
      DATA_DO_LOTE
    )

    expect(receita.lancamento).toMatchObject({ tipo: 'receita', valorCentavos: 500000 })
    expect(despesa.lancamento).toMatchObject({ tipo: 'despesa', valorCentavos: 2390 })
  })

  it('aceita milhar, R$ e valor sem centavos', () => {
    expect(lancamentosDe('Notebook R$ 3.499,90')).toMatchObject([{ valorCentavos: 349990 }])
    expect(lancamentosDe('Feira 80')).toMatchObject([{ valorCentavos: 8000 }])
  })

  it('usa a última parte como valor, mesmo com número na descrição', () => {
    expect(lancamentosDe('Coca 2 litros 8,50')).toMatchObject([
      { descricao: 'Coca 2 litros', valorCentavos: 850 }
    ])
  })

  it('lê data no começo e categoria com #', () => {
    expect(lancamentosDe('10/09 Farmácia #Saúde 45,90')).toMatchObject([
      { descricao: 'Farmácia', data: '2026-09-10', categoria: 'Saúde', valorCentavos: 4590 }
    ])
  })

  it('aponta o erro da linha sem perder as outras, com o número original', () => {
    const linhas = interpretarTextoColado(
      'Mercado 150,00\n\nSem valor aqui\n30/02 Erro 10,00',
      DATA_DO_LOTE
    )

    expect(linhas.map((linha) => linha.numeroDaLinha)).toEqual([1, 3, 4])
    expect(linhas[0].erros).toEqual([])
    expect(linhas[1].lancamento).toBeNull()
    expect(linhas[1].erros).toEqual(['Não encontrei o valor no fim da linha.'])
    expect(linhas[2].erros).toEqual(['Data inválida.'])
  })

  it('exige descrição e valor maior que zero', () => {
    expect(interpretarTextoColado('150,00', DATA_DO_LOTE)[0].erros).toContain(
      'Informe a descrição.'
    )
    expect(interpretarTextoColado('Grátis 0,00', DATA_DO_LOTE)[0].erros).toContain(
      'Informe um valor maior que zero.'
    )
  })

  it('ignora linhas em branco', () => {
    expect(interpretarTextoColado('\n  \n', DATA_DO_LOTE)).toEqual([])
  })
})

describe('interpretarTextoColado — tabela colada do Excel', () => {
  it('lê as colunas Data, Descrição, Valor, Tipo e Categoria e ignora o cabeçalho', () => {
    const texto =
      'Data\tDescrição\tValor\tTipo\tCategoria\n05/09/2026\tSalário\t5000,00\treceita\tRenda'

    expect(lancamentosDe(texto)).toEqual([
      {
        descricao: 'Salário',
        valorCentavos: 500000,
        data: '2026-09-05',
        tipo: 'receita',
        categoria: 'Renda'
      }
    ])
  })
})

describe('interpretarPlanilha', () => {
  it('usa a data do lote quando a data está vazia e despesa quando o tipo está vazio', () => {
    const [linha] = interpretarPlanilha([['', 'Padaria', '12,5', '', '']], DATA_DO_LOTE)

    expect(linha.lancamento).toEqual({
      descricao: 'Padaria',
      valorCentavos: 1250,
      data: DATA_DO_LOTE,
      tipo: 'despesa',
      categoria: 'Importado'
    })
  })

  it('aceita valor numérico e data como objeto Date', () => {
    const [linha] = interpretarPlanilha(
      [[new Date(2026, 8, 10), 'Cinema', 45.9, 'despesa', 'Lazer']],
      DATA_DO_LOTE
    )

    expect(linha.lancamento).toMatchObject({ data: '2026-09-10', valorCentavos: 4590 })
  })

  it('arredonda erro de ponto flutuante da planilha em centavos exatos', () => {
    const [linha] = interpretarPlanilha([['', 'Item', 0.1 + 0.2, '', '']], DATA_DO_LOTE)

    expect(linha.lancamento?.valorCentavos).toBe(30)
  })

  it('aponta valor, tipo e data inválidos', () => {
    const [linha] = interpretarPlanilha([['31/02/2026', 'X', 'abc', 'talvez', '']], DATA_DO_LOTE)

    expect(linha.lancamento).toBeNull()
    expect(linha.erros).toEqual([
      'Data inválida.',
      'Valor inválido.',
      'O tipo deve ser receita ou despesa.'
    ])
  })
})
