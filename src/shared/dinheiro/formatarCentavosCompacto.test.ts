import { describe, expect, it } from 'vitest'
import { formatarCentavosCompacto } from './formatarCentavosCompacto'

describe('formatarCentavosCompacto', () => {
  it.each([
    [0, 'R$ 0'],
    [80000, 'R$ 800'],
    [100000, 'R$ 1 mil'],
    [150000, 'R$ 1,5 mil'],
    [560000, 'R$ 5,6 mil'],
    [123456789, 'R$ 1,2 mi'],
    [-250000, '-R$ 2,5 mil']
  ])('escreve %i como "%s"', (centavos, esperado) => {
    expect(formatarCentavosCompacto(centavos)).toBe(esperado)
  })
})
