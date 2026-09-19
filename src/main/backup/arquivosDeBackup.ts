import { existsSync, mkdirSync, readdirSync, rmSync } from 'fs'
import { join } from 'path'

export const PREFIXO_DO_BACKUP_ANTES_DE_MIGRAR = 'caixa-forte-backup-'
export const PREFIXO_DO_BACKUP_AUTOMATICO = 'caixa-forte-auto-'
export const PREFIXO_DO_BACKUP_ANTES_DE_RESTAURAR = 'caixa-forte-antes-de-restaurar-'
export const EXTENSAO_DO_BACKUP = '.db'

const PADRAO_DO_INSTANTE_NO_NOME = /^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z/

export function montarInstanteParaNomeDeArquivo(agora: Date): string {
  return agora.toISOString().replace(/[:.]/g, '-')
}

export function extrairInstanteDoNome(nome: string, prefixo: string): Date | null {
  if (!nome.startsWith(prefixo)) return null

  const partes = PADRAO_DO_INSTANTE_NO_NOME.exec(nome.slice(prefixo.length))
  if (!partes) return null

  const [, data, hora, minuto, segundo, milissegundo] = partes
  const instante = new Date(`${data}T${hora}:${minuto}:${segundo}.${milissegundo}Z`)
  return Number.isNaN(instante.getTime()) ? null : instante
}

export function garantirPasta(pasta: string): void {
  if (!existsSync(pasta)) mkdirSync(pasta, { recursive: true })
}

export function listarBackupsDoMaisNovoAoMaisAntigo(pasta: string, prefixo: string): string[] {
  if (!existsSync(pasta)) return []
  return readdirSync(pasta)
    .filter((nome) => nome.startsWith(prefixo) && nome.endsWith(EXTENSAO_DO_BACKUP))
    .sort()
    .reverse()
}

export function apagarBackupsAntigos(
  pasta: string,
  prefixo: string,
  quantidadeMantida: number
): void {
  listarBackupsDoMaisNovoAoMaisAntigo(pasta, prefixo)
    .slice(quantidadeMantida)
    .forEach((nome) => rmSync(join(pasta, nome)))
}
