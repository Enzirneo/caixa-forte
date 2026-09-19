import { describe, expect, it } from 'vitest'
import type { NovoLancamento } from './tipos'
import { validarNovoLancamento } from './validarNovoLancamento'

const lancamentoValido: NovoLancamento = {
  descricao: 'Mercado',
  valorCentavos: 15000,
  data: '2026-09-18',
  tipo: 'despesa',
  categoria: 'Alimentação'
}

describe('validarNovoLancamento', () => {
  it('não retorna erros para um lançamento válido', () => {
    expect(validarNovoLancamento(lancamentoValido)).toEqual([])
  })

  it('exige descrição e categoria preenchidas', () => {
    const erros = validarNovoLancamento({ ...lancamentoValido, descricao: '  ', categoria: '' })
    expect(erros).toHaveLength(2)
  })

  it('rejeita valor zero, negativo ou fracionado', () => {
    for (const valorCentavos of [0, -100, 10.5]) {
      expect(validarNovoLancamento({ ...lancamentoValido, valorCentavos })).toHaveLength(1)
    }
  })

  it('rejeita data inexistente', () => {
    expect(validarNovoLancamento({ ...lancamentoValido, data: '2026-02-30' })).toHaveLength(1)
  })
})
