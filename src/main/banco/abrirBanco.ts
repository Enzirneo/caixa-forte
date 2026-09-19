import Database from 'better-sqlite3'
import { criarBackupAutomaticoSeNecessario } from '../backup/backupAutomatico'
import { protegerBancoAntesDeMigrar } from '../backup/backupAntesDeMigrar'
import { obterCaminhoDoBanco, obterPastaDeBackups } from './caminhos'
import { executarMigracoes } from './migracoes/executarMigracoes'
import { listaDeMigracoes } from './migracoes/listaDeMigracoes'

// Falhar ao copiar (disco cheio, por exemplo) não pode impedir o app de abrir.
function tentarCriarBackupAutomatico(banco: Database.Database): void {
  try {
    criarBackupAutomaticoSeNecessario(banco, obterPastaDeBackups())
  } catch (erro) {
    console.error('Não foi possível criar o backup automático:', erro)
  }
}

export function abrirBanco(): Database.Database {
  const banco = new Database(obterCaminhoDoBanco())
  banco.pragma('journal_mode = WAL')
  banco.pragma('foreign_keys = ON')
  protegerBancoAntesDeMigrar(banco, listaDeMigracoes, obterPastaDeBackups())
  executarMigracoes(banco, listaDeMigracoes)
  tentarCriarBackupAutomatico(banco)
  return banco
}
