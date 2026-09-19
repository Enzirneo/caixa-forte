import Database from 'better-sqlite3'
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { protegerBancoAntesDeMigrar } from './backupAntesDeMigrar'
import { executarMigracoes, type Migracao } from '../banco/migracoes/executarMigracoes'

const criarTabela: Migracao = {
  versao: 1,
  descricao: 'cria tabela',
  sql: 'CREATE TABLE itens (id INTEGER PRIMARY KEY, nome TEXT)'
}
const adicionarColuna: Migracao = {
  versao: 2,
  descricao: 'adiciona coluna',
  sql: 'ALTER TABLE itens ADD COLUMN cor TEXT'
}

describe('protegerBancoAntesDeMigrar', () => {
  let pasta: string
  let pastaDeBackups: string
  let banco: Database.Database

  beforeEach(() => {
    pasta = mkdtempSync(join(tmpdir(), 'cf-backup-'))
    pastaDeBackups = join(pasta, 'backups')
    banco = new Database(join(pasta, 'principal.db'))
  })

  afterEach(() => {
    banco.close()
    rmSync(pasta, { recursive: true, force: true })
  })

  it('não cria backup em banco novo', () => {
    const caminho = protegerBancoAntesDeMigrar(banco, [criarTabela], pastaDeBackups)

    expect(caminho).toBeNull()
    expect(existsSync(pastaDeBackups)).toBe(false)
  })

  it('não cria backup quando não há migration pendente', () => {
    executarMigracoes(banco, [criarTabela])

    expect(protegerBancoAntesDeMigrar(banco, [criarTabela], pastaDeBackups)).toBeNull()
  })

  it('copia o banco com os dados antes de aplicar migration nova', () => {
    executarMigracoes(banco, [criarTabela])
    banco.prepare("INSERT INTO itens (nome) VALUES ('importante')").run()

    const caminho = protegerBancoAntesDeMigrar(
      banco,
      [criarTabela, adicionarColuna],
      pastaDeBackups
    )

    const copia = new Database(caminho as string, { readonly: true })
    expect(copia.prepare('SELECT nome FROM itens').all()).toEqual([{ nome: 'importante' }])
    copia.close()
  })

  it('mantém só os 5 backups mais recentes', () => {
    executarMigracoes(banco, [criarTabela])

    for (let dia = 1; dia <= 7; dia++) {
      protegerBancoAntesDeMigrar(
        banco,
        [criarTabela, adicionarColuna],
        pastaDeBackups,
        new Date(Date.UTC(2026, 0, dia))
      )
    }

    const nomes = readdirSync(pastaDeBackups).sort()
    expect(nomes).toHaveLength(5)
    expect(nomes[0]).toContain('2026-01-03')
  })
})
