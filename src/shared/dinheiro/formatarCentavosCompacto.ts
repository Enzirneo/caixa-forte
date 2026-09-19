const CENTAVOS_POR_REAL = 100
const UM_MIL = 1_000
const UM_MILHAO = 1_000_000

function formatarComUmaCasa(valor: number): string {
  return valor.toFixed(1).replace('.', ',').replace(/,0$/, '')
}

// Só para rótulos de gráfico, onde o número inteiro não cabe. Nunca use para calcular.
export function formatarCentavosCompacto(centavos: number): string {
  const reais = Math.abs(centavos) / CENTAVOS_POR_REAL
  const sinal = centavos < 0 ? '-' : ''

  if (reais >= UM_MILHAO) return `${sinal}R$ ${formatarComUmaCasa(reais / UM_MILHAO)} mi`
  if (reais >= UM_MIL) return `${sinal}R$ ${formatarComUmaCasa(reais / UM_MIL)} mil`
  return `${sinal}R$ ${Math.round(reais)}`
}
