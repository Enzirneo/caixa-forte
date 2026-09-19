import { describe, expect, it } from 'vitest'
import { canonizarCategoriasDoLote } from './canonizarCategoriasDoLote'
import { interpretarTextoColado } from './interpretarEntrada'

const DATA_DO_LOTE = '2026-09-18'

function categoriasDe(texto: string, existentes: string[]): (string | undefined)[] {
  const linhas = interpretarTextoColado(texto, DATA_DO_LOTE)
  return canonizarCategoriasDoLote(linhas, existentes).map((linha) => linha.lancamento?.categoria)
}

describe('canonizarCategoriasDoLote', () => {
  it('usa a grafia de uma categoria que já existe', () => {
    expect(categoriasDe('Mercado #comida 10,00', ['Comida'])).toEqual(['Comida'])
  })

  it('dentro do lote, a primeira grafia de uma categoria nova vale para as demais', () => {
    expect(categoriasDe('A #Lazer 1,00\nB #lazer 2,00\nC #LAZER 3,00', [])).toEqual([
      'Lazer',
      'Lazer',
      'Lazer'
    ])
  })

  it('não mexe em linhas com erro', () => {
    expect(categoriasDe('sem valor', ['Comida'])).toEqual([undefined])
  })
})
