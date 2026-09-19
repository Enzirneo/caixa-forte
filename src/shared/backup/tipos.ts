export interface BackupAutomatico {
  nome: string
  criadoEm: string
}

export interface InformacoesDeBackup {
  pastaDeBackups: string
  automaticos: BackupAutomatico[]
  pastaExterna: string | null
  ultimoBackupExterno: string | null
}

export type ResultadoDaRestauracao = 'reiniciando' | 'cancelado'

export interface ApiBackup {
  informacoes: () => Promise<InformacoesDeBackup>
  criar: () => Promise<string | null>
  restaurar: () => Promise<ResultadoDaRestauracao>
  abrirPasta: () => Promise<void>
  escolherPastaExterna: () => Promise<InformacoesDeBackup>
  removerPastaExterna: () => Promise<InformacoesDeBackup>
  copiarParaPastaExterna: () => Promise<string>
}
