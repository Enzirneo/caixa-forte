import { CENTESIMOS_POR_PERCENTUAL, type PeriodicidadeDaTaxa } from './tipos'

const CASAS_DECIMAIS_DA_TAXA = 2
const PADRAO_TAXA_BRASILEIRA = /^(\d+)(?:,(\d{1,2}))?$/

const SUFIXO_DA_PERIODICIDADE: Record<PeriodicidadeDaTaxa, string> = {
  mensal: 'ao mês',
  anual: 'ao ano'
}

export function converterTextoEmCentesimosDePercentual(texto: string): number | null {
  const textoLimpo = texto.replace('%', '').replace(/\s/g, '')
  const partes = PADRAO_TAXA_BRASILEIRA.exec(textoLimpo)
  if (!partes) return null

  const inteiro = Number(partes[1])
  const fracao = Number((partes[2] ?? '').padEnd(CASAS_DECIMAIS_DA_TAXA, '0'))
  return inteiro * CENTESIMOS_POR_PERCENTUAL + fracao
}

export function formatarTaxa(
  taxaRendimentoCentesimos: number,
  periodicidadeDaTaxa: PeriodicidadeDaTaxa
): string {
  const inteiro = Math.trunc(taxaRendimentoCentesimos / CENTESIMOS_POR_PERCENTUAL)
  const fracao = String(taxaRendimentoCentesimos % CENTESIMOS_POR_PERCENTUAL).padStart(
    CASAS_DECIMAIS_DA_TAXA,
    '0'
  )
  return `${inteiro},${fracao}% ${SUFIXO_DA_PERIODICIDADE[periodicidadeDaTaxa]}`
}
