import { describe, expect, it } from 'vitest'
import { formatarCentavosComoReal } from './formatarCentavos'

const ESPACO_INSEPARAVEL = ' '

describe('formatarCentavosComoReal', () => {
  it('formata centavos com milhar e vírgula', () => {
    expect(formatarCentavosComoReal(123456)).toBe(`R$${ESPACO_INSEPARAVEL}1.234,56`)
  })

  it('formata zero', () => {
    expect(formatarCentavosComoReal(0)).toBe(`R$${ESPACO_INSEPARAVEL}0,00`)
  })

  it('formata valor negativo', () => {
    expect(formatarCentavosComoReal(-500)).toBe(`-R$${ESPACO_INSEPARAVEL}5,00`)
  })

  it('rejeita valor com casas decimais', () => {
    expect(() => formatarCentavosComoReal(10.5)).toThrow(RangeError)
  })
})
