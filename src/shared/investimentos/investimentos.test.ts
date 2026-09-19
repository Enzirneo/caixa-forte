import { describe, expect, it } from 'vitest'
import type { Lancamento } from '../lancamentos/tipos'
import {
  calcularGuardadoNoMes,
  calcularSaldoDaContaCorrente,
  calcularSaldoDaContaNoMes,
  calcularTotalGuardado
} from './calculos'
import type { Destino, Movimentacao, NovaMovimentacao, NovoDestino } from './tipos'
import {
  validarExclusaoDeMovimentacao,
  validarNovaMovimentacao,
  validarNovoDestino
} from './validacoes'

const HOJE = '2026-12-31'

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

    expect(calcularSaldoDaContaCorrente(lancamentos, movimentacoes, HOJE)).toBe(280000)
  })

  it('o reembolso devolve dinheiro à conta corrente', () => {
    const lancamentos = [
      lancar({ id: 1, tipo: 'despesa', valorCentavos: 10000 }),
      lancar({ id: 2, tipo: 'reembolso', valorCentavos: 10000 })
    ]

    expect(calcularSaldoDaContaCorrente(lancamentos, [], HOJE)).toBe(0)
  })

  it('o resgate devolve dinheiro para a conta corrente', () => {
    const lancamentos = [lancar({ tipo: 'receita', valorCentavos: 500000 })]
    const aplicouEResgatou = [
      movimentar({ tipo: 'aporte', valorCentavos: 200000 }),
      movimentar({ id: 2, tipo: 'resgate', valorCentavos: 200000 })
    ]

    expect(calcularSaldoDaContaCorrente(lancamentos, aplicouEResgatou, HOJE)).toBe(500000)
  })

  it('saldo do mês na conta desconta o guardado do mês', () => {
    const resumo = { receitasCentavos: 500000, despesasCentavos: 100000, saldoCentavos: 400000 }

    expect(calcularSaldoDaContaNoMes(resumo, 150000)).toBe(250000)
  })
})

describe('saldo da conta corrente só com o que já aconteceu', () => {
  it('ignora lançamentos e movimentações com data futura', () => {
    const lancamentos = [
      lancar({ id: 1, tipo: 'receita', valorCentavos: 500000, data: '2026-09-05' }),
      lancar({ id: 2, valorCentavos: 100000, data: '2026-09-10' }),
      lancar({ id: 3, valorCentavos: 300000, data: '2026-11-05' })
    ]
    const guardar = [
      movimentar({ id: 1, valorCentavos: 50000, data: '2026-09-12' }),
      movimentar({ id: 2, valorCentavos: 70000, data: '2026-10-01' })
    ]

    expect(calcularSaldoDaContaCorrente(lancamentos, guardar, '2026-09-19')).toBe(350000)
  })

  it('no próprio dia o lançamento já conta', () => {
    const lancamentos = [lancar({ valorCentavos: 1000, data: '2026-09-19' })]

    expect(calcularSaldoDaContaCorrente(lancamentos, [], '2026-09-19')).toBe(-1000)
    expect(calcularSaldoDaContaCorrente(lancamentos, [], '2026-09-18')).toBe(0)
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
  const cdb: Destino = {
    id: 1,
    nome: 'CDB',
    tipo: 'investimento',
    taxaRendimentoCentesimos: 100,
    periodicidadeDaTaxa: 'mensal'
  }
  const aporte: NovaMovimentacao = {
    destinoId: 1,
    tipo: 'aporte',
    valorCentavos: 100000,
    data: '2026-01-01'
  }

  it('aceita aporte válido, mesmo com destino zerado', () => {
    expect(validarNovaMovimentacao(aporte, cdb, [])).toEqual([])
  })

  it('rejeita valor zero, fracionado ou data inválida', () => {
    expect(validarNovaMovimentacao({ ...aporte, valorCentavos: 0 }, cdb, [])).toHaveLength(1)
    expect(validarNovaMovimentacao({ ...aporte, valorCentavos: 10.5 }, cdb, [])).toHaveLength(1)
    expect(validarNovaMovimentacao({ ...aporte, data: '2026-02-30' }, cdb, [])).toHaveLength(1)
  })

  it('deixa resgatar o que rendeu, mas não mais do que o saldo estimado', () => {
    const existentes = [movimentar({ destinoId: 1, valorCentavos: 100000, data: '2026-01-01' })]
    const resgate = { ...aporte, tipo: 'resgate' as const, data: '2026-01-31' }

    expect(validarNovaMovimentacao({ ...resgate, valorCentavos: 101000 }, cdb, existentes)).toEqual(
      []
    )
    expect(
      validarNovaMovimentacao({ ...resgate, valorCentavos: 101001 }, cdb, existentes)
    ).toHaveLength(1)
  })

  it('não deixa um resgate anterior tirar o saldo de um resgate que já existe', () => {
    const existentes = [
      movimentar({ id: 1, destinoId: 1, valorCentavos: 100000, data: '2026-01-01' }),
      movimentar({
        id: 2,
        destinoId: 1,
        tipo: 'resgate',
        valorCentavos: 100000,
        data: '2026-03-01'
      })
    ]
    const resgateAntes = {
      ...aporte,
      tipo: 'resgate' as const,
      valorCentavos: 50000,
      data: '2026-02-01'
    }

    expect(validarNovaMovimentacao(resgateAntes, cdb, existentes)).toHaveLength(1)
  })
})

describe('validarExclusaoDeMovimentacao', () => {
  const cdb: Destino = {
    id: 1,
    nome: 'CDB',
    tipo: 'investimento',
    taxaRendimentoCentesimos: 100,
    periodicidadeDaTaxa: 'mensal'
  }
  const aporteEResgate = [
    movimentar({ id: 1, destinoId: 1, valorCentavos: 100000, data: '2026-01-01' }),
    movimentar({ id: 2, destinoId: 1, tipo: 'resgate', valorCentavos: 30000, data: '2026-02-01' })
  ]

  it('permite excluir o resgate', () => {
    expect(validarExclusaoDeMovimentacao([cdb], aporteEResgate, 2)).toEqual([])
  })

  it('não deixa excluir um aporte que cobre um resgate', () => {
    expect(validarExclusaoDeMovimentacao([cdb], aporteEResgate, 1)).toHaveLength(1)
  })

  it('recusa movimentação ou destino que não existem', () => {
    expect(validarExclusaoDeMovimentacao([cdb], aporteEResgate, 99)).toHaveLength(1)
    expect(validarExclusaoDeMovimentacao([], aporteEResgate, 1)).toHaveLength(1)
  })
})
