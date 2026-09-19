import type { Migracao } from './executarMigracoes'

const AGORA_COM_MILISSEGUNDOS = "strftime('%Y-%m-%d %H:%M:%f', 'now')"

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
  },
  {
    versao: 2,
    descricao: 'registra alteração dos lançamentos e cria fechamentos de mês',
    sql: `
      ALTER TABLE lancamentos ADD COLUMN alterado_em TEXT NOT NULL DEFAULT '';
      UPDATE lancamentos SET alterado_em = ${AGORA_COM_MILISSEGUNDOS};
      CREATE TABLE fechamentos_meses (
        mes TEXT PRIMARY KEY,
        fechado_em TEXT NOT NULL,
        receitas_centavos INTEGER NOT NULL,
        despesas_centavos INTEGER NOT NULL
      );
    `
  }
]
