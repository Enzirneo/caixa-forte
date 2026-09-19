import { app } from 'electron'
import { join } from 'path'

const NOME_ARQUIVO_BANCO = 'caixa-forte.db'
const NOME_PASTA_DE_BACKUPS = 'backups'

export function obterCaminhoDoBanco(): string {
  return join(app.getPath('userData'), NOME_ARQUIVO_BANCO)
}

export function obterPastaDeBackups(): string {
  return join(app.getPath('userData'), NOME_PASTA_DE_BACKUPS)
}
