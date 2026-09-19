const TIPO_DO_ARQUIVO_CSV = 'text/csv;charset=utf-8'

export function baixarArquivoDeTexto(nomeDoArquivo: string, conteudo: string): void {
  const endereco = URL.createObjectURL(new Blob([conteudo], { type: TIPO_DO_ARQUIVO_CSV }))
  const link = document.createElement('a')
  link.href = endereco
  link.download = nomeDoArquivo
  link.click()
  URL.revokeObjectURL(endereco)
}
