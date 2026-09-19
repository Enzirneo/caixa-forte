import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { lerConfiguracaoDe, salvarConfiguracaoEm } from './arquivoDeConfiguracao'

describe('arquivo de configuração', () => {
  let pasta: string
  let caminho: string

  beforeEach(() => {
    pasta = mkdtempSync(join(tmpdir(), 'cf-config-'))
    caminho = join(pasta, 'configuracao.json')
  })

  afterEach(() => {
    rmSync(pasta, { recursive: true, force: true })
  })

  it('sem arquivo, devolve o padrão', () => {
    expect(lerConfiguracaoDe(caminho)).toEqual({ pastaDeBackupExterna: null })
  })

  it('salva e lê de volta', () => {
    salvarConfiguracaoEm(caminho, { pastaDeBackupExterna: 'C:\\Users\\enzob\\OneDrive\\FNox' })

    expect(lerConfiguracaoDe(caminho)).toEqual({
      pastaDeBackupExterna: 'C:\\Users\\enzob\\OneDrive\\FNox'
    })
  })

  it('não deixa arquivo temporário para trás', () => {
    salvarConfiguracaoEm(caminho, { pastaDeBackupExterna: 'X:\\pasta' })

    expect(readdirSync(pasta)).toEqual(['configuracao.json'])
  })

  it('arquivo estragado não quebra: volta ao padrão', () => {
    writeFileSync(caminho, '{ isto está quebrado')

    expect(lerConfiguracaoDe(caminho)).toEqual({ pastaDeBackupExterna: null })
  })

  it('salvar de novo substitui o valor anterior', () => {
    salvarConfiguracaoEm(caminho, { pastaDeBackupExterna: 'A:\\um' })
    salvarConfiguracaoEm(caminho, { pastaDeBackupExterna: null })

    expect(lerConfiguracaoDe(caminho)).toEqual({ pastaDeBackupExterna: null })
  })
})
