import { describe, expect, it } from 'vitest'
import type { Lancamento } from '../lancamentos/tipos'
import {
  calcularGuardadoNoMes,
  calcularSaldoDaContaCorrente,
  calcularSaldoDaContaNoMes,
  calcularSaldoDoDestino,
  calcularTotalGuardado
} from './calculos'
import type { Movimentacao, NovaMovimentacao, NovoDestino } from './tipos'
import { validarNovaMovimentacao, validarNovoDestino } from './validacoes'

function movimentar(sobrescritas: Partial<Movimentacao>): Movimentacao {
  return {
    id: 1,
    destinoId: 1,
    tipo: 'aporte',
    valorCentavos: 100000,
    data: '2026-09-10',
    ...sobrescritas
  }
}

function lancar(sobrescritas: Partial<Lancamento>): Lancamento {
  return {
    id: 1,
    descricao: 'Item',
    valorCentavos: 0,
    data: '2026-09-05',
    tipo: 'despesa',
    categoria: 'Geral',
    alteradoEm: '2026-09-05 00:00:00.000',
    ...sobrescritas
  }
}

const movimentacoes: Movimentacao[] = [
  movimentar({ id: 1, destinoId: 1, tipo: 'aporte', valorCentavos: 100000, data: '2026-08-10' }),
  movimentar({ id: 2, destinoId: 1, tipo: 'resgate', valorCentavos: 30000, data: '2026-09-12' }),
  movimentar({ id: 3, destinoId: 2, tipo: 'aporte', valorCentavos: 50000, data: '2026-09-15' })
]

describe('cálculos de investimentos', () => {
  it('calcula o saldo de cada destino', () => {
    expect(calcularSaldoDoDestino(movimentacoes, 1)).toBe(70000)
    expect(calcularSaldoDoDestino(movimentacoes, 2)).toBe(50000)
  })

  it('soma o total guardado em todos os destinos', () => {
    expect(calcularTotalGuardado(movimentacoes)).toBe(120000)
  })

  it('calcula o líquido guardado em um mês', () => {
    expect(calcularGuardadoNoMes(movimentacoes, '2026-09')).toBe(20000)
    expect(calcularGuardadoNoMes(movimentacoes, '2026-08')).toBe(100000)
  })

  it('saldo da conta corrente desconta o que foi guardado, sem tratar como despesa', () => {
    const lancamentos = [
      lancar({ id: 1, tipo: 'receita', valorCentavos: 500000 }),
      lancar({ id: 2, tipo: 'despesa', valorCentavos: 100000 })
    ]

    expect(calcularSaldoDaContaCorrente(lancamentos, movimentacoes)).toBe(280000)
  })

  it('o resgate devolve dinheiro para a conta corrente', () => {
    const lancamentos = [lancar({ tipo: 'receita', valorCentavos: 500000 })]
    const aplicouEResgatou = [
      movimentar({ tipo: 'aporte', valorCentavos: 200000 }),
      movimentar({ id: 2, tipo: 'resgate', valorCentavos: 200000 })
    ]

    expect(calcularSaldoDaContaCorrente(lancamentos, aplicouEResgatou)).toBe(500000)
  })

  it('saldo do mês na conta desconta o guardado do mês', () => {
    const resumo = { receitasCentavos: 500000, despesasCentavos: 100000, saldoCentavos: 400000 }

    expect(calcularSaldoDaContaNoMes(resumo, 150000)).toBe(250000)
  })
})

describe('validarNovoDestino', () => {
  const caixinha: NovoDestino = {
    nome: 'Caixinha do banco',
    tipo: 'caixinha',
    taxaRendimentoCentesimos: null,
    periodicidadeDaTaxa: null
  }

  it('aceita destino sem taxa', () => {
    expect(validarNovoDestino(caixinha)).toEqual([])
  })

  it('aceita destino com taxa e periodicidade', () => {
    const cdb = {
      ...caixinha,
      taxaRendimentoCentesimos: 105,
      periodicidadeDaTaxa: 'mensal' as const
    }
    expect(validarNovoDestino(cdb)).toEqual([])
  })

  it('exige taxa e periodicidade juntas', () => {
    expect(validarNovoDestino({ ...caixinha, taxaRendimentoCentesimos: 105 })).toHaveLength(1)
    expect(validarNovoDestino({ ...caixinha, periodicidadeDaTaxa: 'anual' })).toHaveLength(1)
  })

  it('exige nome e rejeita taxa negativa', () => {
    const invalido = {
      ...caixinha,
      nome: '  ',
      taxaRendimentoCentesimos: -1,
      periodicidadeDaTaxa: 'anual' as const
    }
    expect(validarNovoDestino(invalido)).toHaveLength(2)
  })
})

describe('validarNovaMovimentacao', () => {
  const aporte: NovaMovimentacao = {
    destinoId: 1,
    tipo: 'aporte',
    valorCentavos: 10000,
    data: '2026-09-18'
  }

  it('aceita aporte válido, mesmo com destino zerado', () => {
    expect(validarNovaMovimentacao(aporte, 0)).toEqual([])
  })

  it('rejeita valor zero, fracionado ou data inválida', () => {
    expect(validarNovaMovimentacao({ ...aporte, valorCentavos: 0 }, 0)).toHaveLength(1)
    expect(validarNovaMovimentacao({ ...aporte, valorCentavos: 10.5 }, 0)).toHaveLength(1)
    expect(validarNovaMovimentacao({ ...aporte, data: '2026-02-30' }, 0)).toHaveLength(1)
  })

  it('não deixa resgatar mais do que há guardado no destino', () => {
    const resgate = { ...aporte, tipo: 'resgate' as const, valorCentavos: 50001 }

    expect(validarNovaMovimentacao(resgate, 50000)).toHaveLength(1)
    expect(validarNovaMovimentacao({ ...resgate, valorCentavos: 50000 }, 50000)).toEqual([])
  })
})
