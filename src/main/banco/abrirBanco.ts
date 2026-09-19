import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { executarMigracoes } from './migracoes/executarMigracoes'
import { listaDeMigracoes } from './migracoes/listaDeMigracoes'

const NOME_ARQUIVO_BANCO = 'caixa-forte.db'

export function abrirBanco(): Database.Database {
  const caminhoDoArquivo = join(app.getPath('userData'), NOME_ARQUIVO_BANCO)
  const banco = new Database(caminhoDoArquivo)
  banco.pragma('journal_mode = WAL')
  banco.pragma('foreign_keys = ON')
  executarMigracoes(banco, listaDeMigracoes)
  return banco
}
