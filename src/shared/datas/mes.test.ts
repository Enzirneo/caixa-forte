import { describe, expect, it } from 'vitest'
import {
  formatarMesAbreviado,
  formatarMesPorExtenso,
  obterMesDaData,
  obterUltimoDiaDoMes,
  somarMeses
} from './mes'

describe('obterMesDaData', () => {
  it('extrai ano e mês da data', () => {
    expect(obterMesDaData('2026-09-18')).toBe('2026-09')
  })
})

describe('somarMeses', () => {
  it('avança dentro do mesmo ano', () => {
    expect(somarMeses('2026-09', 1)).toBe('2026-10')
  })

  it('vira o ano ao passar de dezembro', () => {
    expect(somarMeses('2026-12', 1)).toBe('2027-01')
  })

  it('volta para o ano anterior a partir de janeiro', () => {
    expect(somarMeses('2026-01', -1)).toBe('2025-12')
  })
})

describe('formatarMesPorExtenso', () => {
  it('escreve o mês em português', () => {
    expect(formatarMesPorExtenso('2026-03')).toBe('março de 2026')
  })
})

describe('obterUltimoDiaDoMes', () => {
  it.each([
    ['2026-09', '2026-09-30'],
    ['2026-12', '2026-12-31'],
    ['2026-02', '2026-02-28'],
    ['2028-02', '2028-02-29']
  ])('o último dia de %s é %s', (mes, esperado) => {
    expect(obterUltimoDiaDoMes(mes)).toBe(esperado)
  })
})

describe('formatarMesAbreviado', () => {
  it('escreve três letras do mês e o ano com dois dígitos', () => {
    expect(formatarMesAbreviado('2026-09')).toBe('set/26')
    expect(formatarMesAbreviado('2027-03')).toBe('mar/27')
  })
})
