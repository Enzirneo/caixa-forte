import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { protegerBancoAntesDeMigrar } from './backupAntesDeMigrar'
import { executarMigracoes } from './migracoes/executarMigracoes'
import { listaDeMigracoes } from './migracoes/listaDeMigracoes'

const NOME_ARQUIVO_BANCO = 'caixa-forte.db'
const NOME_PASTA_DE_BACKUPS = 'backups'

export function abrirBanco(): Database.Database {
  const pastaDeDados = app.getPath('userData')
  const banco = new Database(join(pastaDeDados, NOME_ARQUIVO_BANCO))
  banco.pragma('journal_mode = WAL')
  banco.pragma('foreign_keys = ON')
  protegerBancoAntesDeMigrar(banco, listaDeMigracoes, join(pastaDeDados, NOME_PASTA_DE_BACKUPS))
  executarMigracoes(banco, listaDeMigracoes)
  return banco
}
