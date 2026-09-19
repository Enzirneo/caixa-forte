import { describe, expect, it } from 'vitest'
import { converterTextoEmCentavos } from './converterTextoEmCentavos'
import { formatarCentavosParaCampo } from './formatarCentavosParaCampo'

describe('formatarCentavosParaCampo', () => {
  it.each([
    [123456, '1234,56'],
    [1250, '12,50'],
    [5, '0,05']
  ])('formata %i como "%s"', (centavos, esperado) => {
    expect(formatarCentavosParaCampo(centavos)).toBe(esperado)
  })

  it('gera um texto que o conversor lê de volta sem perder centavos', () => {
    expect(converterTextoEmCentavos(formatarCentavosParaCampo(98765))).toBe(98765)
  })
})
