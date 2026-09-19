import Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import { executarMigracoes, type Migracao } from './executarMigracoes'

const criarTabelaA: Migracao = {
  versao: 1,
  descricao: 'cria tabela a',
  sql: 'CREATE TABLE a (id INTEGER PRIMARY KEY)'
}
const criarTabelaB: Migracao = {
  versao: 2,
  descricao: 'cria tabela b',
  sql: 'CREATE TABLE b (id INTEGER PRIMARY KEY)'
}

function listarTabelas(banco: Database.Database): string[] {
  const linhas = banco
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
    .all() as { name: string }[]
  return linhas.map((linha) => linha.name)
}

describe('executarMigracoes', () => {
  let banco: Database.Database

  beforeEach(() => {
    banco = new Database(':memory:')
  })

  it('aplica as migrations pendentes em ordem de versão', () => {
    const aplicadas = executarMigracoes(banco, [criarTabelaB, criarTabelaA])

    expect(aplicadas).toBe(2)
    expect(listarTabelas(banco)).toEqual(expect.arrayContaining(['a', 'b']))
  })

  it('não reaplica migration já aplicada', () => {
    executarMigracoes(banco, [criarTabelaA])
    const aplicadas = executarMigracoes(banco, [criarTabelaA, criarTabelaB])

    expect(aplicadas).toBe(1)
  })

  it('preserva os dados existentes ao aplicar novas migrations', () => {
    executarMigracoes(banco, [criarTabelaA])
    banco.prepare('INSERT INTO a (id) VALUES (42)').run()

    executarMigracoes(banco, [criarTabelaA, criarTabelaB])

    expect(banco.prepare('SELECT id FROM a').get()).toEqual({ id: 42 })
  })

  it('desfaz a migration inteira se o SQL falhar', () => {
    const comErro: Migracao = {
      versao: 3,
      descricao: 'falha no meio',
      sql: 'CREATE TABLE c (id INTEGER); INSERT INTO tabela_inexistente VALUES (1)'
    }

    expect(() => executarMigracoes(banco, [comErro])).toThrow()
    expect(listarTabelas(banco)).not.toContain('c')
  })

  it('rejeita versões repetidas', () => {
    expect(() => executarMigracoes(banco, [criarTabelaA, criarTabelaA])).toThrow('mesma versão')
  })
})
