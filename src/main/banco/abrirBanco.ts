import Database from 'better-sqlite3'
import { criarBackupAutomaticoSeNecessario } from '../backup/backupAutomatico'
import { protegerBancoAntesDeMigrar } from '../backup/backupAntesDeMigrar'
import { lerConfiguracao } from '../configuracao/configuracaoDoApp'
import { obterCaminhoDoBanco, obterPastaDeBackups } from './caminhos'
import { executarMigracoes } from './migracoes/executarMigracoes'
import { listaDeMigracoes } from './migracoes/listaDeMigracoes'

// Falhar ao copiar (disco cheio, OneDrive fora do ar) não pode impedir o app de abrir. As duas
// cópias são independentes: se a da nuvem falhar, a local continua valendo.
function tentarCriarBackupAutomatico(
  banco: Database.Database,
  pasta: string,
  origem: string
): void {
  try {
    criarBackupAutomaticoSeNecessario(banco, pasta)
  } catch (erro) {
    console.error(`Não foi possível criar o backup automático (${origem}):`, erro)
  }
}

function criarBackupsAutomaticos(banco: Database.Database): void {
  tentarCriarBackupAutomatico(banco, obterPastaDeBackups(), 'pasta do app')

  const { pastaDeBackupExterna } = lerConfiguracao()
  if (pastaDeBackupExterna) {
    tentarCriarBackupAutomatico(banco, pastaDeBackupExterna, 'pasta externa')
  }
}

export function abrirBanco(): Database.Database {
  const banco = new Database(obterCaminhoDoBanco())
  banco.pragma('journal_mode = WAL')
  banco.pragma('foreign_keys = ON')
  protegerBancoAntesDeMigrar(banco, listaDeMigracoes, obterPastaDeBackups())
  executarMigracoes(banco, listaDeMigracoes)
  criarBackupsAutomaticos(banco)
  return banco
}
