export const PREFERENCIAS_DE_TEMA = ['claro', 'escuro', 'automatico'] as const

export type PreferenciaDeTema = (typeof PREFERENCIAS_DE_TEMA)[number]
export type TemaAplicado = 'claro' | 'escuro'

export const PREFERENCIA_PADRAO_DE_TEMA: PreferenciaDeTema = 'claro'

export function resolverTema(
  preferencia: PreferenciaDeTema,
  sistemaPrefereEscuro: boolean
): TemaAplicado {
  if (preferencia === 'automatico') return sistemaPrefereEscuro ? 'escuro' : 'claro'
  return preferencia
}

export function interpretarPreferenciaSalva(valorSalvo: string | null): PreferenciaDeTema {
  const preferenciaValida = PREFERENCIAS_DE_TEMA.find((preferencia) => preferencia === valorSalvo)
  return preferenciaValida ?? PREFERENCIA_PADRAO_DE_TEMA
}
