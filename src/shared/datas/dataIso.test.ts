import { describe, expect, it } from 'vitest'
import {
  converterTimestampDoBancoEmDataIsoLocal,
  ehDataIsoValida,
  formatarDataIsoComoBrasileira,
  obterDataIsoDeHoje
} from './dataIso'

describe('ehDataIsoValida', () => {
  it('aceita data real', () => {
    expect(ehDataIsoValida('2026-09-18')).toBe(true)
  })

  it('aceita 29 de fevereiro em ano bissexto', () => {
    expect(ehDataIsoValida('2028-02-29')).toBe(true)
  })

  it('rejeita dia que não existe no mês', () => {
    expect(ehDataIsoValida('2026-02-30')).toBe(false)
  })

  it('rejeita formato diferente de AAAA-MM-DD', () => {
    expect(ehDataIsoValida('18/09/2026')).toBe(false)
  })
})

describe('formatarDataIsoComoBrasileira', () => {
  it('converte para DD/MM/AAAA', () => {
    expect(formatarDataIsoComoBrasileira('2026-09-18')).toBe('18/09/2026')
  })
})

describe('obterDataIsoDeHoje', () => {
  it('usa a data local, com zeros à esquerda', () => {
    expect(obterDataIsoDeHoje(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})

describe('converterTimestampDoBancoEmDataIsoLocal', () => {
  it('lê o timestamp do banco como UTC e devolve uma data AAAA-MM-DD', () => {
    expect(converterTimestampDoBancoEmDataIsoLocal('2026-09-19 12:00:00.000')).toBe('2026-09-19')
  })
})
