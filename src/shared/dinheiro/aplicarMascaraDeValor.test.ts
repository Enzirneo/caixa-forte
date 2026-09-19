import { describe, expect, it } from 'vitest'
import { aplicarMascaraDeValor } from './aplicarMascaraDeValor'
import { converterTextoEmCentavos } from './converterTextoEmCentavos'

describe('aplicarMascaraDeValor', () => {
  it.each([
    ['1', '0,01'],
    ['12', '0,12'],
    ['123', '1,23'],
    ['1234', '12,34'],
    ['123456', '1.234,56'],
    ['123456789', '1.234.567,89']
  ])('digitar %s mostra %s', (digitado, esperado) => {
    expect(aplicarMascaraDeValor(digitado)).toBe(esperado)
  })

  it('reaplicar a máscara sobre o que já está no campo mantém o valor', () => {
    expect(aplicarMascaraDeValor('1.234,56')).toBe('1.234,56')
    expect(aplicarMascaraDeValor('1.234,567')).toBe('12.345,67')
  })

  it('apagar um dígito volta um passo, e apagar tudo esvazia o campo', () => {
    expect(aplicarMascaraDeValor('1.23,4')).toBe('12,34')
    expect(aplicarMascaraDeValor('0,0')).toBe('')
    expect(aplicarMascaraDeValor('')).toBe('')
  })

  it('ignora o que não é dígito e zeros à esquerda', () => {
    expect(aplicarMascaraDeValor('R$ 0,05')).toBe('0,05')
    expect(aplicarMascaraDeValor('abc')).toBe('')
  })

  it('limita o tamanho para o número continuar exato', () => {
    expect(aplicarMascaraDeValor('1234567890123456')).toBe('1.234.567.890,12')
  })

  it('o texto da máscara é lido de volta em centavos sem erro', () => {
    expect(converterTextoEmCentavos(aplicarMascaraDeValor('123456'))).toBe(123456)
    expect(converterTextoEmCentavos(aplicarMascaraDeValor('5'))).toBe(5)
  })
})
