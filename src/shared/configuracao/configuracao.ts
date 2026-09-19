export interface Configuracao {
  pastaDeBackupExterna: string | null
}

export const CONFIGURACAO_PADRAO: Configuracao = { pastaDeBackupExterna: null }

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

// Um arquivo ausente, vazio ou estragado nunca pode impedir o app de abrir: volta ao padrão.
export function interpretarConfiguracao(texto: string | null): Configuracao {
  if (texto === null) return CONFIGURACAO_PADRAO

  try {
    const conteudo: unknown = JSON.parse(texto)
    if (!ehObjeto(conteudo)) return CONFIGURACAO_PADRAO

    const pasta = conteudo.pastaDeBackupExterna
    const pastaValida = typeof pasta === 'string' && pasta.trim() !== ''
    return { pastaDeBackupExterna: pastaValida ? pasta.trim() : null }
  } catch {
    return CONFIGURACAO_PADRAO
  }
}

export function serializarConfiguracao(configuracao: Configuracao): string {
  return JSON.stringify(configuracao, null, 2)
}
