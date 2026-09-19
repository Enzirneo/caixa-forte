import { describe, expect, it } from 'vitest'
import {
  CONFIGURACAO_PADRAO,
  interpretarConfiguracao,
  serializarConfiguracao
} from './configuracao'

const PASTA = 'C:\\Users\\enzob\\OneDrive\\FNox'

describe('interpretarConfiguracao', () => {
  it('lê a pasta salva', () => {
    const texto = JSON.stringify({ pastaDeBackupExterna: PASTA })

    expect(interpretarConfiguracao(texto)).toEqual({ pastaDeBackupExterna: PASTA })
  })

  it('sem arquivo, usa o padrão', () => {
    expect(interpretarConfiguracao(null)).toEqual(CONFIGURACAO_PADRAO)
  })

  it.each(['', 'isto não é json', '[]', '"texto"', 'null', '{"pastaDeBackupExterna": 42}'])(
    'conteúdo inválido (%s) volta ao padrão sem quebrar',
    (texto) => {
      expect(interpretarConfiguracao(texto)).toEqual(CONFIGURACAO_PADRAO)
    }
  )

  it('trata pasta em branco como nenhuma pasta', () => {
    expect(interpretarConfiguracao('{"pastaDeBackupExterna": "   "}')).toEqual(CONFIGURACAO_PADRAO)
  })

  it('o que é serializado é lido de volta igual, com barras invertidas', () => {
    const configuracao = { pastaDeBackupExterna: PASTA }

    expect(interpretarConfiguracao(serializarConfiguracao(configuracao))).toEqual(configuracao)
  })
})
