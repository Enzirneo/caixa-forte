const PREFIXO_DO_ELECTRON = /^Error invoking remote method '[^']*': (Error: )?/

export function extrairMensagemDeErro(erro: unknown): string {
  const mensagem = erro instanceof Error ? erro.message : String(erro)
  return mensagem.replace(PREFIXO_DO_ELECTRON, '')
}
