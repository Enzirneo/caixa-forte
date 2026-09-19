import { describe, expect, it } from 'vitest'
import type { Lancamento } from '../lancamentos/tipos'
import { foiAlteradoAposFechamento, validarFechamento } from './regrasDeFechamento'
import type { FechamentoMes } from './tipos'

const fechamentoDeAgosto: FechamentoMes = {
  mes: '2026-08',
  fechadoEm: '2026-09-02 10:00:00.000',
  receitasCentavos: 500000,
  despesasCentavos: 100000
}

function criarLancamento(sobrescritas: Partial<Lancamento>): Lancamento {
  return {
    id: 1,
    descricao: 'Item',
    valorCentavos: 1000,
    data: '2026-08-20',
    tipo: 'despesa',
    categoria: 'Geral',
    alteradoEm: '2026-08-20 09:00:00.000',
    ...sobrescritas
  }
}

describe('validarFechamento', () => {
  it('aceita um mês passado ainda aberto', () => {
    expect(validarFechamento('2026-08', '2026-09', [])).toEqual([])
  })

  it('recusa o mês atual e meses futuros', () => {
    expect(validarFechamento('2026-09', '2026-09', [])).toHaveLength(1)
    expect(validarFechamento('2026-10', '2026-09', [])).toHaveLength(1)
  })

  it('recusa mês já fechado', () => {
    expect(validarFechamento('2026-08', '2026-09', [fechamentoDeAgosto])).toHaveLength(1)
  })

  it('recusa texto que não é um mês', () => {
    expect(validarFechamento('agosto', '2026-09', [])).toHaveLength(1)
    expect(validarFechamento('2026-13', '2026-09', [])).toHaveLength(1)
  })
})

describe('foiAlteradoAposFechamento', () => {
  it('não marca lançamento feito antes do fechamento', () => {
    expect(foiAlteradoAposFechamento(criarLancamento({}), [fechamentoDeAgosto])).toBe(false)
  })

  it('marca lançamento de mês fechado criado ou editado depois do fechamento', () => {
    const tardio = criarLancamento({ alteradoEm: '2026-09-10 08:00:00.000' })
    expect(foiAlteradoAposFechamento(tardio, [fechamentoDeAgosto])).toBe(true)
  })

  it('não marca lançamento de mês que não foi fechado', () => {
    const deSetembro = criarLancamento({
      data: '2026-09-05',
      alteradoEm: '2026-09-10 08:00:00.000'
    })
    expect(foiAlteradoAposFechamento(deSetembro, [fechamentoDeAgosto])).toBe(false)
  })
})
