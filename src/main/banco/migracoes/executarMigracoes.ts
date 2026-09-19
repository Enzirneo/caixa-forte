import type { Database } from 'better-sqlite3'

export interface Migracao {
  versao: number
  descricao: string
  sql: string
}

const TABELA_CONTROLE = 'migracoes_aplicadas'

function criarTabelaDeControle(banco: Database): void {
  banco.exec(`
    CREATE TABLE IF NOT EXISTS ${TABELA_CONTROLE} (
      versao INTEGER PRIMARY KEY,
      descricao TEXT NOT NULL,
      aplicada_em TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
}

function buscarVersoesAplicadas(banco: Database): Set<number> {
  const linhas = banco.prepare(`SELECT versao FROM ${TABELA_CONTROLE}`).all() as {
    versao: number
  }[]
  return new Set(linhas.map((linha) => linha.versao))
}

function validarVersoesUnicas(migracoes: Migracao[]): void {
  const versoes = migracoes.map((migracao) => migracao.versao)
  if (new Set(versoes).size !== versoes.length) {
    throw new Error('Existem migrations com a mesma versão')
  }
}

function aplicarMigracao(banco: Database, migracao: Migracao): void {
  const aplicarEmTransacao = banco.transaction(() => {
    banco.exec(migracao.sql)
    banco
      .prepare(`INSERT INTO ${TABELA_CONTROLE} (versao, descricao) VALUES (?, ?)`)
      .run(migracao.versao, migracao.descricao)
  })
  aplicarEmTransacao()
}

export function executarMigracoes(banco: Database, migracoes: Migracao[]): number {
  validarVersoesUnicas(migracoes)
  criarTabelaDeControle(banco)

  const versoesAplicadas = buscarVersoesAplicadas(banco)
  const pendentes = migracoes
    .filter((migracao) => !versoesAplicadas.has(migracao.versao))
    .sort((a, b) => a.versao - b.versao)

  pendentes.forEach((migracao) => aplicarMigracao(banco, migracao))
  return pendentes.length
}
