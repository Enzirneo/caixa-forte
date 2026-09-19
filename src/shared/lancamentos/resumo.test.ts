import { describe, expect, it } from 'vitest'
import { calcularResumo, filtrarPorMes, resumirPorMes } from './resumo'
import type { Lancamento } from './tipos'

function criarLancamento(sobrescritas: Partial<Lancamento>): Lancamento {
  return {
    id: 1,
    descricao: 'Item',
    valorCentavos: 1000,
    data: '2026-09-10',
    tipo: 'despesa',
    categoria: 'Geral',
    alteradoEm: '2026-09-01 00:00:00.000',
    ...sobrescritas
  }
}

const lancamentos: Lancamento[] = [
  criarLancamento({ id: 1, tipo: 'receita', valorCentavos: 500000, data: '2026-09-05' }),
  criarLancamento({ id: 2, tipo: 'despesa', valorCentavos: 15000, data: '2026-09-18' }),
  criarLancamento({ id: 3, tipo: 'despesa', valorCentavos: 8000, data: '2026-08-30' })
]

describe('calcularResumo', () => {
  it('separa receitas, despesas e saldo', () => {
    expect(calcularResumo(lancamentos)).toEqual({
      receitasCentavos: 500000,
      despesasCentavos: 23000,
      saldoCentavos: 477000
    })
  })

  it('retorna zeros sem lançamentos', () => {
    expect(calcularResumo([])).toEqual({
      receitasCentavos: 0,
      despesasCentavos: 0,
      saldoCentavos: 0
    })
  })
})

describe('filtrarPorMes', () => {
  it('mantém só os lançamentos do mês', () => {
    const ids = filtrarPorMes(lancamentos, '2026-09').map((lancamento) => lancamento.id)
    expect(ids).toEqual([1, 2])
  })
})

describe('resumirPorMes', () => {
  it('agrupa por mês, do mais recente para o mais antigo', () => {
    expect(resumirPorMes(lancamentos)).toEqual([
      { mes: '2026-09', receitasCentavos: 500000, despesasCentavos: 15000, saldoCentavos: 485000 },
      { mes: '2026-08', receitasCentavos: 0, despesasCentavos: 8000, saldoCentavos: -8000 }
    ])
  })
})
