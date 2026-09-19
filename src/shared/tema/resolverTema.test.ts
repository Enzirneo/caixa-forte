import { describe, expect, it } from 'vitest'
import { interpretarPreferenciaSalva, resolverTema } from './resolverTema'

describe('resolverTema', () => {
  it('respeita a escolha explícita, não importa o sistema', () => {
    expect(resolverTema('claro', true)).toBe('claro')
    expect(resolverTema('escuro', false)).toBe('escuro')
  })

  it('no automático segue o sistema', () => {
    expect(resolverTema('automatico', true)).toBe('escuro')
    expect(resolverTema('automatico', false)).toBe('claro')
  })
})

describe('interpretarPreferenciaSalva', () => {
  it.each(['claro', 'escuro', 'automatico'])('aceita "%s"', (valor) => {
    expect(interpretarPreferenciaSalva(valor)).toBe(valor)
  })

  it('volta para o claro quando não há nada salvo ou o valor é inválido', () => {
    expect(interpretarPreferenciaSalva(null)).toBe('claro')
    expect(interpretarPreferenciaSalva('roxo')).toBe('claro')
    expect(interpretarPreferenciaSalva('')).toBe('claro')
  })
})
