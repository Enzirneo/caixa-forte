const CENTAVOS_POR_REAL = 100
const CASAS_DECIMAIS = 2
const PADRAO_VALOR_BRASILEIRO = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/

export function converterTextoEmCentavos(texto: string): number | null {
  const textoLimpo = texto.replace(/R\$/gi, '').replace(/\s/g, '')
  const partes = PADRAO_VALOR_BRASILEIRO.exec(textoLimpo)
  if (!partes) return null

  const reais = Number(partes[1].replaceAll('.', ''))
  const centavos = Number((partes[2] ?? '').padEnd(CASAS_DECIMAIS, '0'))
  return reais * CENTAVOS_POR_REAL + centavos
}
