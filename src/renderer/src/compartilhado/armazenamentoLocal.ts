// O armazenamento do navegador pode estar indisponível; nesse caso o app funciona sem lembrar
// as preferências de visual.
export function lerDoArmazenamentoLocal(chave: string): string | null {
  try {
    return window.localStorage.getItem(chave)
  } catch {
    return null
  }
}

export function salvarNoArmazenamentoLocal(chave: string, valor: string): void {
  try {
    window.localStorage.setItem(chave, valor)
  } catch {
    // Sem armazenamento, a preferência vale só até fechar o app.
  }
}
