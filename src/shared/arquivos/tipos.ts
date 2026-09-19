export interface ApiArquivos {
  salvarTexto: (nomeSugerido: string, conteudo: string) => Promise<string | null>
}

export const CANAIS_ARQUIVOS = {
  salvarTexto: 'arquivos:salvar-texto'
} as const
