import { describe, expect, it } from 'vitest'
import {
  calcularDataDaOcorrencia,
  calcularMesDeInicioAPartirDoLancamento,
  calcularProximaOcorrencia,
  listarCompetenciasVencidas,
  validarNovaRecorrencia
} from './regras'
import type { NovaRecorrencia } from './tipos'

const aluguel: NovaRecorrencia = {
  descricao: 'Aluguel',
  valorCentavos: 120000,
  tipo: 'despesa',
  categoria: 'Moradia',
  diaDoMes: 5,
  mesDeInicio: '2026-07',
  mesDeFim: null
}

describe('calcularDataDaOcorrencia', () => {
  it('usa o dia pedido', () => {
    expect(calcularDataDaOcorrencia('2026-09', 5)).toBe('2026-09-05')
  })

  it('cai no último dia quando o mês é curto', () => {
    expect(calcularDataDaOcorrencia('2026-02', 31)).toBe('2026-02-28')
    expect(calcularDataDaOcorrencia('2028-02', 30)).toBe('2028-02-29')
    expect(calcularDataDaOcorrencia('2026-04', 31)).toBe('2026-04-30')
  })
})

describe('listarCompetenciasVencidas', () => {
  it('lista do mês de início até o mês atual, quando o dia já passou', () => {
    expect(listarCompetenciasVencidas(aluguel, '2026-09-19')).toEqual([
      '2026-07',
      '2026-08',
      '2026-09'
    ])
  })

  it('não inclui o mês atual se o dia ainda não chegou', () => {
    expect(listarCompetenciasVencidas(aluguel, '2026-09-04')).toEqual(['2026-07', '2026-08'])
  })

  it('inclui o mês atual no próprio dia', () => {
    expect(listarCompetenciasVencidas(aluguel, '2026-09-05')).toContain('2026-09')
  })

  it('respeita o mês de término', () => {
    const acabou = { ...aluguel, mesDeFim: '2026-08' }

    expect(listarCompetenciasVencidas(acabou, '2026-12-01')).toEqual(['2026-07', '2026-08'])
  })

  it('não gera nada antes do início', () => {
    expect(
      listarCompetenciasVencidas({ ...aluguel, mesDeInicio: '2026-11' }, '2026-09-19')
    ).toEqual([])
  })

  it('atravessa a virada do ano', () => {
    const anual = { ...aluguel, mesDeInicio: '2025-11' }

    expect(listarCompetenciasVencidas(anual, '2026-01-10')).toEqual([
      '2025-11',
      '2025-12',
      '2026-01'
    ])
  })
})

describe('calcularProximaOcorrencia', () => {
  it('é neste mês se o dia ainda não passou', () => {
    expect(calcularProximaOcorrencia(aluguel, '2026-09-04')).toBe('2026-09-05')
  })

  it('é no mês seguinte se o dia já passou', () => {
    expect(calcularProximaOcorrencia(aluguel, '2026-09-19')).toBe('2026-10-05')
  })

  it('espera o início quando ainda não começou', () => {
    expect(calcularProximaOcorrencia({ ...aluguel, mesDeInicio: '2026-12' }, '2026-09-19')).toBe(
      '2026-12-05'
    )
  })

  it('não há próxima depois do término', () => {
    expect(calcularProximaOcorrencia({ ...aluguel, mesDeFim: '2026-08' }, '2026-09-19')).toBeNull()
  })
})

describe('validarNovaRecorrencia', () => {
  it('aceita uma recorrência válida', () => {
    expect(validarNovaRecorrencia(aluguel)).toEqual([])
  })

  it('exige descrição, categoria e valor positivo', () => {
    const erros = validarNovaRecorrencia({
      ...aluguel,
      descricao: ' ',
      categoria: '',
      valorCentavos: 0
    })

    expect(erros).toHaveLength(3)
  })

  it('rejeita dia fora de 1 a 31 e mês mal escrito', () => {
    expect(validarNovaRecorrencia({ ...aluguel, diaDoMes: 0 })).toHaveLength(1)
    expect(validarNovaRecorrencia({ ...aluguel, diaDoMes: 32 })).toHaveLength(1)
    expect(validarNovaRecorrencia({ ...aluguel, mesDeInicio: 'setembro' })).toHaveLength(1)
  })

  it('o término não pode ser antes do início', () => {
    expect(validarNovaRecorrencia({ ...aluguel, mesDeFim: '2026-06' })).toHaveLength(1)
    expect(validarNovaRecorrencia({ ...aluguel, mesDeFim: '2026-07' })).toEqual([])
  })
})

describe('calcularMesDeInicioAPartirDoLancamento', () => {
  it('começa no mês seguinte ao do lançamento', () => {
    expect(calcularMesDeInicioAPartirDoLancamento('2026-09-05', '2026-09-19')).toBe('2026-10')
  })

  it('lançamento de meses passados não gera recorrência retroativa', () => {
    expect(calcularMesDeInicioAPartirDoLancamento('2026-06-05', '2026-09-19')).toBe('2026-10')
  })

  it('lançamento de mês futuro começa depois dele', () => {
    expect(calcularMesDeInicioAPartirDoLancamento('2026-11-05', '2026-09-19')).toBe('2026-12')
  })

  it('atravessa a virada do ano', () => {
    expect(calcularMesDeInicioAPartirDoLancamento('2026-12-05', '2026-12-10')).toBe('2027-01')
  })
})
