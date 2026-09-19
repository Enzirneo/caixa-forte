import { describe, expect, it } from 'vitest'
import { converterTextoEmCentesimosDePercentual, formatarTaxa } from './taxa'

describe('converterTextoEmCentesimosDePercentual', () => {
  it.each([
    ['1,05', 105],
    ['12', 1200],
    ['0,5', 50],
    ['13,75%', 1375],
    ['0', 0]
  ])('converte "%s" para %i', (texto, esperado) => {
    expect(converterTextoEmCentesimosDePercentual(texto)).toBe(esperado)
  })

  it.each(['', 'abc', '1,234', '-1', '1.5', '1,2,3'])('rejeita "%s"', (texto) => {
    expect(converterTextoEmCentesimosDePercentual(texto)).toBeNull()
  })
})

describe('formatarTaxa', () => {
  it('escreve a taxa com a periodicidade', () => {
    expect(formatarTaxa(105, 'mensal')).toBe('1,05% ao mês')
    expect(formatarTaxa(1200, 'anual')).toBe('12,00% ao ano')
  })
})
