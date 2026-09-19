import type { Database } from 'better-sqlite3'
import { existsSync, mkdirSync, readdirSync, rmSync } from 'fs'
import { join } from 'path'
import { descreverEstadoDasMigracoes, type Migracao } from './migracoes/executarMigracoes'

const QUANTIDADE_DE_BACKUPS_MANTIDOS = 5
const PREFIXO_DO_BACKUP = 'caixa-forte-backup-'
const EXTENSAO_DO_BACKUP = '.db'

function montarNomeDoBackup(agora: Date, primeiraVersaoPendente: number): string {
  const instante = agora.toISOString().replace(/[:.]/g, '-')
  return `${PREFIXO_DO_BACKUP}${instante}-antes-da-v${primeiraVersaoPendente}${EXTENSAO_DO_BACKUP}`
}

function apagarBackupsAntigos(pastaDeBackups: string): void {
  const backupsDoMaisNovoAoMaisAntigo = readdirSync(pastaDeBackups)
    .filter((nome) => nome.startsWith(PREFIXO_DO_BACKUP) && nome.endsWith(EXTENSAO_DO_BACKUP))
    .sort()
    .reverse()

  backupsDoMaisNovoAoMaisAntigo
    .slice(QUANTIDADE_DE_BACKUPS_MANTIDOS)
    .forEach((nome) => rmSync(join(pastaDeBackups, nome)))
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

  if (!existsSync(pastaDeBackups)) mkdirSync(pastaDeBackups, { recursive: true })
  const caminhoDoBackup = join(pastaDeBackups, montarNomeDoBackup(agora, pendentes[0].versao))
  banco.prepare('VACUUM INTO ?').run(caminhoDoBackup)
  apagarBackupsAntigos(pastaDeBackups)
  return caminhoDoBackup
}
