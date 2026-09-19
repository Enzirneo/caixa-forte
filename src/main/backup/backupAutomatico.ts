import type { Database } from 'better-sqlite3'
import { join } from 'path'
import {
  EXTENSAO_DO_BACKUP,
  PREFIXO_DO_BACKUP_AUTOMATICO,
  apagarBackupsAntigos,
  extrairInstanteDoNome,
  garantirPasta,
  listarBackupsDoMaisNovoAoMaisAntigo,
  montarInstanteParaNomeDeArquivo
} from './arquivosDeBackup'

const DIAS_ENTRE_BACKUPS_AUTOMATICOS = 7
const QUANTIDADE_DE_BACKUPS_AUTOMATICOS_MANTIDOS = 8
const MILISSEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000

export function precisaDeBackupAutomatico(nomesDosBackups: string[], agora: Date): boolean {
  const instantes = nomesDosBackups
    .map((nome) => extrairInstanteDoNome(nome, PREFIXO_DO_BACKUP_AUTOMATICO))
    .filter((instante): instante is Date => instante !== null)
  if (instantes.length === 0) return true

  const maisRecente = Math.max(...instantes.map((instante) => instante.getTime()))
  return agora.getTime() - maisRecente >= DIAS_ENTRE_BACKUPS_AUTOMATICOS * MILISSEGUNDOS_POR_DIA
}

export function criarBackupAutomaticoAgora(
  banco: Database,
  pastaDeBackups: string,
  agora: Date = new Date()
): string {
  garantirPasta(pastaDeBackups)
  const nome = `${PREFIXO_DO_BACKUP_AUTOMATICO}${montarInstanteParaNomeDeArquivo(agora)}${EXTENSAO_DO_BACKUP}`
  const caminho = join(pastaDeBackups, nome)
  banco.prepare('VACUUM INTO ?').run(caminho)
  apagarBackupsAntigos(
    pastaDeBackups,
    PREFIXO_DO_BACKUP_AUTOMATICO,
    QUANTIDADE_DE_BACKUPS_AUTOMATICOS_MANTIDOS
  )
  return caminho
}

export function criarBackupAutomaticoSeNecessario(
  banco: Database,
  pastaDeBackups: string,
  agora: Date = new Date()
): string | null {
  const existentes = listarBackupsDoMaisNovoAoMaisAntigo(
    pastaDeBackups,
    PREFIXO_DO_BACKUP_AUTOMATICO
  )
  if (!precisaDeBackupAutomatico(existentes, agora)) return null

  return criarBackupAutomaticoAgora(banco, pastaDeBackups, agora)
}
