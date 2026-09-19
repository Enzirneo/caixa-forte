import { describe, expect, it } from 'vitest'
import { converterTextoEmCentavos } from './converterTextoEmCentavos'

describe('converterTextoEmCentavos', () => {
  it.each([
    ['1.234,56', 123456],
    ['12,5', 1250],
    ['12', 1200],
    ['R$ 0,99', 99],
    ['1234,56', 123456],
    ['0', 0]
  ])('converte "%s" para %i centavos', (texto, esperado) => {
    expect(converterTextoEmCentavos(texto)).toBe(esperado)
  })

  it.each(['', 'abc', '12,345', '1,2,3', '-5', '12.5'])('rejeita "%s"', (texto) => {
    expect(converterTextoEmCentavos(texto)).toBeNull()
  })
})
