import type { Database } from 'better-sqlite3'
import { join } from 'path'
import { descreverEstadoDasMigracoes, type Migracao } from '../banco/migracoes/executarMigracoes'
import {
  EXTENSAO_DO_BACKUP,
  PREFIXO_DO_BACKUP_ANTES_DE_MIGRAR,
  apagarBackupsAntigos,
  garantirPasta,
  montarInstanteParaNomeDeArquivo
} from './arquivosDeBackup'

const QUANTIDADE_DE_BACKUPS_MANTIDOS = 5

function montarNomeDoBackup(agora: Date, primeiraVersaoPendente: number): string {
  const instante = montarInstanteParaNomeDeArquivo(agora)
  return `${PREFIXO_DO_BACKUP_ANTES_DE_MIGRAR}${instante}-antes-da-v${primeiraVersaoPendente}${EXTENSAO_DO_BACKUP}`
}

export function protegerBancoAntesDeMigrar(
  banco: Database,
  migracoes: Migracao[],
  pastaDeBackups: string,
  agora: Date = new Date()
): string | null {
  const { quantidadeAplicadas, pendentes } = descreverEstadoDasMigracoes(banco, migracoes)
  const bancoNovo = quantidadeAplicadas === 0
  if (bancoNovo || pendentes.length === 0) return null

  garantirPasta(pastaDeBackups)
  const caminhoDoBackup = join(pastaDeBackups, montarNomeDoBackup(agora, pendentes[0].versao))
  banco.prepare('VACUUM INTO ?').run(caminhoDoBackup)
  apagarBackupsAntigos(
    pastaDeBackups,
    PREFIXO_DO_BACKUP_ANTES_DE_MIGRAR,
    QUANTIDADE_DE_BACKUPS_MANTIDOS
  )
  return caminhoDoBackup
}
