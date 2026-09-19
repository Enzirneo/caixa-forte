import type { Migracao } from './executarMigracoes'

export const listaDeMigracoes: Migracao[] = [
  {
    versao: 1,
    descricao: 'cria tabela de lançamentos',
    sql: `
      CREATE TABLE lancamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        descricao TEXT NOT NULL,
        valor_centavos INTEGER NOT NULL CHECK (valor_centavos > 0),
        data TEXT NOT NULL,
        tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
        categoria TEXT NOT NULL
      )
    `
  }
]
