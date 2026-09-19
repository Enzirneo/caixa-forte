import { describe, expect, it } from 'vitest'
import { calcularSaldoEmCentavos } from './calcularSaldo'
import type { Lancamento, NovoLancamento } from './tipos'
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

describe('calcularSaldoEmCentavos', () => {
  it('soma receitas e subtrai despesas', () => {
    const lancamentos: Lancamento[] = [
      { ...lancamentoValido, id: 1, tipo: 'receita', valorCentavos: 500000 },
      { ...lancamentoValido, id: 2, tipo: 'despesa', valorCentavos: 15000 },
      { ...lancamentoValido, id: 3, tipo: 'despesa', valorCentavos: 4990 }
    ]
    expect(calcularSaldoEmCentavos(lancamentos)).toBe(480010)
  })

  it('retorna zero sem lançamentos', () => {
    expect(calcularSaldoEmCentavos([])).toBe(0)
  })
})
