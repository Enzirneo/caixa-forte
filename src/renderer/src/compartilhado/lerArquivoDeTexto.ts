const CODIFICACAO_PADRAO = 'utf-8'
// O Excel em português salva CSV nesta codificação quando não se escolhe UTF-8.
const CODIFICACAO_DO_EXCEL_NO_WINDOWS = 'windows-1252'

export async function lerArquivoDeTexto(arquivo: File): Promise<string> {
  const bytes = await arquivo.arrayBuffer()
  try {
    return new TextDecoder(CODIFICACAO_PADRAO, { fatal: true }).decode(bytes)
  } catch {
    return new TextDecoder(CODIFICACAO_DO_EXCEL_NO_WINDOWS).decode(bytes)
  }
}
