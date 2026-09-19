import Database from 'better-sqlite3'
import { copyFileSync, existsSync, renameSync, rmSync } from 'fs'
import { join } from 'path'
import {
  EXTENSAO_DO_BACKUP,
  PREFIXO_DO_BACKUP_ANTES_DE_RESTAURAR,
  apagarBackupsAntigos,
  garantirPasta,
  montarInstanteParaNomeDeArquivo
} from './arquivosDeBackup'

const QUANTIDADE_DE_COPIAS_ANTES_DE_RESTAURAR_MANTIDAS = 5
const SUFIXOS_DO_MODO_WAL = ['-wal', '-shm']
const SUFIXO_DO_ARQUIVO_TEMPORARIO = '.restaurando'
const RESULTADO_DA_CHECAGEM_DE_INTEGRIDADE_OK = 'ok'

export type ResultadoDaValidacao =
  { valido: true; versao: number } | { valido: false; motivo: string }

export function criarBackupEm(banco: Database.Database, caminhoDoDestino: string): void {
  // O usuário já confirmou a substituição na janela de salvar; o SQLite recusa sobrescrever.
  if (existsSync(caminhoDoDestino)) rmSync(caminhoDoDestino)
  banco.prepare('VACUUM INTO ?').run(caminhoDoDestino)
}

function listarNomesDasTabelas(banco: Database.Database): string[] {
  const linhas = banco.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as {
    name: string
  }[]
  return linhas.map((linha) => linha.name)
}

function inspecionarBanco(
  banco: Database.Database,
  versaoMaximaSuportada: number
): ResultadoDaValidacao {
  const tabelas = listarNomesDasTabelas(banco)
  if (!tabelas.includes('migracoes_aplicadas') || !tabelas.includes('lancamentos')) {
    return { valido: false, motivo: 'Este arquivo não é um backup do Caixa Forte.' }
  }

  const { versao } = banco
    .prepare('SELECT MAX(versao) AS versao FROM migracoes_aplicadas')
    .get() as {
    versao: number | null
  }
  if (versao === null) {
    return { valido: false, motivo: 'Este arquivo não é um backup do Caixa Forte.' }
  }
  if (versao > versaoMaximaSuportada) {
    return {
      valido: false,
      motivo: 'Este backup é de uma versão mais nova do app. Atualize o app antes de restaurar.'
    }
  }

  const integridade = banco.pragma('integrity_check', { simple: true })
  if (integridade !== RESULTADO_DA_CHECAGEM_DE_INTEGRIDADE_OK) {
    return { valido: false, motivo: 'O arquivo de backup está danificado.' }
  }
  return { valido: true, versao }
}

export function validarArquivoDeBackup(
  caminhoDoBackup: string,
  versaoMaximaSuportada: number
): ResultadoDaValidacao {
  let backup: Database.Database | null = null
  try {
    backup = new Database(caminhoDoBackup, { readonly: true, fileMustExist: true })
    return inspecionarBanco(backup, versaoMaximaSuportada)
  } catch {
    return { valido: false, motivo: 'Este arquivo não é um backup do Caixa Forte.' }
  } finally {
    backup?.close()
  }
}

function substituirArquivoDoBanco(caminhoDoBackup: string, caminhoDoBanco: string): void {
  const temporario = `${caminhoDoBanco}${SUFIXO_DO_ARQUIVO_TEMPORARIO}`
  copyFileSync(caminhoDoBackup, temporario)
  SUFIXOS_DO_MODO_WAL.forEach((sufixo) => rmSync(`${caminhoDoBanco}${sufixo}`, { force: true }))
  renameSync(temporario, caminhoDoBanco)
}

// Guarda uma cópia dos dados atuais antes de trocá-los, e fecha o banco: quem chamar deve
// reiniciar o app, porque a conexão antiga deixa de valer.
export function restaurarBancoAPartirDoBackup(
  banco: Database.Database,
  caminhoDoBackup: string,
  caminhoDoBanco: string,
  pastaDeBackups: string,
  versaoMaximaSuportada: number,
  agora: Date = new Date()
): ResultadoDaValidacao {
  const validacao = validarArquivoDeBackup(caminhoDoBackup, versaoMaximaSuportada)
  if (!validacao.valido) return validacao

  garantirPasta(pastaDeBackups)
  const nomeDaCopia = `${PREFIXO_DO_BACKUP_ANTES_DE_RESTAURAR}${montarInstanteParaNomeDeArquivo(agora)}${EXTENSAO_DO_BACKUP}`
  criarBackupEm(banco, join(pastaDeBackups, nomeDaCopia))
  apagarBackupsAntigos(
    pastaDeBackups,
    PREFIXO_DO_BACKUP_ANTES_DE_RESTAURAR,
    QUANTIDADE_DE_COPIAS_ANTES_DE_RESTAURAR_MANTIDAS
  )

  banco.close()
  substituirArquivoDoBanco(caminhoDoBackup, caminhoDoBanco)
  return validacao
}
